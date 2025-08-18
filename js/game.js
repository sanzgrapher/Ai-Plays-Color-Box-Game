
import { SHAPES, BOARD_SIZE } from './constants.js';
import * as logic from './logic.js';
import * as ui from './ui.js';
import { Agent, nextGeneration } from './ai.js';
import { GameController } from './controller.js';

const POPULATION_SIZE = 50;

export class Game {
    constructor() {
        this.isPlayerMode = true;

        this.playerController = new GameController({
            board: document.getElementById('game-board'),
            shapesContainer: document.getElementById('shapes-container'),
            score: document.getElementById('score'),
            hintButton: document.getElementById('hint-button')
        }, this);

        // Model Management
        this.loadedModels = { A: null, B: null };
        this.activeModelKey = 'A';

        // AI Simulation State
        this.population = []; this.generation = 0; this.highScore = 0;
        this.top5Scores = []; this.gameLoopInterval = null; this.gameSpeed = 50;
        this.bestAgentModelForOutput = null;
        this.worstAgentModelForOutput = null;
        this.isPaused = false;

        // Chart State
        this.genHighScoreData = []; this.genAvgScoreData = [];
        this.agentScoresData = [];
        // FIX: Chart is now correctly initialized on-demand, not here.
        this.chart = null;
        this.agentScoresChart = null;

        this.mainGameBoardElement = document.getElementById('game-board');
        console.log("Game instance initialized.");
    }

    // --- Model Management ---
    loadModels(modelA_JSON, modelB_JSON) {
        try {
            this.loadedModels.A = modelA_JSON.trim() ? JSON.parse(modelA_JSON) : null;
            this.loadedModels.B = modelB_JSON.trim() ? JSON.parse(modelB_JSON) : null;
            return true;
        } catch (e) { console.error("JSON Parsing Error:", e); alert("Error parsing models."); return false; }
    }
    setActiveModelKey(key) { this.activeModelKey = key; }
    getActiveModel() { return this.loadedModels[this.activeModelKey] || null; }
    getBestModel() { return this.getActiveModel(); }

    initChart() {
        const ctx = document.getElementById('genHighScoreChart');
        if (ctx) {
            if (this.chart) { this.chart.destroy(); }
            this.chart = new window.Chart(ctx, {
                type: 'line',
                data: { labels: [], datasets: [{ label: 'Best High Score', data: [] }, { label: 'Average High Score', data: [] }] },
                options: { responsive: true, title: { display: true, text: 'Generation vs High Score' } }
            });
        }
        // Agent Scores Chart
        const agentScoresCtx = document.getElementById('agentScoresChart');
        if (agentScoresCtx) {
            if (this.agentScoresChart) { this.agentScoresChart.destroy(); }
            this.agentScoresChart = new window.Chart(agentScoresCtx, {
                type: 'bar',
                data: { labels: [], datasets: [{ label: 'Agent Score After Death', data: [], backgroundColor: 'rgba(54, 162, 235, 0.5)' }] },
                options: { responsive: true, title: { display: true, text: 'All Agent Scores After Death' } }
            });
        }
    }

    updateChart() {
        if (this.chart) {
            this.chart.data.labels = this.genHighScoreData.map(d => d.generation);
            this.chart.data.datasets[0].data = this.genHighScoreData.map(d => d.highScore);
            this.chart.data.datasets[1].data = this.genAvgScoreData.map(d => d.avgScore);
            this.chart.update();
        }
        // Update agent scores chart
        if (this.agentScoresChart) {
            this.agentScoresChart.data.labels = this.agentScoresData.map((d, i) => `Agent ${i + 1}`);
            this.agentScoresChart.data.datasets[0].data = this.agentScoresData;
            this.agentScoresChart.update();
        }
    }

    // --- UPDATED METHOD ---
    switchToAIMode() {
        this.isPlayerMode = false;
        ui.hideGameOver();

        // FIX: The chart is initialized here, ONLY when entering AI mode.
        this.initChart();

        if (this.mainGameBoardElement) {
            ui.createBoard(this.mainGameBoardElement, {});
        }

        this.startAISimulation();
    }

    switchToPlayerMode() {
        this.isPlayerMode = true;
        clearInterval(this.gameLoopInterval);
        ui.hideGameOver();
        const hintButton = document.getElementById('hint-button');
        if (hintButton) {
            hintButton.disabled = !this.getActiveModel();
        }
        this.playerController.init();
    }

    initPlayerGame() {
        this.playerController.init();
    }

    startAISimulation() {
        this.bestAgentModelForOutput = null;
        ui.updateModelOutput(null);
        this.generation = 1;
        this.highScore = 0;
        this.top5Scores = [];
        this.genHighScoreData = []; // Clear chart data
        this.genAvgScoreData = [];  // Clear chart data
        this.agentScoresData = [];
        this.population = Array.from({ length: POPULATION_SIZE }, () => new Agent());
        this.runNextGeneration();
    }

