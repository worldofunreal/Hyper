import type { IpcMain } from 'electron'
import Store from 'electron-store'

// Proxies wou-id via main to keep secrets out of renderer and allow future native wallet injection.
// Renderer never touches localStorage directly — main's electron-store is source of truth, mirrored to renderer via IPC.

export const ID_SERVER_URL = 'https://id.worldofunreal.com'
export const AUTH_HUB_CALLBACK_URL = 'https://worldofunreal.com/auth/callback'

export function registerAuthIpc(ipcMain: IpcMain, store: Store<any>) {
  ipcMain.handle('wou:get-session', () => {
    return {
      token: store.get('wou_session_token') as string | null,
      user: store.get('wou_user_data') as any | null
    }
  })

  ipcMain.handle('wou:set-session', (_e, { token, account }: { token: string; account: any }) => {
    store.set('wou_session_token', token)
    store.set('wou_user_data', account)
    return { ok: true }
  })

  ipcMain.handle('wou:clear-session', () => {
    store.delete('wou_session_token')
    store.delete('wou_user_data')
    return { ok: true }
  })

  // Generic proxy to avoid CORS + allow adding native headers later (e.g. Electron user-agent, hardware id)
  ipcMain.handle('wou:proxy', async (_e, { path, method = 'GET', body, headers }: { path: string; method?: string; body?: any; headers?: Record<string,string> }) => {
    const token = store.get('wou_session_token') as string | null
    const url = path.startsWith('http') ? path : `${ID_SERVER_URL}${path}`
    console.log(`[Hyper][main][proxy] ${method} ${path} token=${token ? token.slice(0, 8) + '...' : 'none'}`)
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {})
      },
      body: body ? JSON.stringify(body) : undefined
    })
    const text = await res.text()
    let json: any
    try { json = JSON.parse(text) } catch { json = text }
    console.log(`[Hyper][main][proxy] → ${res.status} ${res.ok ? 'OK' : 'ERR'} ${JSON.stringify(json).slice(0, 200)}`)
    return { ok: res.ok, status: res.status, data: json }
  })

  ipcMain.handle('wou:open-external', async (_e, url: string) => {
    const { shell } = await import('electron')
    await shell.openExternal(url)
    return { ok: true }
  })

  // OAuth: system browser + loopback http://127.0.0.1:0/callback
  ipcMain.handle('wou:oauth', async (_e, provider: string) => {
    const { shell } = await import('electron')
    const http = await import('http')
    console.log(`[Hyper][main][wou:oauth] start provider=${provider}`)

    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url ?? '/', `http://127.0.0.1`)
          console.log(`[Hyper][main][wou:oauth] loopback hit ${req.method} ${url.pathname}${url.search.slice(0, 120)}`)
          if (url.pathname !== '/callback') {
            res.writeHead(404); res.end('not found'); return
          }
          const sessionToken = url.searchParams.get('session_token')
          const accountRaw = url.searchParams.get('account')
          console.log(`[Hyper][main][wou:oauth] callback session_token=${sessionToken ? sessionToken.slice(0, 12) + '...' : 'MISSING'} account=${accountRaw ? accountRaw.slice(0, 60) + '...' : 'MISSING'}`)
          if (!sessionToken || !accountRaw) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end('<h1>OAuth error: missing session</h1><script>window.close()</script>')
            console.error('[Hyper][main][wou:oauth] missing session_token/account in callback')
            return
          }
          let account: any
          try { account = JSON.parse(decodeURIComponent(accountRaw)) } catch { account = JSON.parse(accountRaw) }
          store.set('wou_session_token', sessionToken)
          store.set('wou_user_data', account)
          console.log(`[Hyper][main][wou:oauth] stored session for @${account.username} id=${account.id.slice(0, 8)}...`)
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`<!doctype html><html><body style="font-family:system-ui;background:#02040a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><h2 style="color:#00f2ff">✓ Authenticated — return to Hyper</h2><p>You can close this window.</p><script>setTimeout(()=>window.close(),1200)</script></div></body></html>`)
          // give browser time to render then cleanup
          setTimeout(() => {
            try { server.close(); console.log('[Hyper][main][wou:oauth] loopback server closed, resolve') } catch {}
            resolve({ ok: true, data: { session_token: sessionToken, account } })
          }, 400)
        } catch (err: any) {
          console.error('[Hyper][main][wou:oauth] server handler error', err)
          try { server.close() } catch {}
          reject(err)
        }
      })

      server.listen(0, '127.0.0.1', () => {
        const addr: any = server.address()
        const port = addr.port
        const returnTo = `http://127.0.0.1:${port}/callback`
        const accountId = (store.get('wou_user_data') as any)?.id ?? ''
        const stateObj = { returnTo, accountId, provider }
        const b64 = Buffer.from(JSON.stringify(stateObj)).toString('base64url')
        // Provider only knows the registered hub URL, which forwards to our loopback.
        const loginUrl = `${ID_SERVER_URL}/api/v1/auth/oauth/login/${provider}?redirect_uri=${encodeURIComponent(AUTH_HUB_CALLBACK_URL)}&state=${encodeURIComponent(b64)}`
        console.log(`[Hyper][main][wou:oauth] loopback listening on ${returnTo}`)
        console.log(`[Hyper][main][wou:oauth] shell.openExternal → ${loginUrl.slice(0, 120)}...`)
        console.log(`[Hyper][main][wou:oauth] If this opens another Electron window, your xdg-open default is Electron — run: xdg-settings set default-web-browser firefox.desktop`)
        shell.openExternal(loginUrl).then(() => console.log('[Hyper][main][wou:oauth] shell.openExternal done')).catch(e => console.error('[Hyper][main][wou:oauth] shell.openExternal error', e))

        // timeout 5min
        setTimeout(() => {
          try { server.close() } catch {}
          console.error('[Hyper][main][wou:oauth] timeout — no callback in 5 min')
          reject(new Error('OAuth timeout — no callback in 5 min'))
        }, 5 * 60 * 1000)
      })

      server.on('error', (e) => { console.error('[Hyper][main][wou:oauth] server error', e); reject(e) })
    })
  })
}
