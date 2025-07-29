// js/ui.js
import { BOARD_SIZE } from './constants.js';

// --- Generic, Reusable UI Functions for game instances ---

export function createBoard(boardElement, eventHandlers) {
    boardElement.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('dragover', eventHandlers.dragOver);
        cell.addEventListener('dragenter', eventHandlers.dragEnter);
        cell.addEventListener('dragleave', eventHandlers.dragLeave);
        cell.addEventListener('drop', eventHandlers.drop);
        boardElement.appendChild(cell);
    }
}

export function updateBoard(grid, boardElement) {
    const cells = boardElement.children;
    for (let i = 0; i < grid.length; i++) {
        cells[i].classList.remove('preview');
        if (grid[i]) {
            cells[i].classList.add('occupied');
            cells[i].style.backgroundColor = grid[i];
        } else {
            cells[i].classList.remove('occupied');
            cells[i].style.backgroundColor = '';
        }
    }
}

export function updateScore(score, scoreElement) {
    scoreElement.textContent = score;
}

export function renderShapes(fullBatch, availableShapes, containerElement, eventHandlers) {
    containerElement.innerHTML = '';
    const availableShapeIds = new Set(availableShapes.map(s => s.id));

    fullBatch.forEach(shapeData => {
        const shapeEl = createSingleShapeElement(shapeData);
        const isAvailable = availableShapeIds.has(shapeData.id);

        shapeEl.style.opacity = isAvailable ? '1.0' : '0.2';
        shapeEl.title = isAvailable ? 'Available to play' : 'This shape was already used';

        if (isAvailable) {
            shapeEl.draggable = true;
            shapeEl.addEventListener('dragstart', eventHandlers.dragStart);
            shapeEl.addEventListener('dragend', eventHandlers.dragEnd);
        }
        containerElement.appendChild(shapeEl);
    });
}

// Helper function to create a shape's visual element
function createSingleShapeElement(shapeData) {
    const shapeElement = document.createElement('div');
    shapeElement.classList.add('shape');
    shapeElement.dataset.shape = JSON.stringify(shapeData);
    shapeElement.style.gridTemplateRows = `repeat(${shapeData.layout.length}, 30px)`;
    shapeElement.style.gridTemplateColumns = `repeat(${shapeData.layout[0].length}, 30px)`;

    shapeData.layout.forEach(row => {
        row.forEach(cellValue => {
            const cell = document.createElement('div');
            if (cellValue === 1) {
                cell.classList.add('shape-cell');
                // FIX: This line was missing, causing shapes to be invisible. It's now restored.
                cell.style.backgroundColor = shapeData.color;
            }
            shapeElement.appendChild(cell);
        });
    });
    return shapeElement;
}


export function showPreview(boardElement, layout, startX, startY, color) {
    clearPreview(boardElement);
    layout.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value === 1) {
                const boardX = startX + x, boardY = startY + y;
                if (boardX < 0 || boardX >= BOARD_SIZE || boardY < 0 || boardY >= BOARD_SIZE) return;
                const index = boardY * BOARD_SIZE + boardX;
                const cell = boardElement.children[index];
                if (cell && !cell.classList.contains('occupied')) {
                    cell.classList.add('preview');
                    cell.style.backgroundColor = color;
                }
            }
        });
    });
}

export function clearPreview(boardElement) {
    boardElement.querySelectorAll('.cell.preview').forEach(cell => {
        cell.classList.remove('preview');
        if (!cell.classList.contains('occupied')) {
            cell.style.backgroundColor = '';
        }
    });
}

// --- High-Level UI Functions (Not part of controller) ---
export function showGameOver(score) {
    document.getElementById('final-score').textContent = `Final Score: ${score}`;
    document.getElementById('game-over-overlay').classList.remove('hidden');
}

export function hideGameOver() {
    document.getElementById('game-over-overlay').classList.add('hidden');
}

export function updateAIStats(generation, alive, highScore) {
    document.getElementById('generation-stat').textContent = generation;
    document.getElementById('alive-stat').textContent = alive;
    document.getElementById('highscore-stat').textContent = highScore;
}

export function updateHighScores(scores) {
    const list = document.getElementById('highscore-list');
    list.innerHTML = '';
    scores.forEach(score => {
        const li = document.createElement('li');
        li.textContent = score;
        list.appendChild(li);
    });
}

export function renderAgents(agentGames) {
    const container = document.getElementById('agents-list');
    if (!container) return;
    container.innerHTML = '';

    agentGames.forEach((game) => {
        const div = document.createElement('div');
        div.classList.add('agent-card', game.isDone ? 'done' : 'active');
        div.innerHTML = `<b>Agent #${game.agent.id + 1}</b><br>Score: ${game.score}`;

        const batchContainer = document.createElement('div');
        batchContainer.className = 'agent-batch-container';

        if (game.currentBatch && game.currentBatch.length > 0) {
            const availableShapeIds = new Set(game.currentShapes.map(s => s.id));
            game.currentBatch.forEach((shape) => {
                const shapeDiv = document.createElement('div');
                shapeDiv.className = 'agent-mini-shape';
                shapeDiv.style.gridTemplateRows = `repeat(${shape.layout.length}, 8px)`;
                shapeDiv.style.gridTemplateColumns = `repeat(${shape.layout[0].length}, 8px)`;
                shapeDiv.style.opacity = availableShapeIds.has(shape.id) ? '1.0' : '0.2';

                for (let y = 0; y < shape.layout.length; y++) {
                    for (let x = 0; x < shape.layout[0].length; x++) {
                        const cell = shape.layout[y][x];
                        const cellDiv = document.createElement('div');
                        cellDiv.className = 'agent-mini-shape-cell';
                        cellDiv.style.backgroundColor = cell ? shape.color : 'transparent';
                        shapeDiv.appendChild(cellDiv);
                    }
                }
                batchContainer.appendChild(shapeDiv);
            });
        }
        div.appendChild(batchContainer);

        const board = document.createElement('div');
        board.className = 'agent-mini-board';
        board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 10px)`;

        game.grid.forEach(cell => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'agent-mini-board-cell';
            if (cell) cellDiv.style.background = cell;
            board.appendChild(cellDiv);
        });
        div.appendChild(board);

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy State';
        copyBtn.className = 'agent-copy-btn';
        copyBtn.onclick = () => {
            const stateToCopy = { score: game.score, isDone: game.isDone, grid: game.grid, currentBatch: game.currentBatch, currentShapes: game.currentShapes, agentWeights: game.agent.weights };
            navigator.clipboard.writeText(JSON.stringify(stateToCopy, null, 2));
        };
        div.appendChild(copyBtn);
        container.appendChild(div);
    });
}