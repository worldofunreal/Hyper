// renderer.js

const startGameButton = document.getElementById('start-game');
const statusText = document.getElementById('status');
const progressBarContainer = document.getElementById('progress-bar-container');
const progressBar = document.getElementById('progress-bar');
const progressTextLabel = document.getElementById('progress-text');

// Use the secure window.electron API exposed via preload.js
window.electron.on('updateStatus', (message) => {
    if (message.type === 'progress') {
        const percent = parseFloat(message.value);
        progressBar.style.width = `${percent}%`;
        progressTextLabel.innerText = message.message;
        progressBarContainer.style.display = 'block';
    } else if (message.type === 'update-start') {
        startGameButton.disabled = true;
        startGameButton.innerText = 'UPDATING...';
        startGameButton.classList.add('button-updating');
        progressBarContainer.style.display = 'block';
        statusText.innerText = 'Downloading Update...';
    } else if (message.type === 'update-end') {
        startGameButton.disabled = false;
        startGameButton.innerText = 'PLAY';
        startGameButton.classList.remove('button-updating');
        progressBarContainer.style.display = 'none';
        statusText.innerText = 'Update Complete';
    } else if (typeof message === 'string') {
        statusText.innerText = message;
    }
});

startGameButton.addEventListener('click', () => {
    window.electron.send('launch-game');
});