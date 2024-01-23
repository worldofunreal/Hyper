const { app, BrowserWindow, ipcMain } = require('electron');
const os = require('os');
const { exec } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');

    // OS detection logic
    if (os.platform() === 'darwin') {
        console.log('Running on macOS');
    } else if (os.platform() === 'win32') {
        console.log('Running on Windows');
    } else if (os.platform() === 'linux') {
        console.log('Running on Linux');
    }
}

app.whenReady().then(createWindow);

ipcMain.on('launch-game', () => {
    // Example: Game launch path for different OS
    let gamePath;
    if (os.platform() === 'darwin') {
        gamePath = '/path/to/mac/game.app';
    } else if (os.platform() === 'win32') {
        gamePath = 'C:\\path\\to\\windows\\game.exe';
    } else if (os.platform() === 'linux') {
        gamePath = '/home/bizkit/Desktop/Cosmicrafts/Cosmicrafts.x86_64';
    }

    exec(gamePath, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
