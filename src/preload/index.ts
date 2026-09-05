import { contextBridge, ipcRenderer } from 'electron'

export type WouSession = { token: string | null; user: any | null }

export interface HyperAPI {
  // identity
  getSession: () => Promise<WouSession>
  setSession: (token: string, account: any) => Promise<{ ok: true }>
  clearSession: () => Promise<{ ok: true }>
  proxy: (opts: { path: string; method?: string; body?: any; headers?: Record<string,string> }) => Promise<{ ok: boolean; status: number; data: any }>
  openExternal: (url: string) => Promise<{ ok: true }>
  oauth: (provider: string) => Promise<{ ok: boolean; data: any }>

  // launcher
  getCatalog: () => Promise<Array<{ slug: string; versionUrl: string; dir: string }>>
  checkGame: (slug: string) => Promise<{ local: any; remote: any | null; update: boolean; error?: string }>
  updateGame: (slug: string) => Promise<any>
  launchGame: (slug: string) => Promise<any>
  openGameFolder: (slug: string) => Promise<{ ok: true }>

  // events
  onLauncherProgress: (cb: (data: { slug: string; pct: number; got: number; total: number }) => void) => () => void
  onLauncherStatus: (cb: (data: { slug: string; status: string; message: string }) => void) => () => void
}

const api: HyperAPI = {
  getSession: () => ipcRenderer.invoke('wou:get-session'),
  setSession: (token, account) => ipcRenderer.invoke('wou:set-session', { token, account }),
  clearSession: () => ipcRenderer.invoke('wou:clear-session'),
  proxy: (opts) => ipcRenderer.invoke('wou:proxy', opts),
  openExternal: (url) => ipcRenderer.invoke('wou:open-external', url),
  oauth: (provider) => ipcRenderer.invoke('wou:oauth', provider),

  getCatalog: () => ipcRenderer.invoke('launcher:get-catalog'),
  checkGame: (slug) => ipcRenderer.invoke('launcher:check', slug),
  updateGame: (slug) => ipcRenderer.invoke('launcher:update', slug),
  launchGame: (slug) => ipcRenderer.invoke('launcher:launch', slug),
  openGameFolder: (slug) => ipcRenderer.invoke('launcher:open-folder', slug),

  onLauncherProgress: (cb) => {
    const h = (_: any, d: any) => cb(d)
    ipcRenderer.on('launcher:progress', h)
    return () => ipcRenderer.removeListener('launcher:progress', h)
  },
  onLauncherStatus: (cb) => {
    const h = (_: any, d: any) => cb(d)
    ipcRenderer.on('launcher:status', h)
    return () => ipcRenderer.removeListener('launcher:status', h)
  }
}

contextBridge.exposeInMainWorld('hyper', api)

declare global {
  interface Window { hyper: HyperAPI }
}
