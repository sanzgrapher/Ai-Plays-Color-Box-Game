// js/logic.js

import { BOARD_SIZE } from './constants.js';

/**
 * Checks if a shape can be placed at a specific location on the grid.
 * @param {Array} grid - The current game grid.
 * @param {Object} shapeLayout - The 2D array of the shape.
 * @param {number} startX - The target X coordinate.
 * @param {number} startY - The target Y coordinate.
 * @returns {boolean} - True if the placement is valid, otherwise false.
 */
export function canPlaceShape(grid, shapeLayout, startX, startY) {
    for (let y = 0; y < shapeLayout.length; y++) {
        for (let x = 0; x < shapeLayout[y].length; x++) {
            if (shapeLayout[y][x] === 1) {
                const boardX = startX + x;
                const boardY = startY + y;
                if (
                    boardX >= BOARD_SIZE ||
                    boardY >= BOARD_SIZE ||
                    boardX < 0 ||
                    boardY < 0 ||
                    grid[boardY * BOARD_SIZE + boardX]
                ) {
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * Calculates the new grid and score after clearing lines.
 * @param {Array} grid - The current game grid.
 * @returns {{newGrid: Array, scoreToAdd: number}} - An object with the updated grid and the score earned.
 */
export function clearLines(grid) {
    let newGrid = [...grid];
    let rowsToClear = [];
    let colsToClear = [];

    // Identify full rows and columns
    for (let i = 0; i < BOARD_SIZE; i++) {
        let rowFull = true;
        let colFull = true;
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (!newGrid[i * BOARD_SIZE + j]) rowFull = false;
            if (!newGrid[j * BOARD_SIZE + i]) colFull = false;
        }
        if (rowFull) rowsToClear.push(i);
        if (colFull) colsToClear.push(i);
    }

    const clearedCells = new Set();
    rowsToClear.forEach(y => {
        for (let x = 0; x < BOARD_SIZE; x++) clearedCells.add(y * BOARD_SIZE + x);
    });
    colsToClear.forEach(x => {
        for (let y = 0; y < BOARD_SIZE; y++) clearedCells.add(y * BOARD_SIZE + x);
    });

    let scoreToAdd = 0;
    if (clearedCells.size > 0) {
        clearedCells.forEach(index => (newGrid[index] = null));
        const linesCleared = rowsToClear.length + colsToClear.length;
        scoreToAdd = clearedCells.size + linesCleared * 10; // Bonus for clearing
    }

    return { newGrid, scoreToAdd };
}

/**
 * Checks if there are any possible moves for the available shapes.
 * @param {Array} grid - The current game grid.
 * @param {Array} availableShapes - An array of shape data objects.
 * @returns {boolean} - True if the game is over, otherwise false.
 */
export function isGameOver(grid, availableShapes) {
    if (!availableShapes || availableShapes.length === 0) {
        return false; // Not over if a new batch can be generated.
    }

    for (const shapeData of availableShapes) {
        // Check every cell on the board as a potential top-left drop point.
        for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
            const x = i % BOARD_SIZE;
            const y = Math.floor(i / BOARD_SIZE);
            if (canPlaceShape(grid, shapeData.layout, x, y)) {
                return false; // Found at least one valid move for one shape.
            }
        }
    }

    return true; // No moves found for any of the available shapes.
}