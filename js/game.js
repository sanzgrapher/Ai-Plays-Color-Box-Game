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
            // Sample points for plotting
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
        // Re-initialize chart in case DOM was not ready before
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
        for (let i = 0; i < 3; i++) {
            const shapeData = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            const shapeElement = ui.renderShape(shapeData, this.eventHandlers);
            ui.elements.shapesContainer.appendChild(shapeElement);
        }
        if (logic.isGameOver(this.state.grid)) {
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
        // Always start with exactly 3 unique random shared choices
        this.sharedChoices = [];
        const usedIndexes = new Set();
        while (this.sharedChoices.length < 3) {
            const idx = Math.floor(Math.random() * SHAPES.length);
            if (!usedIndexes.has(idx)) {
                usedIndexes.add(idx);
                this.sharedChoices.push(SHAPES[idx]);
            }
        }
        this.activeGames = this.population.map(agent => ({
            agent,
            grid: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
            score: 0,
            isDone: false,
            choiceLevel: 1
        }));
        this.highScore = 0;
        ui.updateAIStats(this.generation, this.activeGames.length, this.highScore);
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => this.simulationStep(), this.gameSpeed);
    }

    generateNextSharedChoice() {
        const newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        this.sharedChoices.push(newShape);
    }

    simulationStep() {
        let aliveCount = 0;
        let allDone = true;

        this.activeGames.forEach(game => {
            if (game.isDone) return;
            aliveCount++;
            allDone = false;

            // At each choice level, pick 3 random shapes using shuffle
            const shuffled = SHAPES.slice().sort(() => Math.random() - 0.5);
            const choiceShapes = shuffled.slice(0, 3);

            // Find best move among these 3 choices
            const bestMove = game.agent.findBestMove(game.grid, choiceShapes);

            if (!bestMove) {
                game.isDone = true;
                game.agent.fitness = game.score;
                if (game.score > this.highScore) this.highScore = game.score;
                this.updateTopScores(game.score);
                return;
            }

            // Place the shape
            bestMove.shapeData.layout.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 1) {
                        const index = (bestMove.y + y) * BOARD_SIZE + (bestMove.x + x);
                        game.grid[index] = bestMove.shapeData.color;
                    }
                });
            });
            game.score += bestMove.shapeData.layout.flat().filter(v => v === 1).length;

            const { newGrid, scoreToAdd } = logic.clearLines(game.grid);
            game.grid = newGrid;
            game.score += scoreToAdd;

            game.choiceLevel++;
        });

        // For UI: show the last set of choices used by the best agent
        window.sharedChoices = this.activeGames.length > 0 ? (() => {
            const bestCurrentAgent = this.activeGames.reduce((best, current) => current.score > best.score ? current : best, this.activeGames[0]);
            // Generate the 3 choices for the best agent's current level
            const choiceShapes = [];
            const usedIndexes = new Set();
            while (choiceShapes.length < 3) {
                const idx = Math.floor(Math.random() * SHAPES.length);
                if (!usedIndexes.has(idx)) {
                    usedIndexes.add(idx);
                    choiceShapes.push(SHAPES[idx]);
                }
            }
            return choiceShapes;
        })() : [];
        ui.renderSharedChoices(window.sharedChoices, this.activeGames);

        // Update the main board with the best agent's grid for visualization
        const bestCurrentAgent = this.activeGames.reduce((best, current) => current.score > best.score ? current : best, this.activeGames[0]);
        if (bestCurrentAgent) {
            ui.updateBoard(bestCurrentAgent.grid);
        }

        ui.updateAIStats(this.generation, aliveCount, this.highScore);

        // Only advance to next generation when all agents are done
        if (allDone) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
            this.generation++;
            // Calculate average score for this generation
            const avgScore = this.activeGames.reduce((sum, g) => sum + g.score, 0) / this.activeGames.length;
            this.genHighScoreData.push({ generation: this.generation, highScore: this.highScore });
            this.genAvgScoreData.push({ generation: this.generation, avgScore });
            this.updateChart();
            this.population = nextGeneration(this.population);
            this.runNextGeneration();
        }
    }
    updateTopScores(score) {
        this.top5Scores.push(score);
        // Sort descending
        this.top5Scores.sort((a, b) => b - a);
        // Keep only the top 5
        this.top5Scores = this.top5Scores.slice(0, 5);
        // Update the UI
        ui.updateHighScores(this.top5Scores);
    }
    generateSimShapes = () => Array.from({ length: 3 }, () => SHAPES[Math.floor(Math.random() * SHAPES.length)]);

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

            // Place shape in state.grid
            const shapeLayout = this.state.draggedShapeData.layout;
            const color = this.state.draggedShapeData.color;
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

            this.updateUI();
            if (draggedElement) draggedElement.remove();

            if (ui.elements.shapesContainer.children.length === 0) {
                this.generatePlayerShapes();
            }
        }
    }
}