import { BOARD_SIZE } from './constants.js';

// --- DOM Element References ---
export const elements = {
    board: document.getElementById('game-board'),
    shapesContainer: document.getElementById('shapes-container'),
    score: document.getElementById('score'),
    gameOverOverlay: document.getElementById('game-over-overlay'),
    finalScore: document.getElementById('final-score'),
};

// --- UI Rendering Functions ---
export function createBoard(eventHandlers) {
    elements.board.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        // Attach event listeners passed from the game logic
        cell.addEventListener('dragover', eventHandlers.dragOver);
        cell.addEventListener('dragenter', eventHandlers.dragEnter);
        cell.addEventListener('dragleave', eventHandlers.dragLeave);
        cell.addEventListener('drop', eventHandlers.drop);
        elements.board.appendChild(cell);
    }
}

export function updateBoard(grid) {
    const cells = elements.board.children;
    for (let i = 0; i < grid.length; i++) {
        cells[i].classList.remove('preview', 'occupied');
        cells[i].style.backgroundColor = '';
        if (grid[i]) {
            cells[i].classList.add('occupied');
            cells[i].style.backgroundColor = grid[i];
        }
    }
}

export function updateScore(score) {
    elements.score.textContent = score;
}

export function renderShape(shapeData, eventHandlers) {
    const shapeElement = document.createElement('div');
    shapeElement.classList.add('shape');
    shapeElement.draggable = true;
    shapeElement.dataset.shape = JSON.stringify(shapeData);

    shapeElement.style.gridTemplateRows = `repeat(${shapeData.layout.length}, 30px)`;
    shapeElement.style.gridTemplateColumns = `repeat(${shapeData.layout[0].length}, 30px)`;

    shapeData.layout.forEach(row => {
        row.forEach(cellValue => {
            const cell = document.createElement('div');
            if (cellValue === 1) {
                cell.classList.add('shape-cell');
                cell.style.backgroundColor = shapeData.color;
            }
            shapeElement.appendChild(cell);
        });
    });

    shapeElement.addEventListener('dragstart', eventHandlers.dragStart);
    shapeElement.addEventListener('dragend', eventHandlers.dragEnd);
    return shapeElement;
}

export function showPreview(layout, startX, startY, color) {
    clearPreview();
    layout.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value === 1) {
                const index = (startY + y) * BOARD_SIZE + (startX + x);
                const cell = elements.board.children[index];
                if (cell) {
                    cell.classList.add('preview');
                    cell.style.backgroundColor = color;
                }
            }
        });
    });
}

export function clearPreview() {
    document.querySelectorAll('.cell.preview').forEach(cell => {
        cell.classList.remove('preview');
        if (!cell.classList.contains('occupied')) {
            cell.style.backgroundColor = '';
        }
    });
}

export function showGameOver(score) {
    elements.finalScore.textContent = `Final Score: ${score}`;
    elements.gameOverOverlay.classList.remove('hidden');
}

export function hideGameOver() {
    elements.gameOverOverlay.classList.add('hidden');
}