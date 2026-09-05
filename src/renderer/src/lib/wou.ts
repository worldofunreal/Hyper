// Hyper identity shell — 100% @worldofunreal/id underneath.
// This file is Electron plumbing only (main-process proxy, secure session
// store, desktop OAuth). All API logic lives in the npm package.
import {
  WouAuthClient,
  setFetchImpl,
  ID_SERVER_URL,
  AUTH_HUB_CALLBACK_URL,
  type GameContext,
  type SocialProvider,
  type PlayerAccount,
  type AuthResponse,
  type EmbeddedWallets,
  type LinkedIdentity,
  type UserProfile,
  type CrossGameStats,
} from '@worldofunreal/id';

export {
  ID_SERVER_URL,
  AUTH_HUB_CALLBACK_URL,
  type GameContext,
  type SocialProvider,
  type PlayerAccount,
  type AuthResponse,
  type EmbeddedWallets,
  type LinkedIdentity,
  type UserProfile,
  type CrossGameStats,
};

function hasHyper(): boolean {
  return typeof window !== 'undefined' && !!(window as any).hyper?.proxy;
}

// Route every SDK call through the Electron main-process proxy on desktop;
// plain fetch on web.
if (hasHyper()) {
  setFetchImpl(async (url, init) => {
    const path = String(url).replace(ID_SERVER_URL, '');
    let body: any = undefined;
    try {
      body = init?.body ? JSON.parse(init.body as string) : undefined;
    } catch {
      body = undefined;
    }
    const r = await (window as any).hyper.proxy({
      path,
      method: init?.method ?? 'GET',
      body,
    });
    return { ok: r.ok, status: r.status, json: async () => r.data } as Response;
  });
}

function emitAuth(user: PlayerAccount | null, token: string | null): void {
  window.dispatchEvent(new CustomEvent('wou:auth', { detail: { user, token } }));
}

class HyperClient extends WouAuthClient {
  public override setSession(token: string, account: PlayerAccount): void {
    super.setSession(token, account);
    if (hasHyper()) {
      (window as any).hyper.setSession(token, account)?.catch?.(() => {});
    }
    emitAuth(account, token);
  }

  public override logout(): void {
    super.logout();
    if (hasHyper()) {
      (window as any).hyper.clearSession()?.catch?.(() => {});
    }
    emitAuth(null, null);
  }

  // --- Back-compat surface (previous WouClient names) ---

  public async persist(token: string, account: PlayerAccount): Promise<void> {
    this.setSession(token, account);
  }

  public async clear(): Promise<void> {
    try {
      if (hasHyper()) {
        await (window as any).hyper.proxy({ path: '/api/v1/auth/logout', method: 'POST' });
      } else {
        const t = this.getSessionToken();
        await fetch(`${ID_SERVER_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        });
      }
    } catch {
      // best-effort: local wipe below is what matters
    }
    this.logout();
  }

  public async hydrate(): Promise<PlayerAccount | null> {
    this.initSession();
    if (hasHyper()) {
      try {
        const s = await (window as any).hyper.getSession();
        if (s?.token) this.setSession(s.token, s.user as PlayerAccount);
      } catch {
        // fall through to stored session
      }
    }
    if (!this.getSessionToken()) return null;
    // Boot: validate against /me. Null (unknown session) → wipe and start clean.
    try {
      const me = await this.getMe();
      if (!me) {
        await this.clear();
        return null;
      }
    } catch {
      await this.clear();
      return null;
    }
    return this.getUser();
  }

  public override async startQr(
    username?: string
  ): Promise<{
    id: string;
    approve_url: string;
    secret: string;
    expires_in_seconds: number;
    notified?: string[];
  }> {
    return super.startQr(username ? { username } : undefined);
  }

  public override async loginWithOAuth(provider: SocialProvider): Promise<void> {
    const bridge = typeof window !== 'undefined' ? (window as any).hyper : undefined;
    if (bridge?.oauth) {
      const res = await bridge.oauth(provider);
      if (!res?.ok) throw new Error(res?.data?.error ?? 'OAuth failed');
      const data = res.data as AuthResponse;
      this.setSession(data.session_token, data.account);
      return;
    }
    if (bridge?.openExternal) {
      const returnTo = window.location.href;
      const payload = { returnTo, accountId: this.getUser()?.id ?? '', provider };
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const url = `${ID_SERVER_URL}/api/v1/auth/oauth/login/${provider}?redirect_uri=${encodeURIComponent(
        AUTH_HUB_CALLBACK_URL
      )}&state=${encodeURIComponent(b64)}`;
      await bridge.openExternal(url);
      throw new Error('Complete sign-in in your browser');
    }
    super.loginWithOAuth(provider);
    throw new Error('Redirecting…');
  }
}

export const wou = new HyperClient('world_of_unreal');
