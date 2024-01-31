// renderer.js

const { ipcRenderer } = require('electron');
const startGameButton = document.getElementById('start-game');
const statusText = document.getElementById('status');
const progressBarContainer = document.getElementById('progress-bar-container'); // Get the container of the progress bar
const progressBar = document.getElementById('progress-bar');

ipcRenderer.on('updateStatus', (event, message) => {
    if (message.type === 'progress') {
        progressBar.style.width = `${message.value}%`;
        statusText.innerText = message.message;
        progressBarContainer.style.display = 'block'; // Show the progress bar when updating
    } else if (message.type === 'update-start') {
        startGameButton.disabled = true;
        startGameButton.innerText = 'Updating...';
        startGameButton.classList.add('button-updating');
        progressBarContainer.style.display = 'block'; // Show the progress bar when the update starts
    } else if (message.type === 'update-end') {
        startGameButton.disabled = false;
        startGameButton.innerText = 'Play';
        startGameButton.classList.remove('button-updating');
        progressBarContainer.style.display = 'none'; // Hide the progress bar when the update ends
    } else if (typeof message === 'string') {
        statusText.innerText = message;
    }
});
