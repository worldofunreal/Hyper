// @ts-ignore - adm-zip has no types
import AdmZip from 'adm-zip'
import type { IpcMain, BrowserWindow } from 'electron'
import { app } from 'electron'
import { exec } from 'child_process'
import https from 'https'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

// Multi-title launcher — generic catalog driven by version.json shapes.

type GameSlug = 'cosmicrafts' | 'shadows-of-war' | 'nftropoly' | string

interface VersionEntry {
  version: string
  url: string
  name?: string
  changelog?: string
  size?: number
  checksum?: string
}

const CATALOG: Record<GameSlug, { versionUrl: string; dirName: string; execMap: Record<string, string> }> = {
  'cosmicrafts': {
    versionUrl: 'https://cosmicrafts.com/version.json',
    dirName: 'Cosmicrafts',
    execMap: {
      darwin: 'Cosmicrafts.app',
      win32: 'Cosmicrafts/Cosmicrafts.exe',
      linux: 'Cosmicrafts/Cosmicrafts.x86_64'
    }
  },
  'shadows-of-war': {
    versionUrl: 'https://shadowsofwar.io/version.json',
    dirName: 'ShadowsOfWar',
    execMap: {
      darwin: 'ShadowsOfWar.app',
      win32: 'ShadowsOfWar/ShadowsOfWar.exe',
      linux: 'ShadowsOfWar/ShadowsOfWar.x86_64'
    }
  },
  'nftropoly': {
    versionUrl: 'https://nftropoly.com/version.json',
    dirName: 'NFTropoly',
    execMap: {
      darwin: 'NFTropoly.app',
      win32: 'NFTropoly/NFTropoly.exe',
      linux: 'NFTropoly/NFTropoly.x86_64'
    }
  }
}

function platformKey(): string {
  switch (process.platform) {
    case 'darwin': return 'Mac'
    case 'win32': return 'Windows'
    case 'linux': return 'Linux'
    default: throw new Error('Unsupported platform')
  }
}

function gameDir(slug: GameSlug): string {
  const entry = CATALOG[slug]
  const dirName = entry?.dirName ?? slug
  return path.join(app.getPath('userData'), dirName)
}

async function fetchVersionEntry(slug: GameSlug): Promise<VersionEntry> {
  const entry = CATALOG[slug]
  if (!entry) throw new Error(`Unknown game slug: ${slug}`)
  const json = await new Promise<any>((resolve, reject) => {
    https.get(entry.versionUrl, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`version.json HTTP ${res.statusCode}`))
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
  const key = platformKey()
  const ver = json[key] ?? json[slug] ?? json
  if (!ver?.version || !ver?.url) throw new Error(`Version entry missing for ${slug}/${key}`)
  return ver as VersionEntry
}

async function readLocal(slug: GameSlug): Promise<VersionEntry> {
  try {
    const p = path.join(gameDir(slug), 'version.json')
    return JSON.parse(await fs.readFile(p, 'utf8'))
  } catch { return { version: '0.0.0', url: '' } }
}

function shouldUpdate(local: string, remote: string): boolean {
  const a = local.split('.').map(Number)
  const b = remote.split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0, bv = b[i] ?? 0
    if (bv > av) return true
    if (bv < av) return false
  }
  return false
}

async function download(url: string, win: BrowserWindow, slug: string): Promise<string> {
  const zipPath = path.join(os.tmpdir(), `hyper-${slug}-${Date.now()}.zip`)
  const file = fs.createWriteStream(zipPath)
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const total = parseInt(res.headers['content-length'] ?? '0', 10)
      let got = 0
      res.on('data', (chunk: Buffer) => {
        got += chunk.length
        if (total) {
          const pct = (got / total) * 100
          win.webContents.send('launcher:progress', { slug, pct: Number(pct.toFixed(1)), got, total })
        }
      })
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve(zipPath)))
    }).on('error', reject)
  })
}

async function extract(zipPath: string, slug: string): Promise<void> {
  const dir = gameDir(slug)
  await fs.ensureDir(dir)
  const zip = new AdmZip(zipPath)
  zip.extractAllTo(dir, true)
  if (process.platform === 'darwin') {
    const appPath = path.join(dir, `${CATALOG[slug]?.dirName ?? slug}.app`)
    if (await fs.pathExists(appPath)) await new Promise<void>((res, rej) => exec(`chmod -R 755 "${appPath}"`, (e) => e ? rej(e) : res()))
  }
  if (process.platform === 'linux') {
    const bin = path.join(dir, CATALOG[slug]?.execMap.linux ?? '')
    if (bin && await fs.pathExists(bin)) await new Promise<void>((res, rej) => exec(`chmod +x "${bin}"`, (e) => e ? rej(e) : res()))
  }
  await fs.remove(zipPath)
}

export function registerLauncherIpc(ipcMain: IpcMain) {
  ipcMain.handle('launcher:get-catalog', () => {
    return Object.entries(CATALOG).map(([slug, v]) => ({ slug, versionUrl: v.versionUrl, dir: gameDir(slug) }))
  })

  ipcMain.handle('launcher:check', async (_e, slug: string) => {
    const local = await readLocal(slug)
    try {
      const remote = await fetchVersionEntry(slug)
      return { local, remote, update: shouldUpdate(local.version, remote.version) }
    } catch (err: any) {
      return { local, remote: null, update: false, error: err.message }
    }
  })

  ipcMain.handle('launcher:update', async (e, slug: string) => {
    const win = (e as any).sender ? (await import('electron')).BrowserWindow.fromWebContents((e as any).sender) : null
    if (!win) throw new Error('No window')
    const remote = await fetchVersionEntry(slug)
    win.webContents.send('launcher:status', { slug, status: 'downloading', message: `Downloading ${remote.version}...` })
    const zip = await download(remote.url, win, slug)
    win.webContents.send('launcher:status', { slug, status: 'unpacking', message: 'Unpacking...' })
    await extract(zip, slug)
    await fs.writeJson(path.join(gameDir(slug), 'version.json'), remote, { spaces: 2 })
    win.webContents.send('launcher:status', { slug, status: 'ready', message: `Updated to ${remote.version}` })
    return remote
  })

  ipcMain.handle('launcher:launch', async (_e, slug: string) => {
    const dir = gameDir(slug)
    if (!await fs.pathExists(dir)) throw new Error(`Not installed: ${slug}`)
    const execRel = CATALOG[slug]?.execMap[process.platform as string]
    if (!execRel) throw new Error('Unsupported platform')
    const target = path.join(dir, execRel)
    return new Promise((resolve, reject) => {
      const cmd = process.platform === 'darwin' ? `open "${target}"` : `"${target}"`
      exec(cmd, (err, stdout, stderr) => err ? reject(err) : resolve({ stdout, stderr }))
    })
  })

  ipcMain.handle('launcher:open-folder', async (_e, slug: string) => {
    const { shell } = await import('electron')
    await shell.openPath(gameDir(slug))
    return { ok: true }
  })
}
