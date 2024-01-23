const { ipcRenderer } = require('electron');

document.getElementById('start-game').addEventListener('click', () => {
    ipcRenderer.send('launch-game');
});
