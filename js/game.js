// js/game.js

import { BOARD_SIZE, SHAPES } from './constants.js';
import { GameState } from './state.js';
import * as logic from './logic.js';
import * as ui from './ui.js';
import { Agent, nextGeneration } from './ai.js';

const POPULATION_SIZE = 50;

export class Game {
    constructor() {
        this.state = new GameState();
        this.isPlayerMode = true;

        this.population = [];
        this.generation = 0;
        this.highScore = 0;
        this.top5Scores = [];

        this.genHighScoreData = [];
        this.chart = null;
        this.genAvgScoreData = [];

        this.gameLoopInterval = null;
        this.gameSpeed = 50; // Delay in ms for AI simulation speed

        this.eventHandlers = {
            dragStart: this.handleDragStart.bind(this),
            dragEnd: this.handleDragEnd.bind(this),
            dragOver: (e) => e.preventDefault(),
            dragEnter: this.handleDragEnter.bind(this),
            dragLeave: this.handleDragLeave.bind(this),
            drop: this.handleDrop.bind(this),
        };

        this.initChart();
    }

    initChart() {
        const ctx = document.getElementById('genHighScoreChart');
        if (ctx) {
            if (this.chart) {
                this.chart.destroy();
            }
            this.chart = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Best High Score',
                            data: [],
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                            tension: 0.1
                        },
                        {
                            label: 'Average High Score',
                            data: [],
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: false,
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: { display: true, text: 'Generation vs High Score' }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Generation' },
                            ticks: {
                                callback: function (value, index, values) {
                                    const gen = this.getLabelForValue(value);
                                    const total = values.length;
                                    if (total <= 10) return gen;
                                    if (total <= 20) return gen % 2 === 0 ? gen : '';
                                    if (total <= 100) return gen % 10 === 0 ? gen : '';
                                    if (total <= 1000) return gen % 100 === 0 ? gen : '';
                                    return gen % 1000 === 0 ? gen : '';
                                }
                            }
                        },
                        y: { title: { display: true, text: 'High Score' } }
                    }
                }
            });
        }
    }

    updateChart() {
        if (this.chart) {
            let data = this.genHighScoreData;
            let avgData = this.genAvgScoreData;
            let step = 1;
            const total = data.length;
            if (total > 1000) step = 1000;
            else if (total > 100) step = 100;
            else if (total > 20) step = 10;
            else if (total > 10) step = 2;
            const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);
            const sampledAvg = avgData.filter((_, i) => i % step === 0 || i === avgData.length - 1);
            this.chart.data.labels = sampled.map(d => d.generation);
            this.chart.data.datasets[0].data = sampled.map(d => d.highScore);
            this.chart.data.datasets[1].data = sampledAvg.map(d => d.avgScore);
            this.chart.update();
        }
    }

    // --- Mode Switching ---
    switchToAIMode() {
        this.isPlayerMode = false;
        clearInterval(this.gameLoopInterval);
        ui.hideGameOver();
        ui.elements.aiStats.classList.remove('hidden');
        ui.elements.highscoreContainer.classList.remove('hidden');
        ui.elements.shapesContainer.style.display = 'none';
        ui.elements.score.parentElement.style.display = 'none';

        // Show AI-specific elements and hide player's
        document.getElementById('agents-container').style.display = 'block';

        this.initChart();
        this.startAISimulation();
    }

    switchToPlayerMode() {
        this.isPlayerMode = true;
        clearInterval(this.gameLoopInterval);
        ui.hideGameOver();
        ui.elements.aiStats.classList.add('hidden');
        ui.elements.highscoreContainer.classList.add('hidden');
        ui.elements.shapesContainer.style.display = '';
        ui.elements.score.parentElement.style.display = '';

        // Hide AI-specific elements
        document.getElementById('agents-container').style.display = 'none';

        this.initPlayerGame();
    }

    // --- Player Mode Logic ---
    initPlayerGame() {
        this.state.reset();
        ui.hideGameOver();
        ui.createBoard(this.eventHandlers);
        this.generatePlayerShapes();
        this.updateUI();
    }

    generatePlayerShapes() {
        ui.elements.shapesContainer.innerHTML = '';
        this.state.currentShapes = []; // Clear old shapes from state
        for (let i = 0; i < 3; i++) {
            const shapeData = {
                ...SHAPES[Math.floor(Math.random() * SHAPES.length)],
                id: `p-${Date.now()}-${i}` // Add unique ID for tracking
            };
            this.state.currentShapes.push(shapeData);
            const shapeElement = ui.renderShape(shapeData, this.eventHandlers);
            ui.elements.shapesContainer.appendChild(shapeElement);
        }

        if (logic.isGameOver(this.state.grid, this.state.currentShapes)) {
            this.handleGameOver();
        }
    }

    // --- AI Simulation Logic ---
    startAISimulation() {
        this.generation = 1;
        this.highScore = 0;
        this.top5Scores = [];
        ui.updateHighScores(this.top5Scores);
        this.population = Array.from({ length: POPULATION_SIZE }, () => new Agent());
        this.runNextGeneration();
    }

    runNextGeneration() {
        this.highScore = 0; // Reset high score for the new generation's run
        this.population.forEach((agent, index) => agent.id = index);

        this.activeGames = this.population.map(agent => ({
            agent,
            grid: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
            score: 0,
            isDone: false,
            currentShapes: [], // The shapes the agent *can still place*
            currentBatch: [],  // The original 3 shapes given this cycle
        }));

        ui.updateAIStats(this.generation, this.activeGames.length, this.highScore);
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => this.simulationStep(), this.gameSpeed);
    }

    simulationStep() {
        let aliveCount = 0;

        this.activeGames.forEach(game => {
            if (game.isDone) return;

            // If shape inventory is empty, generate a new batch of 3.
            if (game.currentShapes.length === 0) {
                const newBatch = Array.from({ length: 3 }, (_, i) => ({
                    ...SHAPES[Math.floor(Math.random() * SHAPES.length)],
                    id: `g${this.generation}-a${game.agent.id}-${Date.now()}-${i}`
                }));
                game.currentBatch = newBatch;
                game.currentShapes = [...newBatch];

                // CRITICAL CHECK: Agent fails immediately if no new shapes can be placed.
                if (logic.isGameOver(game.grid, game.currentShapes)) {
                    game.isDone = true;
                    game.agent.fitness = game.score;
                    if (game.score > this.highScore) this.highScore = game.score;
                    this.updateTopScores(game.score);
                    return;
                }
            }

            // Find the best move among the *currently available* shapes.
            const bestMove = game.agent.findBestMove(game.grid, game.currentShapes);

            // AGENT FAILS: If there are shapes left but none can be placed.
            if (!bestMove) {
                game.isDone = true;
                game.agent.fitness = game.score;
                if (game.score > this.highScore) this.highScore = game.score;
                this.updateTopScores(game.score);
                return;
            }

            aliveCount++;

            // Apply the best move to the agent's grid.
            bestMove.shapeData.layout.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 1) {
                        game.grid[(bestMove.y + y) * BOARD_SIZE + (bestMove.x + x)] = bestMove.shapeData.color;
                    }
                });
            });

            // Update score.
            game.score += bestMove.shapeData.layout.flat().filter(v => v === 1).length;
            const { newGrid, scoreToAdd } = logic.clearLines(game.grid);
            game.grid = newGrid;
            game.score += scoreToAdd;

            // Remove the used shape from the available shapes inventory.
            game.currentShapes = game.currentShapes.filter(s => s.id !== bestMove.shapeData.id);
        });

        // --- UI Updates ---
        const bestAgentForDisplay = this.activeGames.length > 0 ? this.activeGames.reduce((best, current) => current.score > best.score ? current : best, this.activeGames[0]) : null;
        if (bestAgentForDisplay) {
            ui.updateBoard(bestAgentForDisplay.grid);
        }
        ui.renderAgents(this.activeGames);
        ui.updateAIStats(this.generation, aliveCount, this.highScore);

        // Check if the entire generation's simulation is complete.
        if (aliveCount === 0 && this.activeGames.length > 0) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;

            const avgScore = this.activeGames.reduce((sum, g) => sum + g.score, 0) / this.activeGames.length;
            this.genHighScoreData.push({ generation: this.generation, highScore: this.highScore });
            this.genAvgScoreData.push({ generation: this.generation, avgScore });
            this.updateChart();

            this.generation++;
            this.population = nextGeneration(this.population);
            this.runNextGeneration();
        }
    }

    updateTopScores(score) {
        this.top5Scores.push(score);
        this.top5Scores.sort((a, b) => b - a);
        this.top5Scores = this.top5Scores.slice(0, 5);
        ui.updateHighScores(this.top5Scores);
    }

    // --- Shared Logic ---
    updateUI() {
        ui.updateBoard(this.state.grid);
        ui.updateScore(this.state.score);
    }

    handleGameOver() {
        this.state.isGameOver = true;
        ui.showGameOver(this.state.score);
    }

    // --- Player Event Handlers ---
    handleDragStart(e) {
        if (this.state.isGameOver) return;
        this.state.draggedShapeData = JSON.parse(e.target.dataset.shape);
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        ui.clearPreview();
        this.state.draggedShapeData = null;
    }

    handleDragEnter(e) {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (!this.state.draggedShapeData || !cell) return;
        const index = parseInt(cell.dataset.index);
        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);
        ui.clearPreview();
        if (logic.canPlaceShape(this.state.grid, this.state.draggedShapeData.layout, x, y)) {
            ui.showPreview(this.state.draggedShapeData.layout, x, y, this.state.draggedShapeData.color);
        }
    }

    handleDragLeave() { }

    handleDrop(e) {
        e.preventDefault();
        if (!this.state.draggedShapeData) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const index = parseInt(cell.dataset.index);
        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);

        if (logic.canPlaceShape(this.state.grid, this.state.draggedShapeData.layout, x, y)) {
            const draggedElement = document.querySelector('.shape.dragging');
            const { layout: shapeLayout, color, id } = this.state.draggedShapeData;

            shapeLayout.forEach((row, rY) => {
                row.forEach((cellValue, rX) => {
                    if (cellValue === 1) {
                        this.state.grid[(y + rY) * BOARD_SIZE + (x + rX)] = color;
                    }
                });
            });

            this.state.score += shapeLayout.flat().filter(v => v === 1).length;
            const { newGrid, scoreToAdd } = logic.clearLines(this.state.grid);
            this.state.grid = newGrid;
            this.state.score += scoreToAdd;

            this.state.currentShapes = this.state.currentShapes.filter(s => s.id !== id);

            this.updateUI();

            if (draggedElement) draggedElement.remove();

            if (this.state.currentShapes.length === 0) {
                this.generatePlayerShapes();
            }
        }
    }
}