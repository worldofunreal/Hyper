const { exec } = require('child_process');
const https = require('https');
const AdmZip = require('adm-zip');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const versionUrl = 'https://tcpug-iqaaa-aaaap-qb67q-cai.icp0.io/version.json';
const versionUrlIPv4 = 'https://ipv4.tcpug-iqaaa-aaaap-qb67q-cai.icp0.io/version.json';
const gameDir = path.join(os.homedir(), 'MyGame');

// Ensure the game directory exists before attempting to update or launch
fs.ensureDirSync(gameDir);

async function checkAndUpdateGame(window) {
    try {
        await fs.ensureDir(gameDir);
        const remoteVersionInfo = await fetchVersionInfo();
        const localVersionInfo = await readLocalVersionInfo();

        if (shouldUpdate(localVersionInfo, remoteVersionInfo)) {
            window.webContents.send("updateStatus", "Downloading game update...");
            const zipPath = await downloadGame(remoteVersionInfo.url);
            window.webContents.send("updateStatus", "Verifying download...");
            // Simulate checksum verification here
            window.webContents.send("updateStatus", "Installing game update...");
            await extractGame(zipPath, gameDir);
            await writeLocalVersionInfo(remoteVersionInfo);
            window.webContents.send("updateStatus", "Game update installed.");
        } else {
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
    // Assuming version numbers are in the format 'X.Y.Z'
    const localVersionParts = localVersion.version.split('.').map(Number);
    const remoteVersionParts = remoteVersion.version.split('.').map(Number);
  
    for (let i = 0; i < 3; i++) {
      if (remoteVersionParts[i] > localVersionParts[i]) {
        return true; // Remote version is greater, so update is needed
      } else if (remoteVersionParts[i] < localVersionParts[i]) {
        return false; // Local version is greater, no update needed
      }
    }
  
    return false; // Versions are equal, no update needed
  }
  
  

async function downloadGame(url) {
    console.log(`Starting download from URL: ${url}`);
    const zipPath = path.join(os.tmpdir(), 'game.zip');
    const fileStream = fs.createWriteStream(zipPath);
    
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
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

        // Set execute permissions for Linux executable
        if (process.platform === 'linux') {
            const executablePath = getGameExecutablePath();
            try {
                fs.chmodSync(executablePath, '755'); // Ensure execute permissions
                console.log(`Set execute permissions for Linux executable: ${executablePath}`);
            } catch (chmodError) {
                console.error(`Error setting execute permissions: ${chmodError}`);
            }
        }

        await fs.remove(zipPath);
        console.log(`Removed zip file: ${zipPath}`);
        
        // Log the contents of the game directory after extraction
        const files = await fs.readdir(extractPath);
        console.log('Contents of the game directory:', files);
    } catch (error) {
        console.error('Extraction failed:', error);
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
    console.log(`Expected game directory: ${gameDir}`);
    if (!fs.existsSync(gameDir)) {
        console.error(`Game directory not found: ${gameDir}`);
        return;
    }

    const gameExecutable = getGameExecutablePath();
    console.log(`Expected game executable: ${gameExecutable}`);
    if (!fs.existsSync(gameExecutable)) {
        console.error(`Game executable not found: ${gameExecutable}`);
        return;
    }

    try {
        fs.chmodSync(gameExecutable, '755'); // Ensure execute permissions
        console.log(`Launching game: ${gameExecutable}`);
        exec(`"${gameExecutable}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error launching game: ${err}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });
    } catch (chmodError) {
        console.error(`Error setting execute permissions: ${chmodError}`);
    }
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
        case 'darwin': return path.join(gameDir, 'Cosmicrafts_Mac.app/Contents/MacOS/Cosmicrafts_Mac');
        case 'win32': return path.join(gameDir, 'Cosmicrafts.exe');
        case 'linux': return path.join(gameDir, 'Cosmicrafts_Linux', 'Cosmicrafts.x86_64'); // Update path for Linux
        default: throw new Error('Unsupported platform');
    }
}

module.exports = { checkAndUpdateGame, launchGame };