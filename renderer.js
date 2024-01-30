// renderer.js

const { ipcRenderer } = require('electron');

ipcRenderer.on('updateStatus', (event, message) => {
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status');

    if (typeof message === 'string') {
        statusText.innerText = message;
    } else if (typeof message === 'object') {
        if (message.type === 'progress') {
            progressBar.style.width = `${message.value}%`;
            statusText.innerText = message.message;
        }
    }
    
});