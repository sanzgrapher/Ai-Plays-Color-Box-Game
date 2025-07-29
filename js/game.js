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
            score: document.getElementById('score')
        });

        this.mainGameBoardElement = document.getElementById('game-board');

        // AI Properties
        this.population = [];
        this.generation = 0;
        this.highScore = 0;
        this.top5Scores = [];
        this.gameLoopInterval = null;
        this.gameSpeed = 50;
        this.genHighScoreData = [];
        this.genAvgScoreData = [];
        this.chart = null;
        this.initChart();
    }

    initChart() {
        const ctx = document.getElementById('genHighScoreChart');
        if (ctx) {
            if (this.chart) { this.chart.destroy(); }
            this.chart = new window.Chart(ctx, {
                type: 'line', data: { labels: [], datasets: [{ label: 'Best High Score', data: [], borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.1 }, { label: 'Average High Score', data: [], borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: false, tension: 0.1 }] },
                options: { responsive: true, plugins: { legend: { display: true }, title: { display: true, text: 'Generation vs High Score' } }, scales: { x: { title: { display: true, text: 'Generation' } }, y: { title: { display: true, text: 'High Score' } } } }
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

    switchToAIMode() {
        this.isPlayerMode = false;
        clearInterval(this.gameLoopInterval);
        ui.hideGameOver();
        document.getElementById('ai-stats').classList.remove('hidden');
        document.getElementById('highscore-container').classList.remove('hidden');
        document.getElementById('agents-container').style.display = 'block';
        document.getElementById('shapes-container').style.display = 'none';
        document.getElementById('score-container').style.display = 'none';
        this.startAISimulation();
    }

    switchToPlayerMode() {
        this.isPlayerMode = true;
        clearInterval(this.gameLoopInterval);
        ui.hideGameOver();
        document.getElementById('ai-stats').classList.add('hidden');
        document.getElementById('highscore-container').classList.add('hidden');
        document.getElementById('agents-container').style.display = 'none';
        document.getElementById('shapes-container').style.display = '';
        document.getElementById('score-container').style.display = '';
        this.playerController.init();
    }

    initPlayerGame() {
        this.playerController.init();
    }

    startAISimulation() {
        this.generation = 1;
        this.highScore = 0;
        this.population = Array.from({ length: POPULATION_SIZE }, () => new Agent());
        this.runNextGeneration();
    }

    runNextGeneration() {
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
                const newBatch = Array.from({ length: 3 }, (_, i) => ({
                    ...SHAPES[Math.floor(Math.random() * SHAPES.length)],
                    id: `g${this.generation}-a${game.agent.id}-${Date.now()}-${i}`
                }));
                game.currentBatch = newBatch;
                game.currentShapes = [...newBatch];
                if (logic.isGameOver(game.grid, game.currentShapes)) {
                    game.isDone = true; game.agent.fitness = game.score;
                    if (game.score > this.highScore) this.highScore = game.score;
                    this.updateTopScores(game.score); return;
                }
            }
            const bestMove = game.agent.findBestMove(game.grid, game.currentShapes);
            if (!bestMove) {
                game.isDone = true; game.agent.fitness = game.score;
                if (game.score > this.highScore) this.highScore = game.score;
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
        if (bestAgentForDisplay) ui.updateBoard(bestAgentForDisplay.grid, this.mainGameBoardElement);

        ui.renderAgents(this.activeGames);
        ui.updateAIStats(this.generation, aliveCount, this.highScore);

        if (aliveCount === 0 && this.activeGames.length > 0) {
            clearInterval(this.gameLoopInterval); this.gameLoopInterval = null;
            const avgScore = this.activeGames.reduce((sum, g) => sum + g.score, 0) / this.activeGames.length;
            this.genHighScoreData.push({ generation: this.generation, highScore: this.highScore, avgScore: avgScore });
            this.updateChart();
            this.generation++;
            this.population = nextGeneration(this.population); this.runNextGeneration();
        }
    }

    updateTopScores(score) {
        this.top5Scores.push(score);
        this.top5Scores.sort((a, b) => b - a).splice(5);
        ui.updateHighScores(this.top5Scores);
    }
}