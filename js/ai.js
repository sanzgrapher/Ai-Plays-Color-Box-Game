import * as logic from './logic.js';
import { SHAPES, BOARD_SIZE } from './constants.js';

// --- Heuristics: How we numerically rate a board state ---
// These are the factors the AI will consider. The genetic algorithm learns the best weights for them.
function getBoardHeuristics(grid) {
    let height = 0;
    let holes = 0;
    let linesCleared = 0;
    let bumpiness = 0;
    const columnHeights = Array(BOARD_SIZE).fill(0);

    // Calculate column heights and initial holes
    for (let x = 0; x < BOARD_SIZE; x++) {
        let colHeight = 0;
        let foundTop = false;
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (grid[y * BOARD_SIZE + x]) {
                if (!foundTop) {
                    colHeight = BOARD_SIZE - y;
                    foundTop = true;
                }
            } else {
                if (foundTop) {
                    holes++;
                }
            }
        }
        columnHeights[x] = colHeight;
    }

    height = columnHeights.reduce((a, b) => a + b, 0);

    // Calculate bumpiness (the difference in height between adjacent columns)
    for (let i = 0; i < BOARD_SIZE - 1; i++) {
        bumpiness += Math.abs(columnHeights[i] - columnHeights[i + 1]);
    }

    const clearedData = logic.clearLines(grid);
    linesCleared = clearedData.scoreToAdd > 0 ? (clearedData.scoreToAdd - clearedData.newGrid.filter(c => c).length + grid.filter(c => c).length) / BOARD_SIZE : 0;


    return { height, holes, linesCleared, bumpiness };
}


// --- The AI Agent ---
export class Agent {
    constructor(weights = null) {
        // These are the weights for our heuristics. The GA will evolve these.
        if (weights) {
            this.weights = weights;
        } else {
            this.weights = {
                height: Math.random() * -1.0,
                holes: Math.random() * -2.0,
                linesCleared: Math.random() * 2.0,
                bumpiness: Math.random() * -0.5
            };
        }
        this.fitness = 0;
    }

    // --- The Decision Making ---
    findBestMove(grid, currentShapes) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const shapeData of currentShapes) {
            // NOTE: A full implementation would check all 4 rotations.
            // For simplicity and speed, we will only check the default rotation for now.
            const layout = shapeData.layout;
            const shapeWidth = layout[0].length;

            // Check all possible horizontal positions
            for (let x = -shapeWidth + 1; x < BOARD_SIZE; x++) {

                // Find where the piece would land
                let landingY = -1;
                for (let y = 0; y <= BOARD_SIZE; y++) {
                    if (logic.canPlaceShape(grid, layout, x, y)) {
                        landingY = y;
                    } else {
                        break;
                    }
                }

                if (landingY !== -1) {
                    // Create a temporary grid to simulate the move
                    let tempGrid = [...grid];
                    layout.forEach((row, rY) => {
                        row.forEach((cell, rX) => {
                            if (cell === 1) {
                                tempGrid[(landingY + rY) * BOARD_SIZE + (x + rX)] = shapeData.color;
                            }
                        });
                    });

                    // Score the resulting board state using the agent's weights
                    const heuristics = getBoardHeuristics(tempGrid);
                    const score = (heuristics.height * this.weights.height) +
                        (heuristics.holes * this.weights.holes) +
                        (heuristics.linesCleared * this.weights.linesCleared) +
                        (heuristics.bumpiness * this.weights.bumpiness);

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { shapeData: shapeData, x: x, y: landingY };
                    }
                }
            }
        }
        return bestMove;
    }


    // --- Genetic Algorithm Functions ---
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
                // Add a small random value (-0.2 to +0.2) to the weight
                this.weights[key] += (Math.random() * 0.4 - 0.2);
            }
        }
    }
}

// --- The Evolution Manager ---
export function nextGeneration(population, mutationRate = 0.05) {
    population.sort((a, b) => b.fitness - a.fitness);

    const newPopulation = [];
    // Elitism: Keep the top 10% of the best agents as they are.
    const eliteCount = Math.floor(population.length * 0.1);
    for (let i = 0; i < eliteCount; i++) {
        newPopulation.push(new Agent(population[i].weights));
    }

    // Breed the rest of the new population from the top 50%
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