// js/ui.js

import { BOARD_SIZE } from './constants.js';

// --- DOM Element References ---
export const elements = {
    board: document.getElementById('game-board'),
    shapesContainer: document.getElementById('shapes-container'),
    score: document.getElementById('score'),
    gameOverOverlay: document.getElementById('game-over-overlay'),
    finalScore: document.getElementById('final-score'),
    resetButton: document.getElementById('reset-button'),
    aiStats: document.getElementById('ai-stats'),
    generationStat: document.getElementById('generation-stat'),
    aliveStat: document.getElementById('alive-stat'),
    highscoreStat: document.getElementById('highscore-stat'),
    speedToggle: document.getElementById('speed-toggle'),
    playerModeBtn: document.getElementById('player-mode-btn'),
    aiModeBtn: document.getElementById('ai-mode-btn'),
    highscoreContainer: document.getElementById('highscore-container'),
    highscoreList: document.getElementById('highscore-list'),
};

/**
 * Renders the state of all AI agents, including the Copy State button and detailed shape batch visualization.
 * @param {Array} agentGames - The array of active agent game states.
 */
export function renderAgents(agentGames) {
    const container = document.getElementById('agents-list');
    if (!container) return;
    container.innerHTML = ''; // Clear previous view

    agentGames.forEach((game, i) => {
        const div = document.createElement('div');
        div.style.border = '1px solid #ccc';
        div.style.padding = '4px';
        div.style.width = '130px';
        div.style.textAlign = 'center';
        div.style.background = game.isDone ? '#f8d7da' : '#d4edda';
        div.style.borderRadius = '4px';
        div.innerHTML = `<b>Agent #${game.agent.id + 1}</b><br>Score: ${game.score}<br>${game.isDone ? 'Game Over' : 'Active'}`;

        // Container for the shape batch
        const batchContainer = document.createElement('div');
        batchContainer.style.display = 'flex';
        batchContainer.style.justifyContent = 'space-around';
        batchContainer.style.alignItems = 'center';
        batchContainer.style.gap = '2px';
        batchContainer.style.marginTop = '4px';
        batchContainer.style.minHeight = '36px';
        batchContainer.style.border = '1px solid #e0e0e0';
        batchContainer.style.borderRadius = '3px';
        batchContainer.style.padding = '2px 0';

        // Visualize the agent's full shape batch (used shapes are grayed out)
        if (game.currentBatch && game.currentBatch.length > 0) {
            const availableShapeIds = new Set(game.currentShapes.map(s => s.id));
            game.currentBatch.forEach((shape) => {
                const shapeDiv = document.createElement('div');
                shapeDiv.style.display = 'grid';
                shapeDiv.style.gridTemplateRows = `repeat(${shape.layout.length}, 8px)`;
                shapeDiv.style.gridTemplateColumns = `repeat(${shape.layout[0].length}, 8px)`;
                shapeDiv.style.opacity = availableShapeIds.has(shape.id) ? '1.0' : '0.2';

                for (let y = 0; y < shape.layout.length; y++) {
                    for (let x = 0; x < shape.layout[0].length; x++) {
                        const cell = shape.layout[y][x];
                        const cellDiv = document.createElement('div');
                        cellDiv.style.backgroundColor = cell ? shape.color : 'transparent';
                        cellDiv.style.width = '8px';
                        cellDiv.style.height = '8px';
                        shapeDiv.appendChild(cellDiv);
                    }
                }
                batchContainer.appendChild(shapeDiv);
            });
        }
        div.appendChild(batchContainer);

        // Mini-board visualization
        const board = document.createElement('div');
        board.style.display = 'grid';
        board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 10px)`;
        board.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 10px)`;
        board.style.gap = '1px';
        board.style.margin = '4px auto 0';
        board.style.border = '1px solid #aaa';
        board.style.backgroundColor = '#f0f0f0';

        game.grid.forEach(cell => {
            const cellDiv = document.createElement('div');
            cellDiv.style.width = '10px';
            cellDiv.style.height = '10px';
            cellDiv.style.background = cell ? cell : '#fff';
            board.appendChild(cellDiv);
        });
        div.appendChild(board);

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy State';
        copyBtn.style.margin = '4px 0 2px 0';
        copyBtn.style.fontSize = '10px';
        copyBtn.style.padding = '2px 4px';
        copyBtn.onclick = () => {
            // Include all relevant state details for debugging
            const stateToCopy = {
                score: game.score,
                isDone: game.isDone,
                grid: game.grid,
                currentBatch: game.currentBatch,
                currentShapes: game.currentShapes, // The currently usable shapes
                agentWeights: game.agent.weights
            };
            navigator.clipboard.writeText(JSON.stringify(stateToCopy, null, 2))
                .then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = 'Copy State', 1500);
                });
        };
        div.appendChild(copyBtn);

        container.appendChild(div);
    });
}

export function updateHighScores(scores) {
    elements.highscoreList.innerHTML = '';
    for (const score of scores) {
        const li = document.createElement('li');
        li.textContent = score;
        elements.highscoreList.appendChild(li);
    }
}

export function createBoard(eventHandlers) {
    elements.board.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
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
    layout.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value === 1) {
                const boardX = startX + x;
                const boardY = startY + y;
                if (boardX < 0 || boardX >= BOARD_SIZE || boardY < 0 || boardY >= BOARD_SIZE) return;
                const index = boardY * BOARD_SIZE + boardX;
                const cell = elements.board.children[index];
                if (cell && !cell.classList.contains('occupied')) {
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

export function updateAIStats(generation, alive, highScore) {
    elements.generationStat.textContent = generation;
    elements.aliveStat.textContent = alive;
    elements.highscoreStat.textContent = highScore;
}