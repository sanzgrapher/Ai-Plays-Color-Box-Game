import * as logic from './logic.js';
import { SHAPES, BOARD_SIZE } from './constants.js';

function getBoardHeuristics(grid, remainingShapes) {
    let holes = 0;
    let linesClearedData = logic.clearLines(grid);
    let linesCleared = (linesClearedData.newGrid.filter(c => !c).length - grid.filter(c => !c).length) || 0;

    // 1. Placement Opportunities (Shape/Game Sense)
    // The most important new heuristic. How many options does this move leave for my NEXT turn?
    let placementOpportunities = 0;
    if (remainingShapes && remainingShapes.length > 0) {
        for (const shape of remainingShapes) {
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (logic.canPlaceShape(grid, shape.layout, x, y)) {
                        placementOpportunities++;
                    }
                }
            }
        }
    }

    let boardDensity = 0;
    let columnTransitions = 0;

    // Iterate through the board once to calculate holes, density, and transitions
    for (let x = 0; x < BOARD_SIZE; x++) {
        let colHasBlock = false;
        for (let y = 0; y < BOARD_SIZE; y++) {
            const index = y * BOARD_SIZE + x;
            const isOccupied = grid[index] !== null;

            // 2. Holes
            if (isOccupied) {
                colHasBlock = true;
            } else if (colHasBlock) {
                holes++;
            }

            // 3. Column Transitions (Smarter Bumpiness)
            if (y > 0) {
                const prevIsOccupied = grid[(y - 1) * BOARD_SIZE + x] !== null;
                if (isOccupied !== prevIsOccupied) {
                    columnTransitions++;
                }
            }

            // 4. Board Density (Clustering)
            if (isOccupied) {
                // Check all 8 neighbors
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                            if (grid[ny * BOARD_SIZE + nx] !== null) {
                                boardDensity++;
                            }
                        }
                    }
                }
            }
        }
    }

    return {
        holes,                  // How many unreachable empty cells.
        linesCleared,           // How many blocks were cleared.
        placementOpportunities, // How many future moves are possible.
        boardDensity,           // How tightly clustered the blocks are.
        columnTransitions       // How fragmented the columns are.
    };
}


export class Agent {
    constructor(weights = null) {
        if (weights) {
            this.weights = weights;
        } else {
            // Initialize with random weights for the NEW heuristics
            this.weights = {
                holes: Math.random() * -2.0 - 1, // Always very bad
                linesCleared: Math.random() * 2.0 + 1, // Always very good
                placementOpportunities: Math.random() * 1.0,
                boardDensity: Math.random() * 0.5,
                columnTransitions: Math.random() * -1.0,
            };
        }
        this.fitness = 0;
    }

    /**
     * The decision-making function, now updated to use the new heuristics.
     */
    findBestMove(grid, currentShapes) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const shapeData of currentShapes) {
            const layout = shapeData.layout;

            // The shapes that would be left in hand if this one is played
            const remainingShapes = currentShapes.filter(s => s.id !== shapeData.id);

            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (logic.canPlaceShape(grid, layout, x, y)) {
                        let tempGrid = [...grid];
                        layout.forEach((row, rY) => {
                            row.forEach((cell, rX) => {
                                if (cell === 1) {
                                    tempGrid[(y + rY) * BOARD_SIZE + (x + rX)] = shapeData.color;
                                }
                            });
                        });

                        // Pass the remaining shapes to the new heuristic function
                        const heuristics = getBoardHeuristics(tempGrid, remainingShapes);

                        // Calculate the score using the new weights
                        const score = (heuristics.holes * this.weights.holes) +
                            (heuristics.linesCleared * this.weights.linesCleared) +
                            (heuristics.placementOpportunities * this.weights.placementOpportunities) +
                            (heuristics.boardDensity * this.weights.boardDensity) +
                            (heuristics.columnTransitions * this.weights.columnTransitions);

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


    // --- Genetic Algorithm Functions (Unchanged) ---
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
                // Adjust mutation strength to be proportional to the weight's magnitude
                const mutationAmount = Math.abs(this.weights[key] * 0.2) + 0.1;
                this.weights[key] += (Math.random() * 2 - 1) * mutationAmount;
            }
        }
    }
}


function tournamentSelection(pool, k = 3) {
    let best = null;
    for (let i = 0; i < k; i++) {
        const contestant = pool[Math.floor(Math.random() * pool.length)];
        if (best === null || contestant.fitness > best.fitness) {
            best = contestant;
        }
    }
    return best;
}
export function nextGeneration(population, mutationRate = 0.05) {
    // 1. Sort the population by fitness (highest first)
    population.sort((a, b) => b.fitness - a.fitness);

    const newPopulation = [];

    // 2. Elitism: Directly clone the top 10% (the "elites") into the new population.
    // They are not mutated, which preserves the best strategies found so far.
    const eliteCount = Math.floor(population.length * 0.1);
    for (let i = 0; i < eliteCount; i++) {
        newPopulation.push(new Agent(population[i].weights));
    }

    // 3. Create a "Breeding Pool" from the top 50% of the old population.
    // All parents will now be selected ONLY from this pool of high-performers.
    const breedingPoolSize = Math.floor(population.length * 0.5);
    const breedingPool = population.slice(0, breedingPoolSize);

    // 4. Breed the rest of the new population from the Breeding Pool.
    while (newPopulation.length < population.length) {
        // Select two parents by having them win a tournament against other top performers.
        const parent1 = tournamentSelection(breedingPool);
        const parent2 = tournamentSelection(breedingPool);

        // Create a child by combining their successful genes.
        const child = Agent.crossover(parent1, parent2);

        // Mutate the child slightly to explore potential new improvements.
        child.mutate(mutationRate);

        newPopulation.push(child);
    }

    return newPopulation;
}