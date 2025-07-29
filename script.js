document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const shapesContainer = document.getElementById('shapes-container');
    const scoreDisplay = document.getElementById('score');
    const boardSize = 8;
    let score = 0;
    const gameGrid = [];

    // Create the game board
    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        board.appendChild(cell);
        gameGrid.push(cell);
    }
});