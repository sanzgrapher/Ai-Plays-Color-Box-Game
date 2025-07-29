// js/controller.js

import { BOARD_SIZE, SHAPES } from './constants.js';
import * as logic from './logic.js';
import * as ui from './ui.js';
import { GameState } from './state.js';

/**
 * Manages the state and user interaction for a playable game instance.
 * This controller is used by both the main "Player Mode" and the "Replay" tool.
 */
export class GameController {
    constructor(elements) {
        this.elements = elements; // DOM elements for board, score, shapes, etc.
        this.state = new GameState();

        this.eventHandlers = {
            dragStart: this.handleDragStart.bind(this),
            dragEnd: this.handleDragEnd.bind(this),
            dragOver: (e) => e.preventDefault(),
            dragEnter: this.handleDragEnter.bind(this),
            dragLeave: this.handleDragLeave.bind(this),
            drop: this.handleDrop.bind(this),
        };
    }

    // FIX: This method has the corrected logic flow
    init(initialState = null) {
        if (initialState) {
            // This path is for the Replay Tool
            // Load the provided state directly.
            this.state.grid = initialState.grid;
            this.state.score = initialState.score;
            this.state.currentShapes = initialState.currentShapes;

            // Render the full batch for visualization, only making available shapes interactive.
            ui.renderShapes(initialState.currentBatch, initialState.currentShapes, this.elements.shapesContainer, this.eventHandlers);

        } else {
            // This path is for starting a NEW GAME in Player Mode
            // Reset the state to its default (empty grid, score 0).
            this.state.reset();
            // Generate a fresh batch of 3 shapes.
            this.generatePlayerShapes();
        }

        // This logic is common to both modes: create the board, update the UI, and check the status.
        ui.createBoard(this.elements.board, this.eventHandlers);
        this.updateUI();
        this.updatePlayabilityStatus();
    }

    updateUI() {
        ui.updateBoard(this.state.grid, this.elements.board);
        ui.updateScore(this.state.score, this.elements.score);
    }

    updatePlayabilityStatus() {
        // This function is only relevant for the replay tool's status display.
        if (!this.elements.status) return;

        const isOver = logic.isGameOver(this.state.grid, this.state.currentShapes);
        if (isOver) {
            this.elements.status.textContent = 'Game Over: No valid moves possible.';
            this.elements.status.className = 'gameover';
        } else {
            this.elements.status.textContent = 'Playable: A valid move exists.';
            this.elements.status.className = 'possible';
        }
    }

    generatePlayerShapes() {
        // Now calls the single, unified function from logic.js
        const newShapes = logic.generateShapeBatch();

        this.state.currentShapes = newShapes;
        // For a new game, the available shapes are the same as the full batch.
        ui.renderShapes(newShapes, newShapes, this.elements.shapesContainer, this.eventHandlers);
    }

    // --- All Drag & Drop Handlers are Unchanged and Correct ---
    handleDragStart(e) {
        this.state.draggedShapeData = JSON.parse(e.target.dataset.shape);
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        ui.clearPreview(this.elements.board);
        this.state.draggedShapeData = null;
    }

    handleDragEnter(e) {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (!this.state.draggedShapeData || !cell) return;

        ui.clearPreview(this.elements.board);
        const index = parseInt(cell.dataset.index);
        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);
        if (logic.canPlaceShape(this.state.grid, this.state.draggedShapeData.layout, x, y)) {
            ui.showPreview(this.elements.board, this.state.draggedShapeData.layout, x, y, this.state.draggedShapeData.color);
        }
    }

    handleDragLeave() { }

    handleDrop(e) {
        e.preventDefault();
        if (!this.state.draggedShapeData) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;

        ui.clearPreview(this.elements.board);
        const index = parseInt(cell.dataset.index);
        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);

        if (logic.canPlaceShape(this.state.grid, this.state.draggedShapeData.layout, x, y)) {
            const { layout, color, id } = this.state.draggedShapeData;

            layout.forEach((row, rY) => {
                row.forEach((val, rX) => {
                    if (val === 1) this.state.grid[(y + rY) * BOARD_SIZE + (x + rX)] = color;
                });
            });

            this.state.score += layout.flat().filter(v => v === 1).length;
            const { newGrid, scoreToAdd } = logic.clearLines(this.state.grid);
            this.state.grid = newGrid;
            this.state.score += scoreToAdd;

            this.state.currentShapes = this.state.currentShapes.filter(s => s.id !== id);
            const shapeEl = this.elements.shapesContainer.querySelector(`[data-shape*='"id":"${id}"']`);
            if (shapeEl) shapeEl.remove();

            this.updateUI();

            if (this.state.currentShapes.length === 0) {
                if (this.elements.status) { // In replay mode
                    alert('Batch complete! Load a new state to continue analysis.');
                } else { // In player mode
                    this.generatePlayerShapes();
                }
            } else if (logic.isGameOver(this.state.grid, this.state.currentShapes)) {
                this.updatePlayabilityStatus();
                if (!this.elements.status) { // Don't show overlay in replay tool
                    ui.showGameOver(this.state.score);
                }
            }
            this.updatePlayabilityStatus();
        }
    }
}