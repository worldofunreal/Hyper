// main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const updateLogic = require('./updateLogic');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 700,
        resizable: false,
        backgroundColor: '#05070a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/preload.js')
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Check for updates once the window is ready
    win.webContents.once('did-finish-load', () => {
        updateLogic.checkAndUpdateGame(win);
    });

    // Remove application menu for a cleaner "app" feel
    Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);

ipcMain.on('launch-game', (event) => {
    if (typeof updateLogic.launchGame === "function") {
        updateLogic.launchGame().catch((error) => {
            console.error('Error launching game:', error);
            win.webContents.send("updateStatus", `Error: ${error.message}`);
        });
    } else {
        console.error('launchGame is not a function');
        win.webContents.send("updateStatus", `Error: launchGame is not a function`);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
