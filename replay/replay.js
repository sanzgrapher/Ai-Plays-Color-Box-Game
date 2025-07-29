import { GameController } from '../js/controller.js';

const elements = {
    board: document.getElementById('game-board'),
    score: document.getElementById('score'),
    shapesContainer: document.getElementById('shapes-container'),
    status: document.getElementById('replay-status')
};

const loadButton = document.getElementById('load-state-btn');
const jsonInput = document.getElementById('state-json-input');
const replayController = new GameController(elements);

loadButton.addEventListener('click', () => {
    try {
        const state = JSON.parse(jsonInput.value);
        if (!state.grid || !state.currentBatch || !state.currentShapes) {
            return alert('Invalid state object. Make sure you copied the full state from an agent.');
        }
        replayController.init(state);
    } catch (error) {
        alert('Failed to parse JSON. Please ensure you copied the full state correctly.');
        console.error("State loading failed:", error);
    }
});