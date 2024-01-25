// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const updateLogic = require('./updateLogic');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
    updateLogic.checkAndUpdateGame(win);
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
