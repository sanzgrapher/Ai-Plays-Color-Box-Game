import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    const playerModeBtn = document.getElementById('player-mode-btn');
    const aiModeBtn = document.getElementById('ai-mode-btn');
    const resetButton = document.getElementById('reset-button');
    const speedToggle = document.getElementById('speed-toggle');
    const pauseToggle = document.getElementById('pause-toggle');
    let isPaused = false;

    // Start in Player Mode
    game.switchToPlayerMode();

    playerModeBtn.addEventListener('click', () => {
        if (game.isPlayerMode) return;
        playerModeBtn.classList.add('active');
        aiModeBtn.classList.remove('active');
        game.switchToPlayerMode();
    });

    aiModeBtn.addEventListener('click', () => {
        if (!game.isPlayerMode) return;
        aiModeBtn.classList.add('active');
        playerModeBtn.classList.remove('active');
        game.switchToAIMode();
    });

    resetButton.addEventListener('click', () => {
        if (game.isPlayerMode) {
            game.initPlayerGame(); // This now calls the controller's init()
        } else {
            game.startAISimulation(); // Reset the AI simulation
        }
    });

    const speedLevels = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
    let speedIndex = 3; // Default to 1x
    function updateSpeed() {
        game.gameSpeed = 50 / speedLevels[speedIndex];
        speedToggle.textContent = `Speed: ${speedLevels[speedIndex]}x`;
        if (!game.isPlayerMode && game.gameLoopInterval) {
            clearInterval(game.gameLoopInterval);
            game.gameLoopInterval = setInterval(() => game.simulationStep(), game.gameSpeed);
        }
    }
    speedToggle.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % speedLevels.length;
        updateSpeed();
    });

    pauseToggle.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseToggle.textContent = isPaused ? 'Resume' : 'Pause';
        if (isPaused) {
            clearInterval(game.gameLoopInterval)
        } else {
            if (!game.isPlayerMode) {
                game.gameLoopInterval = setInterval(() => game.simulationStep(), game.gameSpeed);
            }
        }
    });

    updateSpeed(); // Set initial speed
});