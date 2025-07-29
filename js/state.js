import { BOARD_SIZE } from './constants.js';

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.grid = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
        this.score = 0;
        this.isGameOver = false;
        this.draggedShapeData = null;
        this.currentShapes = [];
    }
}