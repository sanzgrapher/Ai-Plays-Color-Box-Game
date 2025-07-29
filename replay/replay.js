// replay/replay.js

// --- IMPORT an essential game logic from the main game directory ---
import { BOARD_SIZE } from '../js/constants.js';
import { canPlaceShape, clearLines, isGameOver } from '../js/logic.js';


// --- MODULE-LEVEL STATE for the replay session ---
let gameState = {
    grid: [],
    score: 0,
    currentShapes: [], // Holds only the AVAILABLE, playable shapes
    draggedShapeData: null
};


// --- DOM Element References ---
const loadButton = document.getElementById('load-state-btn');
const jsonInput = document.getElementById('state-json-input');
const gameBoardEl = document.getElementById('game-board');
const shapesContainerEl = document.getElementById('shapes-container');
const scoreEl = document.getElementById('score');


// ===============================================================
// UI RENDERING FUNCTIONS (Adapted from original ui.js)
// ===============================================================

function updateBoard() {
    gameBoardEl.innerHTML = ''; // Clear board before redraw
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        if (gameState.grid[i]) {
            cell.classList.add('occupied');
            cell.style.backgroundColor = gameState.grid[i];
        }
        // Add listeners to every cell for interactivity
        cell.addEventListener('dragover', (e) => e.preventDefault());
        cell.addEventListener('dragenter', handleDragEnter);
        cell.addEventListener('dragleave', clearPreview);
        cell.addEventListener('drop', handleDrop);
        gameBoardEl.appendChild(cell);
    }
}

function updateScore() {
    scoreEl.textContent = gameState.score;
}

/**
 * Displays the full batch of shapes, but only makes available ones interactive.
 * @param {Array<Object>} fullBatch - The agent's original batch of 3 shapes.
 * @param {Array<Object>} availableShapes - The shapes from the batch that were unused.
 */
function renderShapes(fullBatch, availableShapes) {
    shapesContainerEl.innerHTML = '';
    gameState.currentShapes = availableShapes; // Update state with what's playable
    const availableShapeIds = new Set(availableShapes.map(s => s.id));

    fullBatch.forEach(shapeData => {
        const shapeEl = document.createElement('div');
        shapeEl.classList.add('shape');
        shapeEl.dataset.shape = JSON.stringify(shapeData);
        shapeEl.style.gridTemplateRows = `repeat(${shapeData.layout.length}, 30px)`;
        shapeEl.style.gridTemplateColumns = `repeat(${shapeData.layout[0].length}, 30px)`;

        const isAvailable = availableShapeIds.has(shapeData.id);

        shapeEl.style.opacity = isAvailable ? '1.0' : '0.2';
        shapeEl.title = isAvailable ? 'Available to play' : 'This shape was already used';

        // --- Core Interactivity Logic ---
        // Only unused, available shapes are made draggable.
        if (isAvailable) {
            shapeEl.draggable = true;
            shapeEl.addEventListener('dragstart', handleDragStart);
            shapeEl.addEventListener('dragend', handleDragEnd);
        }

        shapeData.layout.forEach(row => {
            row.forEach(cellVal => {
                const cell = document.createElement('div');
                if (cellVal === 1) cell.classList.add('shape-cell');
                shapeEl.appendChild(cell);
            });
        });
        shapesContainerEl.appendChild(shapeEl);
    });
}

function showPreview(layout, startX, startY, color) {
    clearPreview();
    layout.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val === 1) {
                const boardX = startX + x, boardY = startY + y;
                if (boardX >= BOARD_SIZE || boardY >= BOARD_SIZE) return;
                const cell = gameBoardEl.children[boardY * BOARD_SIZE + boardX];
                if (cell && !cell.classList.contains('occupied')) {
                    cell.classList.add('preview');
                    cell.style.backgroundColor = color;
                }
            }
        });
    });
}

function clearPreview() {
    document.querySelectorAll('.cell.preview').forEach(cell => {
        cell.classList.remove('preview');
        if (!cell.classList.contains('occupied')) {
            cell.style.backgroundColor = '';
        }
    });
}


// ===============================================================
// DRAG-AND-DROP EVENT HANDLERS (The Playable Logic)
// ===============================================================

function handleDragStart(e) {
    gameState.draggedShapeData = JSON.parse(e.target.dataset.shape);
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    clearPreview();
    gameState.draggedShapeData = null;
}

function handleDragEnter(e) {
    e.preventDefault();
    if (!gameState.draggedShapeData) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const index = parseInt(cell.dataset.index);
    const x = index % BOARD_SIZE;
    const y = Math.floor(index / BOARD_SIZE);

    if (canPlaceShape(gameState.grid, gameState.draggedShapeData.layout, x, y)) {
        showPreview(gameState.draggedShapeData.layout, x, y, gameState.draggedShapeData.color);
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (!gameState.draggedShapeData) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    clearPreview();
    const index = parseInt(cell.dataset.index);
    const x = index % BOARD_SIZE;
    const y = Math.floor(index / BOARD_SIZE);

    // --- GAME PROGRESSES HERE ---
    if (canPlaceShape(gameState.grid, gameState.draggedShapeData.layout, x, y)) {
        const { layout, color, id } = gameState.draggedShapeData;

        // 1. Place the shape on the grid state
        layout.forEach((row, rY) => {
            row.forEach((val, rX) => {
                if (val === 1) gameState.grid[(y + rY) * BOARD_SIZE + (x + rX)] = color;
            });
        });

        // 2. Update score for placing the piece
        gameState.score += layout.flat().filter(v => v === 1).length;

        // 3. Clear lines and get bonus score
        const { newGrid, scoreToAdd } = clearLines(gameState.grid);
        gameState.grid = newGrid;
        gameState.score += scoreToAdd;

        // 4. Update the UI to show the new state
        updateBoard();
        updateScore();

        // 5. Remove the shape that was just used from the available list
        const shapeToRemoveEl = document.querySelector(`[data-shape*='"id":"${id}"']`);
        if (shapeToRemoveEl) shapeToRemoveEl.remove();

        // 6. Check if the game is now over with the remaining shapes
        gameState.currentShapes = gameState.currentShapes.filter(s => s.id !== id);
        if (isGameOver(gameState.grid, gameState.currentShapes)) {
            setTimeout(() => alert('Game Over! No more moves possible with the remaining shape(s).'), 100);
        }
    }
}


// ===============================================================
// INITIALIZATION
// ===============================================================

loadButton.addEventListener('click', () => {
    try {
        const state = JSON.parse(jsonInput.value);
        if (!state.grid || !state.currentBatch || !state.currentShapes) {
            return alert('Invalid state object. Please copy the full state.');
        }

        // Initialize game state from the pasted JSON
        gameState.grid = state.grid;
        gameState.score = state.score;

        // Trigger the initial rendering of the board, score, and shapes
        updateBoard();
        updateScore();
        renderShapes(state.currentBatch, state.currentShapes);

    } catch (error) {
        alert('Failed to parse JSON. Please ensure you copied the full state correctly.');
        console.error("State loading failed:", error);
    }
});

// Initial placeholder message on the board
gameBoardEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding-top: 50px; color: #777;">Paste a state and click "Load State" to begin.</div>';