    runNextGeneration() {
        this.highScore = 0; // Reset for each generation
        this.activeGames = this.population.map((agent, index) => {
            agent.id = index;
            return {
                agent,
                grid: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
                score: 0, isDone: false, currentShapes: [], currentBatch: []
            };
        });
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => this.simulationStep(), this.gameSpeed);
    }

    simulationStep() {
        let aliveCount = 0;
        this.activeGames.forEach(game => {
            if (game.isDone) return;
            if (game.currentShapes.length === 0) {
                const newBatch = logic.generateShapeBatch();
                game.currentBatch = newBatch; game.currentShapes = [...newBatch];
                if (logic.isGameOver(game.grid, game.currentShapes)) {
                    game.isDone = true; game.agent.fitness = game.score;
                    if (game.score > this.highScore) {
                        this.highScore = game.score;
                        this.bestAgentModelForOutput = { ...game.agent.weights };
                    }
                    this.updateTopScores(game.score); return;
                }
            }
            const bestMove = game.agent.findBestMove(game.grid, game.currentShapes);
            if (!bestMove) {
                game.isDone = true; game.agent.fitness = game.score;
                if (game.score > this.highScore) {
                    this.highScore = game.score;
                    this.bestAgentModelForOutput = { ...game.agent.weights };
                }
                this.updateTopScores(game.score); return;
            }
            aliveCount++;
            bestMove.shapeData.layout.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 1) game.grid[(bestMove.y + y) * BOARD_SIZE + (bestMove.x + x)] = bestMove.shapeData.color;
                });
            });
            game.score += bestMove.shapeData.layout.flat().filter(v => v === 1).length;
            const { newGrid, scoreToAdd } = logic.clearLines(game.grid);
            game.grid = newGrid; game.score += scoreToAdd;
            game.currentShapes = game.currentShapes.filter(s => s.id !== bestMove.shapeData.id);
        });

        const bestAgentForDisplay = this.activeGames.length > 0 ? this.activeGames.reduce((best, current) => current.score > best.score ? current : best, this.activeGames[0]) : null;
        if (bestAgentForDisplay) {
            ui.updateBoard(bestAgentForDisplay.grid, this.mainGameBoardElement);
        }
        ui.renderAgents(this.activeGames);
        ui.updateAIStats(this.generation, aliveCount, this.highScore);
        
        // Update distribution score strip with live agent scores
        const liveAgentScores = this.activeGames.map(g => g.score);
        ui.updateDistributionScoreStrip(liveAgentScores);

        if (aliveCount === 0 && this.activeGames.length > 0) {
            clearInterval(this.gameLoopInterval); this.gameLoopInterval = null;
            // Collect all agent scores after death
            this.agentScoresData = this.activeGames.map(g => g.score);
            const avgScore = this.activeGames.reduce((sum, g) => sum + g.score, 0) / this.activeGames.length;
            this.genHighScoreData.push({ generation: this.generation, highScore: this.highScore });
            this.genAvgScoreData.push({ generation: this.generation, avgScore: avgScore });
            this.updateChart();
            
            // Update score strips below charts
            ui.updateGenerationScoreStrip(this.genHighScoreData.map(d => d.highScore));
            ui.updateDistributionScoreStrip(this.agentScoresData);
            // Set Champion, Robust, and Weakest Model Output
            if (this.activeGames.length > 0) {
                // Champion: highest score ever
                const prevBestAgent = this.activeGames.reduce((best, current) => current.score > best.score ? current : best, this.activeGames[0]);

                // Track overall weakest agent ever
                if (!this.overallWeakestAgent || this.activeGames.some(a => a.score < this.overallWeakestAgent.score)) {
                    const currentGenWeakest = this.activeGames.reduce((worst, current) => current.score < worst.score ? current : worst, this.activeGames[0]);
                    if (!this.overallWeakestAgent || currentGenWeakest.score < this.overallWeakestAgent.score) {
                        this.overallWeakestAgent = {
                            score: currentGenWeakest.score,
                            weights: { ...currentGenWeakest.agent.weights }
                        };
                    }
                }

                // Robust: generation with highest avgScore and stable trend
                let robustGenIndex = 0;
                let maxAvgScore = -Infinity;
                for (let i = 1; i < this.genAvgScoreData.length - 1; i++) {
                    const prev = this.genAvgScoreData[i - 1].avgScore;
                    const curr = this.genAvgScoreData[i].avgScore;
                    const next = this.genAvgScoreData[i + 1].avgScore;
                    if (curr > maxAvgScore && Math.abs(curr - prev) < curr * 0.2 && Math.abs(curr - next) < curr * 0.2) {
                        maxAvgScore = curr;
                        robustGenIndex = i;
                    }
                }
                if (maxAvgScore === -Infinity && this.genAvgScoreData.length > 0) {
                    robustGenIndex = this.genAvgScoreData.reduce((bestIdx, d, idx, arr) => d.avgScore > arr[bestIdx].avgScore ? idx : bestIdx, 0);
                }
                let robustAgentWeights = null;
                if (this.genAvgScoreData.length > 0 && robustGenIndex < this.genAvgScoreData.length) {
                    const robustGen = this.genAvgScoreData[robustGenIndex].generation;
                    if (robustGen === this.generation) {
                        const robustBestAgent = this.activeGames.reduce((best, current) => current.score > best.score ? current : best, this.activeGames[0]);
                        robustAgentWeights = { ...robustBestAgent.agent.weights };
                    } else {
                        robustAgentWeights = { ...prevBestAgent.agent.weights };
                    }
                }

                this.bestAgentModelForOutput = { ...prevBestAgent.agent.weights };
                this.worstAgentModelForOutput = this.overallWeakestAgent ? { ...this.overallWeakestAgent.weights } : null;
                this.robustAgentModelForOutput = robustAgentWeights;
                ui.updateModelOutput({ best: this.bestAgentModelForOutput, robust: this.robustAgentModelForOutput, worst: this.worstAgentModelForOutput });
            }
            this.generation++;
            this.population = nextGeneration(this.population);
            this.runNextGeneration();
        }
    }

    updateTopScores(score) {
        this.top5Scores.push(score);
        this.top5Scores.sort((a, b) => b - a).splice(5);
        ui.updateHighScores(this.top5Scores);
    }
}