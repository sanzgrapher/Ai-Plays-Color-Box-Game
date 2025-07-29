// js/main.js

import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    const playerModeBtn = document.getElementById('player-mode-btn');
    const aiModeBtn = document.getElementById('ai-mode-btn');
    const resetButton = document.getElementById('reset-button');

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

    // Universal Reset Button
    resetButton.addEventListener('click', () => {
        if (game.isPlayerMode) {
            game.initPlayerGame();
        } else {
            game.startAISimulation();
        }
    });

    // Speed Toggle Feature
    const speedLevels = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
    let speedIndex = 0;
    const speedToggle = document.getElementById('speed-toggle');
    function updateSpeed() {
        game.gameSpeed = 50 / speedLevels[speedIndex]; // Lower ms = faster
        speedToggle.textContent = `Speed: ${speedLevels[speedIndex]}x`;
        // If AI mode is running, restart interval with new speed
        if (!game.isPlayerMode && game.gameLoopInterval) {
            clearInterval(game.gameLoopInterval);
            game.gameLoopInterval = setInterval(() => game.simulationStep(), game.gameSpeed);
        }
    }
    speedToggle.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % speedLevels.length;
        updateSpeed();
    });
    updateSpeed();
});