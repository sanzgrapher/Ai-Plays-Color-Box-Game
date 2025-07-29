// js/main.js
import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    // A single Game instance holds all possible application logic
    const game = new Game();

    // --- Page Detection and Initialization ---
    // The script checks which page it's on and runs ONLY the relevant setup code.

    if (document.getElementById('player-view')) {
        // --- This code runs ONLY on player.html ---
        const hintButton = document.getElementById('hint-button');
        const loadModelsBtn = document.getElementById('load-models-btn');
        const modelA_Input = document.getElementById('model-a-input');
        const modelB_Input = document.getElementById('model-b-input');
        const modelSelectionContainer = document.getElementById('model-selection-container');
        const modelRadioButtons = document.querySelectorAll('input[name="active-model"]');
        const resetButton = document.getElementById('reset-button');

        loadModelsBtn.addEventListener('click', () => {
            const success = game.loadModels(modelA_Input.value, modelB_Input.value);
            if (success) {
                alert("Models loaded successfully!");
                modelSelectionContainer.classList.remove('hidden');
                hintButton.disabled = !game.getActiveModel();
            }
        });

        modelRadioButtons.forEach(radio => {
            radio.addEventListener('change', (event) => {
                game.setActiveModelKey(event.target.value);
                hintButton.disabled = !game.getActiveModel();
            });
        });

        resetButton.addEventListener('click', () => {
            game.initPlayerGame();
        });

        // Initialize the page in Player Mode
        game.switchToPlayerMode();

    } else if (document.getElementById('model-output-container')) {
        // --- This code runs ONLY on ai_trainer.html ---
        const speedToggle = document.getElementById('speed-toggle');
        const pauseToggle = document.getElementById('pause-toggle');
        const speedLevels = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
        let speedIndex = 3;

        function updateSpeed() {
            game.gameSpeed = 50 / speedLevels[speedIndex];
            speedToggle.textContent = `Speed: ${speedLevels[speedIndex]}x`;
            if (!game.isPaused && game.gameLoopInterval) {
                clearInterval(game.gameLoopInterval);
                game.gameLoopInterval = setInterval(() => game.simulationStep(), game.gameSpeed);
            }
        }

        speedToggle.addEventListener('click', () => {
            speedIndex = (speedIndex + 1) % speedLevels.length;
            updateSpeed();
        });

        pauseToggle.addEventListener('click', () => {
            game.isPaused = !game.isPaused;
            pauseToggle.textContent = game.isPaused ? 'Resume' : 'Pause';
            if (game.isPaused) {
                clearInterval(game.gameLoopInterval);
            } else {
                game.gameLoopInterval = setInterval(() => game.simulationStep(), game.gameSpeed);
            }
        });

        updateSpeed(); // Set initial speed
        // Initialize the page in AI Mode
        game.switchToAIMode();
    }
});