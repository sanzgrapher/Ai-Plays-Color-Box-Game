// js/game.js (Controller)

import { BOARD_SIZE, SHAPES } from './constants.js';
import { GameState } from './state.js';
import * as logic from './logic.js';
import * as ui from './ui.js';

export class Game {
    constructor() {
        this.state = new GameState();

        // Bind event handlers to this instance to maintain context
        this.eventHandlers = {
            dragStart: this.handleDragStart.bind(this),
            dragEnd: this.handleDragEnd.bind(this),
            dragOver: e => e.preventDefault(),
            dragEnter: this.handleDragEnter.bind(this),
            dragLeave: this.handleDragLeave.bind(this),
            drop: this.handleDrop.bind(this),
        };
    }

    init() {
        this.state.reset();
        ui.hideGameOver();
        ui.createBoard(this.eventHandlers);
        this.updateUI();
        this.generateNextShapes();
    }

    updateUI() {
        ui.updateBoard(this.state.grid);
        ui.updateScore(this.state.score);
    }

    // --- Core Game Flow ---
    generateNextShapes() {
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

    placeShape(shapeLayout, startX, startY, color) {
        shapeLayout.forEach((row, y) => {
            row.forEach((cellValue, x) => {
                if (cellValue === 1) {
                    const index = (startY + y) * BOARD_SIZE + (startX + x);
                    this.state.grid[index] = color;
                }
            });
        });
        this.state.score += shapeLayout.flat().filter(v => v === 1).length;

        // Use logic to calculate cleared lines
        const { newGrid, scoreToAdd } = logic.clearLines(this.state.grid);
        this.state.grid = newGrid;
        this.state.score += scoreToAdd;

        this.updateUI();
    }

    handleGameOver() {
        this.state.isGameOver = true;
        ui.showGameOver(this.state.score);
    }

    // --- Event Handlers ---
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
        if (!this.state.draggedShapeData || this.state.isGameOver) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;

        const index = parseInt(cell.dataset.index);
        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);

        if (logic.canPlaceShape(this.state.grid, this.state.draggedShapeData.layout, x, y)) {
            ui.showPreview(this.state.draggedShapeData.layout, x, y, this.state.draggedShapeData.color);
        }
    }

    handleDragLeave() { }

    handleDrop(e) {
        e.preventDefault();
        if (!this.state.draggedShapeData || this.state.isGameOver) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;

        const index = parseInt(cell.dataset.index);
        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);

        if (logic.canPlaceShape(this.state.grid, this.state.draggedShapeData.layout, x, y)) {
            const draggedElement = document.querySelector('.shape.dragging');
            this.placeShape(this.state.draggedShapeData.layout, x, y, this.state.draggedShapeData.color);
            if (draggedElement) draggedElement.remove();

            if (logic.isGameOver(this.state.grid)) {
                this.handleGameOver();
                return;
            }

            if (ui.elements.shapesContainer.children.length === 0) {
                this.generateNextShapes();
            }
        }
    }
}