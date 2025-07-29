// Render 50 agent instances for the current generation
export function renderAgents(agents) {
    const container = document.getElementById('agents-list');
    if (!container) return;
    container.innerHTML = '';
    agents.forEach((agent, i) => {
        const div = document.createElement('div');
        div.style.border = '1px solid #ccc';
        div.style.padding = '4px';
        div.style.width = '90px';
        div.style.textAlign = 'center';
        div.style.background = agent.isDone ? '#f8d7da' : '#d4edda';
        div.innerHTML = `<b>#${i + 1}</b><br>Score: ${agent.score}<br>${agent.isDone ? 'Game Over' : 'Active'}`;
        container.appendChild(div);
    });
}
// js/ui.js

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