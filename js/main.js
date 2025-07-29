import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    // Start the game
    game.init();

    // Wire up the reset button
    document.getElementById('reset-button').addEventListener('click', () => {
        game.init();
    });
});