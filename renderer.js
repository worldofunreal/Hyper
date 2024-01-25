// renderer.js

const { ipcRenderer } = require('electron');

ipcRenderer.on('updateStatus', (event, status) => {
    document.getElementById('status').innerText = status;
});

document.getElementById('start-game').addEventListener('click', () => {
    ipcRenderer.send('launch-game');
});
