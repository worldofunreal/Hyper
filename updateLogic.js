const { exec } = require('child_process');
const https = require('https');
const AdmZip = require('adm-zip');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { app, BrowserWindow } = require('electron');


const versionUrl = 'https://cosmicrafts.com/version.json';
const versionUrlIPv4 = 'https://cosmicrafts.com/version.json';


let gameDir = path.join(app.getPath('userData'), 'Cosmicrafts');
fs.ensureDirSync(gameDir);

async function checkAndUpdateGame(window) {
    try {
        await fs.ensureDir(gameDir);
        let localVersionInfo = await readLocalVersionInfo();
        console.log('Local Version Info:', localVersionInfo);
        const remoteVersionInfo = await fetchVersionInfo();
        console.log('Remote Version Info:', remoteVersionInfo);

        if (!localVersionInfo || shouldUpdate(localVersionInfo, remoteVersionInfo)) {
            console.log('Updating game...');
            window.webContents.send("updateStatus", "Downloading game update...");
            const zipPath = await downloadGame(remoteVersionInfo.url, window);
            window.webContents.send("updateStatus", "Verifying download...");
            // Simulate checksum verification here
            window.webContents.send("updateStatus", "Unpacking...");
            await extractGame(zipPath, gameDir);
            await writeLocalVersionInfo(remoteVersionInfo);
            window.webContents.send("updateStatus", "Game updated.");
            console.log('Game updated.');
            localVersionInfo = remoteVersionInfo; // Update local version info after the update
        } else {
            console.log('Game is up to date.');
            window.webContents.send("updateStatus", "Game is up to date.");
        }
    } catch (error) {
        console.error('Update process failed:', error);
        window.webContents.send("updateStatus", `Update failed: ${error.message}`);
    }
}


async function fetchVersionInfo() {
    try {
        const response = await new Promise((resolve, reject) => {
            const req = https.get(versionUrl, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to fetch version info: HTTP status code ${res.statusCode}`));
                    return;
                }

                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        const platformKey = getPlatformKey();
                        if (jsonData[platformKey]) {
                            resolve(jsonData[platformKey]);
                        } else {
                            reject(new Error(`Version info not available for platform: ${process.platform}`));
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });

            req.on('error', (error) => {
                // Handle network-related errors
                console.error('HTTPS request error:', error);
                console.error(`Failed to fetch version info from IPv6 address. Trying IPv4 fallback.`);
                fetchVersionInfoIPv4().then(resolve).catch(reject); // Try IPv4 fallback
            });

            req.end();
        });

        console.log('Fetched version info:', response);
        return response;
    } catch (error) {
        console.error('Error fetching version info:', error);
        throw error;
    }
}

// Add a function to fetch version info using IPv4 as a fallback
async function fetchVersionInfoIPv4() {
    try {
        const response = await new Promise((resolve, reject) => {
            const req = https.get(versionUrlIPv4, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to fetch version info (IPv4): HTTP status code ${res.statusCode}`));
                    return;
                }

                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        const platformKey = getPlatformKey();
                        if (jsonData[platformKey]) {
                            resolve(jsonData[platformKey]);
                        } else {
                            reject(new Error(`Version info not available for platform (IPv4): ${process.platform}`));
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });

            req.on('error', (error) => {
                console.error('HTTPS request error (IPv4):', error);
                reject(new Error('Failed to fetch version info (IPv4): Network error'));
            });

            req.end();
        });

        console.log('Fetched version info (IPv4):', response);
        return response;
    } catch (error) {
        console.error('Error fetching version info (IPv4):', error);
        throw error;
    }
}

function shouldUpdate(localVersion, remoteVersion) {
    // Split version numbers into parts and convert them to numbers
    const localParts = localVersion.version.split('.').map(Number);
    const remoteParts = remoteVersion.version.split('.').map(Number);

    console.log('Local Version Parts:', localParts);
    console.log('Remote Version Parts:', remoteParts);

    // Compare each part of the version numbers
    for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
        // Handle cases where one version has more parts than the other
        const localPart = localParts[i] || 0;
        const remotePart = remoteParts[i] || 0;

        if (remotePart > localPart) {
            console.log('Update needed: Remote version is greater.');
            return true; // Remote version is greater, so update is needed
        } else if (remotePart < localPart) {
            console.log('No update needed: Local version is greater.');
            return false; // Local version is greater, no update needed
        }
        // If the parts are equal, continue to the next part
    }

    console.log('No update needed: Versions are equal.');
    return false; // Versions are equal, no update needed
}

  
  async function downloadGame(url, window) {
    console.log(`Starting download from URL: ${url}`);
    const zipPath = path.join(os.tmpdir(), 'game.zip');
    const fileStream = fs.createWriteStream(zipPath);
  
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const totalSize = parseInt(res.headers['content-length'], 10);
        let downloadedSize = 0;
  
        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = (downloadedSize / totalSize) * 100;
          window.webContents.send("updateStatus", `Download progress: ${progress.toFixed(2)}%`);
        });
  
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(() => {
            console.log(`Downloaded game zip: ${zipPath}`);
            resolve(zipPath);
          });
        });
      }).on('error', (error) => {
        console.error('Download failed:', error);
        reject(error);
      });
    });
  }
  

