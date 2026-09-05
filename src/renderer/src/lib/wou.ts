// Identity client — uses window.hyper proxy in Electron, direct fetch on web.

export const ID_SERVER_URL = 'https://id.worldofunreal.com'
export const AUTH_HUB_CALLBACK_URL = 'https://worldofunreal.com/auth/callback'

export type GameContext = 'world_of_unreal' | 'shadows_of_war' | 'cosmicrafts' | 'nftropoly' | 'darkrift' | string
export type SocialProvider = 'discord' | 'google' | 'twitter' | 'meta'

export interface EmbeddedWallets {
  evm_address: string
  solana_address: string
  icp_principal: string
  btc_bech32_address?: string
  bitcoin_address?: string
  derived_at: number
}
export interface LinkedIdentity { provider: string; external_id: string; linked_at: number }
export interface UserProfile { avatar_url?: string; banner_url?: string; bio?: string; country?: string; custom_attributes?: Record<string, any> }
export interface CrossGameStats { sow_rank?: string; sow_elo?: number; cosmic_fleet_power?: number; nftropoly_wealth_index?: number; total_matches_played?: number }
export interface PlayerAccount {
  id: string; username: string; display_name: string; email?: string; newsletter_opt_in: boolean
  clan_tag?: string; clan_name?: string; clan_role?: string
  embedded_wallets: EmbeddedWallets; linked_identities: LinkedIdentity[]; profile: UserProfile; stats?: any; game_stats?: any
  followers_count?: number; following_count?: number; created_at: number; updated_at: number
}
export interface AuthResponse { status: string; account: PlayerAccount; session_token: string; is_new_account?: boolean }

function hasHyper(): boolean {
  return typeof window !== 'undefined' && !!(window as any).hyper?.proxy
}

