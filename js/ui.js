// Render 50 agent instances for the current generation
export function renderAgents(agents, sharedChoices) {
    const container = document.getElementById('agents-list');
    if (!container) return;
    container.innerHTML = '';
    agents.forEach((agent, i) => {
        const div = document.createElement('div');
        div.style.border = '1px solid #ccc';
        div.style.padding = '4px';
        div.style.width = '110px';
        div.style.textAlign = 'center';
        div.style.background = agent.isDone ? '#f8d7da' : '#d4edda';
        div.innerHTML = `<b>#${i + 1}</b><br>Score: ${agent.score}<br>Choice Level: ${agent.choiceLevel}<br>${agent.isDone ? 'Game Over' : 'Active'}`;

        // Show only 3 choices: previous, current, next
        if (sharedChoices) {
            const choicesRow = document.createElement('div');
            choicesRow.style.display = 'flex';
            choicesRow.style.gap = '2px';
            // Show only the current choice
            const idx = agent.choiceLevel - 1;
            if (idx >= 0 && idx < sharedChoices.length) {
                const shape = sharedChoices[idx];
                const shapeDiv = document.createElement('div');
                shapeDiv.style.display = 'inline-block';
                shapeDiv.style.margin = '0 1px';
                shapeDiv.innerHTML = `<span style="font-size:9px;">Current</span><br>`;
                shape.layout.forEach((row, y) => {
                    row.forEach((cell, x) => {
                        const cellBox = document.createElement('span');
                        cellBox.style.display = 'inline-block';
                        cellBox.style.width = '7px';
                        cellBox.style.height = '7px';
                        cellBox.style.background = cell ? shape.color : '#eee';
                        cellBox.style.border = '1px solid #ccc';
                        cellBox.style.margin = '0px';
                        shapeDiv.appendChild(cellBox);
                    });
                    shapeDiv.appendChild(document.createElement('br'));
                });
                choicesRow.appendChild(shapeDiv);
            }
            div.appendChild(choicesRow);
        }
        // Mini board
        const board = document.createElement('div');
        board.style.display = 'grid';
        board.style.gridTemplateColumns = `repeat(8, 8px)`;
        board.style.gridTemplateRows = `repeat(8, 8px)`;
        board.style.gap = '1px';
        board.style.margin = '2px auto';
        board.style.width = '70px';
        board.style.height = '70px';
        agent.grid.forEach(cell => {
            const cellDiv = document.createElement('div');
            cellDiv.style.width = '8px';
            cellDiv.style.height = '8px';
            cellDiv.style.background = cell ? cell : '#eee';
            cellDiv.style.border = '1px solid #ccc';
            board.appendChild(cellDiv);
        });
        div.appendChild(board);

        // Current choice (first shape in shapes array)
        if (agent.shapes && agent.shapes.length > 0) {
            const shape = agent.shapes[0];
            const shapeDiv = document.createElement('div');
            shapeDiv.style.display = 'inline-block';
            shapeDiv.style.margin = '2px auto';
            shapeDiv.innerHTML = '<span style="font-size:10px;">Next:</span><br>';
            shape.layout.forEach((row, y) => {
                row.forEach((cell, x) => {
                    const cellBox = document.createElement('span');
                    cellBox.style.display = 'inline-block';
                    cellBox.style.width = '7px';
                    cellBox.style.height = '7px';
                    cellBox.style.background = cell ? shape.color : '#eee';
                    cellBox.style.border = '1px solid #ccc';
                    cellBox.style.margin = '0px';
                    shapeDiv.appendChild(cellBox);
                });
                shapeDiv.appendChild(document.createElement('br'));
            });
            div.appendChild(shapeDiv);
        }

        // Copy State Button
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy State';
        copyBtn.style.margin = '2px 0';
        copyBtn.style.fontSize = '10px';
        copyBtn.onclick = () => {
            const state = {
                score: agent.score,
                choiceLevel: agent.choiceLevel,
                grid: agent.grid,
                shapes: agent.shapes
            };
            navigator.clipboard.writeText(JSON.stringify(state, null, 2));
        };
        div.appendChild(copyBtn);

        container.appendChild(div);
    });
}
export function renderSharedChoices(sharedChoices, agents) {
    const sharedContainer = document.getElementById('shared-choices-container');
    if (!sharedContainer || !Array.isArray(sharedChoices)) return;
    sharedContainer.innerHTML = '<h3>Current Choice Level Choices</h3>';
    const levelRow = document.createElement('div');
    levelRow.style.display = 'flex';
    levelRow.style.gap = '12px';
    sharedChoices.forEach((shape, idx) => {
        // Use same structure as shapesContainer
        const shapeDiv = document.createElement('div');
        shapeDiv.className = 'shape';
        shapeDiv.style.display = 'grid';
        shapeDiv.style.gridTemplateRows = `repeat(${shape.layout.length}, 30px)`;
        shapeDiv.style.gridTemplateColumns = `repeat(${shape.layout[0].length}, 30px)`;
        shapeDiv.style.margin = '0 4px';
        shapeDiv.setAttribute('draggable', 'false');
        shapeDiv.setAttribute('data-shape', JSON.stringify(shape));
        // Render cells
        for (let y = 0; y < shape.layout.length; y++) {
            for (let x = 0; x < shape.layout[0].length; x++) {
                const cell = shape.layout[y][x];
                const cellDiv = document.createElement('div');
                cellDiv.className = 'shape-cell';
                cellDiv.style.backgroundColor = cell ? shape.color : '#eee';
                cellDiv.style.width = '30px';
                cellDiv.style.height = '30px';
                shapeDiv.appendChild(cellDiv);
            }
        }
        // Add label below
        const label = document.createElement('div');
        label.style.textAlign = 'center';
        label.style.fontSize = '12px';
        label.textContent = shape.name;
        shapeDiv.appendChild(label);
        levelRow.appendChild(shapeDiv);
    });
    sharedContainer.appendChild(levelRow);
    // Render agents below
    renderAgents(agents, sharedChoices);
}

