// ponytail: suppress Arch fontconfig 48-guessfamily xsi:nil spam — not our code, system conf broken
// native warnings go to fd 2 directly, JS filter can't catch them, but we silence our own logs and document the one-liner fix below
if (process.platform === 'linux') {
  process.env.FONTCONFIG_DEBUG = '0'
  // uncomment to nuke system warnings permanently: sudo sed -i '/xsi:nil/d' /etc/fonts/conf.d/48* /usr/share/fontconfig/conf.avail/48*
}

import { app, BrowserWindow, Menu, shell, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import { registerAuthIpc } from './ipc/auth.js'
import { registerLauncherIpc } from './ipc/launcher.js'

export const store = new Store<any>({
  name: 'hyper',
  defaults: {
    wou_session_token: null as string | null,
    wou_user_data: null as any,
    windowBounds: { width: 1280, height: 800 }
  }
})

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const bounds = store.get('windowBounds') as { width: number; height: number } | undefined
  mainWindow = new BrowserWindow({
    width: bounds?.width ?? 1280,
    height: bounds?.height ?? 800,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#02040a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'Hyper — World of Unreal',
    icon: join(__dirname, '../../icons/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('close', () => {
    if (mainWindow) {
      store.set('windowBounds', mainWindow.getBounds())
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    console.log(`[Hyper][main][windowOpenHandler] deny inside, open external → ${details.url.slice(0, 120)}`)
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => console.error(`[Hyper][main][did-fail-load] ${code} ${desc} ${url}`))

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  console.log('[Hyper][main] app ready — register IPC, store=', { hasToken: !!store.get('wou_session_token'), user: (store.get('wou_user_data') as any)?.username ?? 'none' })
  electronApp.setAppUserModelId('com.worldofunreal.hyper')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  registerAuthIpc(ipcMain, store)
  registerLauncherIpc(ipcMain)
  console.log('[Hyper][main] IPC registered: wou:get-session/set-session/clear-session/proxy/open-external/oauth + launcher:*')

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

Menu.setApplicationMenu(null)