async function proxy(path: string, init?: { method?: string; body?: any }): Promise<{ ok: boolean; status: number; data: any }> {
  if (hasHyper()) {
    return (window as any).hyper.proxy({ path, method: init?.method ?? 'GET', body: init?.body })
  }
  const token = localStorage.getItem('wou_session_token')
  const res = await fetch(`${ID_SERVER_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: init?.body ? JSON.stringify(init.body) : undefined
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

function consumeSessionFromUrl(): { token: string; account: PlayerAccount } | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const token = params.get('session_token')
  const accRaw = params.get('account')
  if (!token || !accRaw) return null
  try {
    const account = JSON.parse(decodeURIComponent(accRaw)) as PlayerAccount
    params.delete('session_token')
    params.delete('account')
    const clean = params.toString()
    window.history.replaceState({}, document.title, window.location.pathname + (clean ? `?${clean}` : '') + window.location.hash)
    return { token, account }
  } catch {
    return null
  }
}

export class WouClient {
  token: string | null = null
  user: PlayerAccount | null = null
  ctx: GameContext = 'world_of_unreal'

  constructor(ctx: GameContext = 'world_of_unreal') { this.ctx = ctx }

  async hydrate(): Promise<PlayerAccount | null> {
    // Hub return (web): ?session_token&account → persist immediately, then validate below.
    const fromUrl = consumeSessionFromUrl()
    if (fromUrl) await this.persist(fromUrl.token, fromUrl.account)

    if (hasHyper()) {
      const s = await (window as any).hyper.getSession()
      this.token = s.token; this.user = s.user
    } else {
      const t = localStorage.getItem('wou_session_token')
      const u = localStorage.getItem('wou_user_data')
      if (t && u) { try { this.token = t; this.user = JSON.parse(u) } catch { this.token = null; this.user = null } }
    }
    if (!this.token) return null
    // Boot: validate against /me. Old servers without /me return 404 → trust stored session.
    try {
      const me = await this.getMe()
      if (!me) { await this.clear(); return null }
    } catch {
      await this.clear(); return null
    }
    return this.user
  }

  async getMe(): Promise<PlayerAccount | null> {
    const r = await proxy('/api/v1/auth/me')
    if (r.status === 404) return this.user
    if (!r.ok) return null
    this.user = r.data as PlayerAccount
    if (hasHyper() && this.token) await (window as any).hyper.setSession(this.token, this.user)
    else if (this.token) localStorage.setItem('wou_user_data', JSON.stringify(this.user))
    return this.user
  }

  async refreshSession(): Promise<AuthResponse | null> {
    const r = await proxy('/api/v1/auth/refresh', { method: 'POST' })
    if (!r.ok) return null
    await this.persist(r.data.session_token, r.data.account)
    return r.data
  }

  // QR login: desktop shows code, authed phone approves. Secret required for status.
  async startQr(username?: string): Promise<{ id: string; approve_url: string; secret: string; expires_in_seconds: number; notified?: string[] }> {
    const r = await proxy('/api/v1/auth/qr/start', { method: 'POST', body: { context: this.ctx, username: username ?? '' } })
    if (!r.ok) throw new Error(r.data?.error ?? 'qr start failed')
    return r.data
  }
  async qrStatus(id: string, secret: string): Promise<{ status: string; account?: PlayerAccount; session_token?: string }> {
    const r = await proxy(`/api/v1/auth/qr/${encodeURIComponent(id)}/status`, { method: 'POST', body: { secret } })
    if (r.status === 410) return { status: 'expired' }
    if (!r.ok) throw new Error(r.data?.error ?? 'qr status failed')
    return r.data
  }
  async qrCancel(id: string, secret: string): Promise<void> {
    await proxy(`/api/v1/auth/qr/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { secret } })
  }

  async botLinkStart(): Promise<{ code: string; expires_in_seconds: number }> {
    const r = await proxy('/api/v1/bots/link/start', { method: 'POST' })
    if (!r.ok) throw new Error(r.data?.error ?? 'link code failed')
    return r.data
  }

  async botLinked(): Promise<{ telegram: boolean; discord: boolean; telegram_ids: string[]; discord_ids: string[] }> {
    const r = await proxy('/api/v1/bots/linked')
    if (!r.ok) return { telegram: false, discord: false, telegram_ids: [], discord_ids: [] }
    return r.data
  }

  async botUnlink(ns: 'tg' | 'dc', external_id: string): Promise<void> {
    const r = await proxy(`/api/v1/bots/link/${ns}`, { method: 'POST', body: { external_id } })
    if (!r.ok) throw new Error(r.data?.error ?? 'unlink failed')
  }

  async persist(token: string, account: PlayerAccount) {
    this.token = token; this.user = account
    if (hasHyper()) await (window as any).hyper.setSession(token, account)
    else { localStorage.setItem('wou_session_token', token); localStorage.setItem('wou_user_data', JSON.stringify(account)) }
    window.dispatchEvent(new CustomEvent('wou:auth', { detail: { user: account, token } }))
  }

  async clear() {
    try { await proxy('/api/v1/auth/logout', { method: 'POST' }) } catch {}
    this.token = null; this.user = null
    if (hasHyper()) await (window as any).hyper.clearSession()
    else { localStorage.removeItem('wou_session_token'); localStorage.removeItem('wou_user_data') }
    window.dispatchEvent(new CustomEvent('wou:auth', { detail: { user: null, token: null } }))
  }

  // Email OTP
  async requestOtp(email: string, newsletter = true): Promise<void> {
    const r = await proxy('/api/v1/auth/otp/request', { method: 'POST', body: { email, newsletter_opt_in: newsletter, context: this.ctx } })
    if (!r.ok) throw new Error(r.data?.error ?? 'otp request failed')
  }
  async verifyOtp(email: string, code: string): Promise<AuthResponse> {
    const r = await proxy('/api/v1/auth/otp/verify', { method: 'POST', body: { email, code, account_id: this.user?.id ?? null, context: this.ctx } })
    if (!r.ok) throw new Error(r.data?.error ?? 'otp verify failed')
    await this.persist(r.data.session_token, r.data.account)
    return r.data
  }

  async loginWithOAuth(provider: SocialProvider): Promise<AuthResponse> {
    if (typeof window !== 'undefined' && (window as any).hyper?.oauth) {
      const res = await (window as any).hyper.oauth(provider)
      if (!res?.ok) throw new Error(res?.data?.error ?? 'OAuth failed')
      const data = res.data as AuthResponse
      await this.persist(data.session_token, data.account)
      return data
    }
    const returnTo = window.location.href
    const payload = { returnTo, accountId: this.user?.id ?? '', provider }
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const url = `${ID_SERVER_URL}/api/v1/auth/oauth/login/${provider}?redirect_uri=${encodeURIComponent(AUTH_HUB_CALLBACK_URL)}&state=${encodeURIComponent(b64)}`
    if ((window as any).hyper?.openExternal) {
      await (window as any).hyper.openExternal(url)
      throw new Error('Complete sign-in in your browser')
    }
    window.location.href = url
    throw new Error('Redirecting…')
  }

  // Web3
  async loginWithEthereum(): Promise<AuthResponse> {
    const eth = (window as any).ethereum
    if (!eth) throw new Error('MetaMask not found')
    const [addr] = await eth.request({ method: 'eth_requestAccounts' })
    const ch = await proxy('/api/v1/auth/web3/challenge', { method: 'POST', body: { chain: 'ethereum', public_address: addr } })
    if (!ch.ok) throw new Error(ch.data?.error)
    const sig = await eth.request({ method: 'personal_sign', params: [ch.data.message, addr] })
    const v = await proxy('/api/v1/auth/web3/verify', { method: 'POST', body: { chain: 'ethereum', public_address: addr, signature: sig, message: ch.data.message, account_id: this.user?.id ?? null, context: this.ctx } })
    if (!v.ok) throw new Error(v.data?.error)
    await this.persist(v.data.session_token, v.data.account)
    return v.data
  }

  async loginWithSolana(): Promise<AuthResponse> {
    const phantom = (window as any).phantom?.solana ?? (window as any).solana
    if (!phantom?.isPhantom) throw new Error('Phantom not found')
    const { publicKey } = await phantom.connect()
    const addr = publicKey.toString()
    const ch = await proxy('/api/v1/auth/web3/challenge', { method: 'POST', body: { chain: 'solana', public_address: addr } })
    if (!ch.ok) throw new Error(ch.data?.error)
    const msg = new TextEncoder().encode(ch.data.message)
    const { signature } = await phantom.signMessage(msg, 'utf8')
    const hex = '0x' + Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2,'0')).join('')
    const v = await proxy('/api/v1/auth/web3/verify', { method: 'POST', body: { chain: 'solana', public_address: addr, signature: hex, message: ch.data.message, account_id: this.user?.id ?? null, context: this.ctx } })
    if (!v.ok) throw new Error(v.data?.error)
    await this.persist(v.data.session_token, v.data.account)
    return v.data
  }

  async loginWithInternetIdentity(): Promise<AuthResponse> {
    const { AuthClient } = await import('@dfinity/auth-client').catch(() => { throw new Error('Install @dfinity/auth-client') }) as any
    const ac = await AuthClient.create({ idleOptions: { disableDefaultIdleCallback: true, disableIdle: true } })
    return new Promise((resolve, reject) => {
      ac.login({
        identityProvider: 'https://id.ai/authorize',
        maxTimeToLive: BigInt(8) * BigInt(3_600_000_000_000),
        onSuccess: async () => {
          try {
            const principal = ac.getIdentity().getPrincipal().toText()
            const ch = await proxy('/api/v1/auth/web3/challenge', { method: 'POST', body: { chain: 'icp', public_address: principal } })
            if (!ch.ok) throw new Error(ch.data?.error)
            const v = await proxy('/api/v1/auth/web3/verify', { method: 'POST', body: { chain: 'icp', public_address: principal, signature: 'ICP_DELEGATION_PROVEN', message: ch.data.message, account_id: this.user?.id ?? null, context: this.ctx } })
            if (!v.ok) throw new Error(v.data?.error)
            await this.persist(v.data.session_token, v.data.account)
            resolve(v.data)
          } catch (e: any) { reject(e) }
        },
        onError: (e: any) => reject(new Error(e ?? 'II cancelled'))
      })
    })
  }

  // Search / clans / social
  async searchPlayers(q: string, limit=10): Promise<any[]> {
    if (!q.trim()) return []
    const r = await proxy(`/api/v1/user/search?q=${encodeURIComponent(q)}&limit=${limit}`)
    return r.ok ? r.data : []
  }
  async getClans(limit=20): Promise<any[]> {
    const r = await proxy(`/api/v1/clans/list?limit=${limit}`)
    return r.ok ? r.data : []
  }
  async getClan(tag: string): Promise<any|null> {
    const r = await proxy(`/api/v1/clans/${encodeURIComponent(tag)}`)
    return r.ok ? r.data : null
  }
  async createClan(tag: string, name: string, description: string): Promise<any> {
    const r = await proxy('/api/v1/clans/create', { method: 'POST', body: { tag, name, description, emblem_icon: '🛡️' } })
    if (!r.ok) throw new Error(r.data?.error)
    return r.data
  }
  async getFeed(limit=20): Promise<any[]> {
    const r = await proxy(`/api/v1/social/feed?limit=${limit}`)
    return r.ok ? r.data : []
  }
  async follow(id: string): Promise<void> {
    const r = await proxy(`/api/v1/social/follow/${encodeURIComponent(id)}`, { method: 'POST' })
    if (!r.ok) throw new Error(r.data?.error)
  }
}

export const wou = new WouClient('world_of_unreal')