import { BOARD_SIZE } from './constants.js';

// --- DOM Element References (Corrected & Completed) ---
export const elements = {
    board: document.getElementById('game-board'),
    shapesContainer: document.getElementById('shapes-container'),
    score: document.getElementById('score'),
    gameOverOverlay: document.getElementById('game-over-overlay'),
    finalScore: document.getElementById('final-score'),
    resetButton: document.getElementById('reset-button'),

    // --- AI SPECIFIC ELEMENTS ---
    aiStats: document.getElementById('ai-stats'),
    generationStat: document.getElementById('generation-stat'),
    aliveStat: document.getElementById('alive-stat'),
    highscoreStat: document.getElementById('highscore-stat'),
    speedToggle: document.getElementById('speed-toggle'),

    // --- MODE SWITCH BUTTONS ---
    playerModeBtn: document.getElementById('player-mode-btn'),
    aiModeBtn: document.getElementById('ai-mode-btn'),
    highscoreContainer: document.getElementById('highscore-container'),
    highscoreList: document.getElementById('highscore-list'),
};

// --- UI Rendering Functions ---
export function updateHighScores(scores) {
    elements.highscoreList.innerHTML = ''; // Clear the old list
    for (const score of scores) {
        const li = document.createElement('li');
        li.textContent = score;
        elements.highscoreList.appendChild(li);
    }
}
// createBoard needs to accept the event handlers from the game controller
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
        cells[i].classList.remove('preview'); // Always remove preview
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

// --- AI Specific UI Updates ---
export function updateAIStats(generation, alive, highScore) {
    elements.generationStat.textContent = generation;
    elements.aliveStat.textContent = alive;
    elements.highscoreStat.textContent = highScore;
}