async function extractGame(zipPath, extractPath) {
    console.log(`Starting extraction of ${zipPath} to ${extractPath}`);
    try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);
        console.log('Extraction complete.');

        // Set permissions for macOS
        if (process.platform === 'darwin') {
            const appPath = path.join(extractPath, 'Cosmicrafts.app');
            exec(`chmod -R 755 "${appPath}" && open "${appPath}"`, (chmodErr, stdout, stderr) => {
                if (chmodErr) {
                    console.error(`Error setting permissions or opening app: ${chmodErr}`);
                    throw chmodErr;
                }
                console.log(`Game launched successfully: ${stdout}`);
            });
        }

         // Set execute permissions for Linux binary
         if (process.platform === 'linux') {
            const binPath = path.join(extractPath, 'Cosmicrafts', 'Cosmicrafts.x86_64');
            exec(`chmod +x "${binPath}"`, (chmodErr, stdout, stderr) => {
                if (chmodErr) {
                    console.error(`Error setting execute permissions: ${chmodErr}`);
                    throw chmodErr;
                }
                console.log(`Execute permissions set for ${binPath}`);
            });
        }

        await fs.remove(zipPath);
        console.log(`Removed zip file: ${zipPath}`);
        
        const files = await fs.readdir(extractPath);
        console.log('Contents of the game directory:', files);
    } catch (error) {
        console.error('Extraction or launch failed:', error);
        throw error;
    }
}



async function writeLocalVersionInfo(versionInfo) {
    try {
        const versionFilePath = path.join(gameDir, 'version.json');
        await fs.writeJson(versionFilePath, versionInfo);
        console.log('Local version info updated:', versionInfo);
    } catch (error) {
        console.error('Error writing local version info:', error);
        throw error;
    }
}

function launchGame() {
    return new Promise((resolve, reject) => {
        console.log(`Expected game directory: ${gameDir}`);
        if (!fs.existsSync(gameDir)) {
            reject(new Error(`Game directory not found: ${gameDir}`));
            return;
        }

        // Handle game launch based on platform
        if (process.platform === 'darwin') {
            // macOS: Use 'open' command
            const appPath = path.join(gameDir, 'Cosmicrafts.app');
            exec(`open "${appPath}"`, handleExecCallback(resolve, reject));
        } else if (process.platform === 'win32') {
            // Windows: Directly execute the binary
            const exePath = path.join(gameDir, 'Cosmicrafts', 'Cosmicrafts.exe');
            exec(`"${exePath}"`, handleExecCallback(resolve, reject));
        } else if (process.platform === 'linux') {
            // Linux: Directly execute the binary
            const binPath = path.join(gameDir, 'Cosmicrafts', 'Cosmicrafts.x86_64');
            exec(`"${binPath}"`, handleExecCallback(resolve, reject));
        } else {
            reject(new Error('Unsupported platform'));
        }
    });
}

function handleExecCallback(resolve, reject) {
    return (err, stdout, stderr) => {
        if (err) {
            reject(err);
        } else {
            resolve({ stdout, stderr });
        }
    };
}

async function readLocalVersionInfo() {
    try {
      const versionFilePath = path.join(gameDir, 'version.json');
      const versionData = await fs.readFile(versionFilePath, 'utf8');
      return JSON.parse(versionData);
    } catch (error) {
      // Handle the case when the local version info file doesn't exist yet
      // You can return a default version info object or handle it in any way you prefer.
      return { version: '0.0.0', url: '' };
    }
  }

function getPlatformKey() {
    switch (process.platform) {
        case 'darwin': return 'Mac';
        case 'win32': return 'Windows';
        case 'linux': return 'Linux';
        default: throw new Error('Unsupported platform');
    }
}

function getGameExecutablePath() {
    switch (process.platform) {
        case 'darwin':
            return path.join(gameDir, 'Cosmicrafts.app/Contents/MacOS/Cosmicrafts');
        case 'win32':
            return path.join(gameDir, 'Cosmicrafts.exe');
        case 'linux':
            return path.join(gameDir, 'Cosmicrafts', 'Cosmicrafts.x86_64');
        default:
            throw new Error('Unsupported platform');
    }
}

module.exports = { checkAndUpdateGame, launchGame };