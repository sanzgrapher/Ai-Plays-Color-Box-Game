import * as logic from './logic.js';
import { SHAPES, BOARD_SIZE } from './constants.js';

function getBoardHeuristics(grid) {
    let height = 0, holes = 0, linesCleared = 0, bumpiness = 0;
    const columnHeights = Array(BOARD_SIZE).fill(0);

    for (let x = 0; x < BOARD_SIZE; x++) {
        let colHeight = 0, foundTop = false;
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (grid[y * BOARD_SIZE + x]) {
                if (!foundTop) {
                    colHeight = BOARD_SIZE - y;
                    foundTop = true;
                }
            } else if (foundTop) {
                holes++;
            }
        }
        columnHeights[x] = colHeight;
    }
    height = columnHeights.reduce((a, b) => a + b, 0);

    for (let i = 0; i < BOARD_SIZE - 1; i++) {
        bumpiness += Math.abs(columnHeights[i] - columnHeights[i + 1]);
    }
    const clearedData = logic.clearLines(grid);
    linesCleared = clearedData.scoreToAdd > 0 ? (clearedData.scoreToAdd - clearedData.newGrid.filter(c => c).length + grid.filter(c => c).length) / BOARD_SIZE : 0;
    return { height, holes, linesCleared, bumpiness };
}


export class Agent {
    constructor(weights = null) {
        if (weights) { this.weights = weights; }
        else {
            this.weights = {
                height: Math.random() * -1.0,
                holes: Math.random() * -2.0,
                linesCleared: Math.random() * 2.0,
                bumpiness: Math.random() * -0.5
            };
        }
        this.fitness = 0;
    }

    findBestMove(grid, currentShapes) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const shapeData of currentShapes) {
            const layout = shapeData.layout;

            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {

                    if (logic.canPlaceShape(grid, layout, x, y)) {

                        let tempGrid = [...grid];
                        layout.forEach((row, rY) => {
                            row.forEach((cell, rX) => {
                                if (cell === 1) {
                                    const index = (y + rY) * BOARD_SIZE + (x + rX);
                                    if (index < tempGrid.length) {
                                        tempGrid[index] = shapeData.color;
                                    }
                                }
                            });
                        });

                        const heuristics = getBoardHeuristics(tempGrid);
                        const score = (heuristics.height * this.weights.height) +
                            (heuristics.holes * this.weights.holes) +
                            (heuristics.linesCleared * this.weights.linesCleared) +
                            (heuristics.bumpiness * this.weights.bumpiness);

                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { shapeData: shapeData, x: x, y: y };
                        }
                    }
                }
            }
        }

        return bestMove;
    }


    static crossover(parent1, parent2) {
        const childWeights = {};
        for (const key in parent1.weights) {
            childWeights[key] = Math.random() < 0.5 ? parent1.weights[key] : parent2.weights[key];
        }
        return new Agent(childWeights);
    }

    mutate(mutationRate) {
        for (const key in this.weights) {
            if (Math.random() < mutationRate) {
                this.weights[key] += (Math.random() * 0.4 - 0.2);
            }
        }
    }
}

export function nextGeneration(population, mutationRate = 0.05) {
    population.sort((a, b) => b.fitness - a.fitness);

    const newPopulation = [];
    const eliteCount = Math.floor(population.length * 0.1);
    for (let i = 0; i < eliteCount; i++) {
        newPopulation.push(new Agent(population[i].weights));
    }

    const breedingPoolSize = Math.floor(population.length * 0.5);
    while (newPopulation.length < population.length) {
        const parent1 = population[Math.floor(Math.random() * breedingPoolSize)];
        const parent2 = population[Math.floor(Math.random() * breedingPoolSize)];
        const child = Agent.crossover(parent1, parent2);
        child.mutate(mutationRate);
        newPopulation.push(child);
    }

    return newPopulation;
}