import { BOARD_SIZE, SHAPES } from './constants.js';
import * as logic from './logic.js';
import * as ui from './ui.js';
import { Agent } from './ai.js';

// --- DOM Elements ---
const startBtn = document.getElementById('start-comparison-btn');
const speedToggle = document.getElementById('speed-toggle');
const pauseToggle = document.getElementById('pause-toggle');
const modelAInput = document.getElementById('model-a-input');
const modelBInput = document.getElementById('model-b-input');
const gameCountInput = document.getElementById('game-count-input');
const progressIndicator = document.getElementById('progress-indicator');
const boardAEl = document.getElementById('game-board-a');
const boardBEl = document.getElementById('game-board-b');
const scoreAEl = document.querySelector('#score-container-a span');
const scoreBEl = document.querySelector('#score-container-b span');
const shapeContainerA = document.querySelector('#shape-panel-a .shape-container');
const shapeContainerB = document.querySelector('#shape-panel-b .shape-container');
const gameOverAEl = document.getElementById('game-over-a');
const gameOverBEl = document.getElementById('game-over-b');

// --- Simulation State ---
let agentA, agentB;
let stateA, stateB;
let scoresA = [], scoresB = [];
let gameLimit = 5, currentGameNumber = 0;
let gameLoopInterval = null, gameSpeed = 200, isPaused = false;
let comparisonChart = null;

// --- Chart Logic ---
function initializeChart() {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    if (comparisonChart) { comparisonChart.destroy(); }
    comparisonChart = new Chart(ctx, {
        type: 'line', // CHANGED to line chart
        data: {
            labels: [], // Game numbers
            datasets: [
                {
                    label: 'Model A Score', data: [], borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true, tension: 0.1
                },
                {
                    label: 'Model B Score', data: [], borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.1
                }
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Game Number' } },
                y: { title: { display: true, text: 'Final Score' }, beginAtZero: true }
            }
        }
    });
}

function updateChart() {
    if (!comparisonChart) return;
    // Labels are game numbers: 1, 2, 3, ...
    comparisonChart.data.labels = scoresA.map((_, i) => i + 1);
    comparisonChart.data.datasets[0].data = scoresA;
    comparisonChart.data.datasets[1].data = scoresB;
    comparisonChart.update();
}

// --- Game Logic ---
function startNextGame() {
    if (currentGameNumber >= gameLimit) {
        clearInterval(gameLoopInterval);
        startBtn.disabled = false;
        startBtn.textContent = "Start Comparison";
        progressIndicator.textContent = `Finished ${gameLimit} games!`;
        return;
    }
    currentGameNumber++;
    progressIndicator.textContent = `Running Game ${currentGameNumber} of ${gameLimit}...`;

    // Reset states for the new game
    stateA = { grid: Array(BOARD_SIZE * BOARD_SIZE).fill(null), score: 0, isDone: false, currentShapes: [], currentBatch: [] };
    stateB = { grid: Array(BOARD_SIZE * BOARD_SIZE).fill(null), score: 0, isDone: false, currentShapes: [], currentBatch: [] };
    ui.updateBoard(stateA.grid, boardAEl);
    ui.updateBoard(stateB.grid, boardBEl);
    gameOverAEl.classList.add('hidden');
    gameOverBEl.classList.add('hidden');

    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameStep, gameSpeed);
}

// --- Core Simulation Step (One Turn for each agent) ---
function gameStep() {
    // End the current game if both agents are done
    if (stateA.isDone && stateB.isDone) {
        clearInterval(gameLoopInterval);
        scoresA.push(stateA.score);
        scoresB.push(stateB.score);
        updateChart();
        setTimeout(startNextGame, 1000); // Start next game after a pause
        return;
    }

    // Check if a new batch is needed for either agent
    if (stateA.currentShapes.length === 0 || stateB.currentShapes.length === 0) {
        const newBatch = logic.generateShapeBatch();

        // Give the identical batch to any agent that needs one
        if (stateA.currentShapes.length === 0 && !stateA.isDone) {
            stateA.currentBatch = newBatch;
            stateA.currentShapes = [...newBatch];
        }
        if (stateB.currentShapes.length === 0 && !stateB.isDone) {
            stateB.currentBatch = newBatch;
            stateB.currentShapes = [...newBatch];
        }

        // Check for immediate game over
        if (!stateA.isDone && logic.isGameOver(stateA.grid, stateA.currentShapes)) { stateA.isDone = true; gameOverAEl.classList.remove('hidden'); }
        if (!stateB.isDone && logic.isGameOver(stateB.grid, stateB.currentShapes)) { stateB.isDone = true; gameOverBEl.classList.remove('hidden'); }
    }

    // Render shape UIs with used pieces grayed out
    ui.renderShapes(stateA.currentBatch, stateA.currentShapes, shapeContainerA, {});
    ui.renderShapes(stateB.currentBatch, stateB.currentShapes, shapeContainerB, {});

    // Play one turn for each agent
    playTurnForAgent(stateA, agentA, boardAEl, gameOverAEl);
    playTurnForAgent(stateB, agentB, boardBEl, gameOverBEl);

    // Update current scores
    scoreAEl.textContent = stateA.score;
    scoreBEl.textContent = stateB.score;
}

function playTurnForAgent(state, agent, boardEl, gameOverEl) {
    if (state.isDone) return;

    const move = agent.findBestMove(state.grid, state.currentShapes);

    if (move) {
        move.shapeData.layout.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 1) state.grid[(move.y + y) * BOARD_SIZE + (move.x + x)] = move.shapeData.color;
            });
        });
        state.score += move.shapeData.layout.flat().filter(v => v === 1).length;
        const result = logic.clearLines(state.grid);
        state.grid = result.newGrid; state.score += result.scoreToAdd;
        ui.updateBoard(state.grid, boardEl);
        state.currentShapes = state.currentShapes.filter(s => s.id !== move.shapeData.id);
    } else { // No move possible with current inventory
        state.isDone = true;
        gameOverEl.classList.remove('hidden');
    }
}

// --- Page Initialization and Controls ---
startBtn.addEventListener('click', () => {
    try {
        agentA = new Agent(JSON.parse(modelAInput.value));
        agentB = new Agent(JSON.parse(modelBInput.value));
        gameLimit = parseInt(gameCountInput.value, 10) || 5;
    } catch (e) { return alert("Error parsing models. Ensure JSON is valid."); }

    if (gameLoopInterval) clearInterval(gameLoopInterval);
    scoresA = []; scoresB = [];
    currentGameNumber = 0;

    startBtn.disabled = true;
    startBtn.textContent = "Running...";

    initializeChart();
    ui.createBoard(boardAEl, {}); ui.createBoard(boardBEl, {});
    startNextGame(); // Kick off the first game
});

const speedLevels = [0.5, 1, 2, 5, 10, 20];
let speedIndex = 1;
speedToggle.addEventListener('click', () => {
    speedIndex = (speedIndex + 1) % speedLevels.length;
    gameSpeed = 400 / speedLevels[speedIndex];
    speedToggle.textContent = `Speed: ${speedLevels[speedIndex]}x`;
    if (!isPaused && gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameStep, gameSpeed);
    }
});

pauseToggle.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseToggle.textContent = isPaused ? "Resume" : "Pause";
    if (isPaused) {
        clearInterval(gameLoopInterval);
    } else {
        gameLoopInterval = setInterval(gameStep, gameSpeed);
    }
});

document.addEventListener('DOMContentLoaded', initializeChart);