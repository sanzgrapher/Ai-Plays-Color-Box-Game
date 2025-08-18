// js/ui.js
import { BOARD_SIZE, SHAPES } from './constants.js';

// Function to populate the shapes carousel
export function populateShapesCarousel() {
    console.log('Populating shapes carousel...');
    const carousel = document.getElementById('shapes-carousel');
    if (!carousel) {
        console.error('Shapes carousel element not found!');
        return;
    }
    
    console.log('Found carousel element, adding shapes...');
    carousel.innerHTML = '';
    
    SHAPES.forEach((shape, index) => {
        const shapeContainer = document.createElement('div');
        shapeContainer.className = 'flex flex-col items-center gap-2 flex-shrink-0';
        
        // Create square container for the shape
        const shapeSquare = document.createElement('div');
        shapeSquare.className = 'w-16 h-16 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center transition-transform hover:scale-105 hover:shadow-lg';
        
        const shapeGrid = document.createElement('div');
        shapeGrid.className = 'shape-grid';
        shapeGrid.style.display = 'grid';
        shapeGrid.style.gridTemplateRows = `repeat(${shape.layout.length}, 8px)`;
        shapeGrid.style.gridTemplateColumns = `repeat(${shape.layout[0].length}, 8px)`;
        shapeGrid.style.gap = '1px';
        
        // Create grid cells
        shape.layout.forEach(row => {
            row.forEach(cell => {
                const cellElement = document.createElement('div');
                if (cell) {
                    cellElement.style.backgroundColor = shape.color;
                    cellElement.style.borderRadius = '1px';
                    cellElement.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                } else {
                    cellElement.style.backgroundColor = 'transparent';
                }
                shapeGrid.appendChild(cellElement);
            });
        });
        
        // Add shape grid to square
        shapeSquare.appendChild(shapeGrid);
        
        // Create name label below the square
        const shapeName = document.createElement('div');
        shapeName.className = 'text-xs font-medium text-gray-600 text-center max-w-16 leading-tight';
        shapeName.textContent = shape.name;
        
        shapeContainer.appendChild(shapeSquare);
        shapeContainer.appendChild(shapeName);
        carousel.appendChild(shapeContainer);
    });
    
    // Start auto-scroll
    startCarouselAutoScroll(carousel);
    
    // Populate shape labels
    populateShapeLabels();
    
    console.log(`Added ${SHAPES.length} shapes to carousel`);
}

// Function to start auto-scroll for the carousel
function startCarouselAutoScroll(carousel) {
    let scrollDirection = 1;
    let scrollSpeed = 0.5;
    
    const autoScroll = () => {
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        
        if (carousel.scrollLeft >= maxScroll) {
            scrollDirection = -1;
        } else if (carousel.scrollLeft <= 0) {
            scrollDirection = 1;
        }
        
        carousel.scrollLeft += scrollDirection * scrollSpeed;
    };
    
    // Start auto-scroll
    const scrollInterval = setInterval(autoScroll, 30);
    
    // Pause on hover
    carousel.addEventListener('mouseenter', () => {
        clearInterval(scrollInterval);
    });
    
    carousel.addEventListener('mouseleave', () => {
        const newInterval = setInterval(autoScroll, 30);
        // Store the new interval on the carousel element
        carousel.scrollInterval = newInterval;
    });
}

// Function to populate shape type labels
function populateShapeLabels() {
    const labelsContainer = document.querySelector('.shape-labels-caption');
    if (!labelsContainer) return;
    
    // Extract unique shape categories
    const categories = new Map();
    
    SHAPES.forEach(shape => {
        const category = shape.name.split('-')[0]; // Get the base type (I, Square, L, T, etc.)
        if (!categories.has(category)) {
            categories.set(category, {
                name: category,
                color: shape.color,
                count: 1
            });
        } else {
            categories.get(category).count++;
        }
    });
    
    labelsContainer.innerHTML = '';
    
    categories.forEach((info, category) => {
        const label = document.createElement('span');
        label.className = 'shape-label';
        
        const colorDot = document.createElement('span');
        colorDot.className = 'shape-label-color';
        colorDot.style.backgroundColor = info.color;
        
        const text = document.createElement('span');
        text.textContent = `${category} (${info.count})`;
        
        label.appendChild(colorDot);
        label.appendChild(text);
        labelsContainer.appendChild(label);
    });
}

// --- Generic, Reusable UI Functions for game instances ---

export function createBoard(boardElement, eventHandlers) {
    boardElement.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('dragover', eventHandlers.dragOver);
        cell.addEventListener('dragenter', eventHandlers.dragEnter);
        cell.addEventListener('dragleave', eventHandlers.dragLeave);
        cell.addEventListener('drop', eventHandlers.drop);
        boardElement.appendChild(cell);
    }
}

export function updateBoard(grid, boardElement) {
    const cells = boardElement.children;
    for (let i = 0; i < grid.length; i++) {
        cells[i].classList.remove('preview');
        if (grid[i]) {
            cells[i].classList.add('occupied');
            cells[i].style.backgroundColor = grid[i];
        } else {
            cells[i].classList.remove('occupied');
            cells[i].style.backgroundColor = '';
        }
    }
}

export function updateScore(score, scoreElement) {
    scoreElement.textContent = score;
}

export function renderShapes(fullBatch, availableShapes, containerElement, eventHandlers) {
    containerElement.innerHTML = '';
    const availableShapeIds = new Set(availableShapes.map(s => s.id));

    fullBatch.forEach(shapeData => {
        const shapeEl = createSingleShapeElement(shapeData);
        const isAvailable = availableShapeIds.has(shapeData.id);

        shapeEl.style.opacity = isAvailable ? '1.0' : '0.2';
        shapeEl.title = isAvailable ? 'Available to play' : 'This shape was already used';

        if (isAvailable) {
            shapeEl.draggable = true;
            shapeEl.addEventListener('dragstart', eventHandlers.dragStart);
            shapeEl.addEventListener('dragend', eventHandlers.dragEnd);
        }
        containerElement.appendChild(shapeEl);
    });
}

// Helper function to create a shape's visual element
function createSingleShapeElement(shapeData) {
    const shapeElement = document.createElement('div');
    shapeElement.classList.add('shape');
    shapeElement.dataset.shape = JSON.stringify(shapeData);
    shapeElement.style.gridTemplateRows = `repeat(${shapeData.layout.length}, 30px)`;
    shapeElement.style.gridTemplateColumns = `repeat(${shapeData.layout[0].length}, 30px)`;

    shapeData.layout.forEach(row => {
        row.forEach(cellValue => {
            const cell = document.createElement('div');
            if (cellValue === 1) {
                cell.classList.add('shape-cell');
                cell.style.backgroundColor = shapeData.color;
            }
            shapeElement.appendChild(cell);
        });
    });
    return shapeElement;
}


export function showPreview(boardElement, layout, startX, startY, color) {
    clearPreview(boardElement);
    layout.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value === 1) {
                const boardX = startX + x, boardY = startY + y;
                if (boardX < 0 || boardX >= BOARD_SIZE || boardY < 0 || boardY >= BOARD_SIZE) return;
                const index = boardY * BOARD_SIZE + boardX;
                const cell = boardElement.children[index];
                if (cell && !cell.classList.contains('occupied')) {
                    cell.classList.add('preview');
                    cell.style.backgroundColor = color;
                }
            }
        });
    });
}

export function clearPreview(boardElement) {
    boardElement.querySelectorAll('.cell.preview').forEach(cell => {
        cell.classList.remove('preview');
        if (!cell.classList.contains('occupied')) {
            cell.style.backgroundColor = '';
        }
    });
}

// --- High-Level UI Functions (Not part of controller) ---
export function showGameOver(score) {
    const finalScoreEl = document.getElementById('final-score');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    // Only proceed if the element is actually on the page.
    if (finalScoreEl && gameOverOverlay) {
        finalScoreEl.textContent = `Final Score: ${score}`;
        gameOverOverlay.classList.remove('hidden');
    }
}

export function hideGameOver() {
    const gameOverOverlay = document.getElementById('game-over-overlay');
    // Only proceed if the element is actually on the page.
    if (gameOverOverlay) {
        gameOverOverlay.classList.add('hidden');
    }
}

export function updateAIStats(generation, alive, highScore) {
    document.getElementById('generation-stat').textContent = generation;
    document.getElementById('alive-stat').textContent = alive;
    document.getElementById('highscore-stat').textContent = highScore;
}

export function updateHighScores(scores) {
    const list = document.getElementById('highscore-list');
    if (list) {
        list.innerHTML = '';
        scores.forEach((score, index) => {
            const li = document.createElement('li');
            // Add rank medal emoji for top 3
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            li.innerHTML = `<span>${medal}</span><span>${score}</span>`;
            list.appendChild(li);
        });
    }
    
    // Update the current best display (removed from ai_trainer.html but may exist in other pages)
    const currentBestDisplay = document.getElementById('current-best-display');
    if (currentBestDisplay && scores.length > 0) {
        currentBestDisplay.textContent = scores[0];
    }
}

export function updateGenerationScoreStrip(generationScores) {
    if (!generationScores || generationScores.length === 0) return;
    
    // Sort scores to get top and bottom performers
    const sortedScores = [...generationScores].sort((a, b) => b - a);
    const top3 = sortedScores.slice(0, 3);
    const bottom3 = sortedScores.slice(-3); // Keep original order: 3rd last, 2nd last, last
    
    // Update top 3
    const topElements = ['gen-top-1', 'gen-top-2', 'gen-top-3'];
    topElements.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = top3[index] !== undefined ? top3[index] : '---';
        }
    });
    
    // Update bottom 3 in correct sequence
    const bottomElements = ['gen-bottom-3', 'gen-bottom-2', 'gen-bottom-1'];
    bottomElements.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = bottom3[index] !== undefined ? bottom3[index] : '---';
        }
    });
}

export function updateDistributionScoreStrip(agentScores) {
    if (!agentScores || agentScores.length === 0) return;
    
    // Sort scores to get top and bottom performers
    const sortedScores = [...agentScores].sort((a, b) => b - a);
    const top3 = sortedScores.slice(0, 3);
    const bottom3 = sortedScores.slice(-3); // Keep original order: 3rd last, 2nd last, last
    
    // Update top 3
    const topElements = ['dist-top-1', 'dist-top-2', 'dist-top-3'];
    topElements.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = top3[index] !== undefined ? top3[index] : '---';
        }
    });
    
    // Update bottom 3 in correct sequence
    const bottomElements = ['dist-bottom-3', 'dist-bottom-2', 'dist-bottom-1'];
    bottomElements.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = bottom3[index] !== undefined ? bottom3[index] : '---';
        }
    });
}

export function renderAgents(agentGames) {

    const container = document.getElementById('agents-list');
    if (!container) return;
    container.innerHTML = '';

    // Calculate score range for color scaling
    const scores = agentGames.map(game => game.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore;

    // Function to get color based on score
    function getScoreColor(score) {
        if (scoreRange === 0) return { bg: '#f0fdf4', border: '#bbf7d0', text: '#059669' }; // Default green
        
        const normalizedScore = (score - minScore) / scoreRange; // 0 to 1
        
        if (normalizedScore >= 0.8) {
            return { bg: '#dcfce7', border: '#16a34a', text: '#15803d' }; // Dark green
        } else if (normalizedScore >= 0.6) {
            return { bg: '#f0fdf4', border: '#22c55e', text: '#059669' }; // Green
        } else if (normalizedScore >= 0.4) {
            return { bg: '#fefce8', border: '#eab308', text: '#ca8a04' }; // Yellow
        } else if (normalizedScore >= 0.2) {
            return { bg: '#fed7aa', border: '#ea580c', text: '#c2410c' }; // Orange
        } else {
            return { bg: '#fecaca', border: '#dc2626', text: '#b91c1c' }; // Red
        }
    }

    agentGames.forEach((game) => {
        const div = document.createElement('div');
        div.classList.add('agent-card', game.isDone ? 'done' : 'active');
        
        // Create header with ID and Copy button
        const header = document.createElement('div');
        header.className = 'agent-header';
        header.innerHTML = `
            <span class="agent-id">Agent #${game.agent.id + 1}</span>
        `;
        
        // Add copy button to header
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.className = 'agent-copy-btn';
        copyBtn.onclick = () => {
            const stateToCopy = { score: game.score, isDone: game.isDone, grid: game.grid, currentBatch: game.currentBatch, currentShapes: game.currentShapes, agentWeights: game.agent.weights };
            navigator.clipboard.writeText(JSON.stringify(stateToCopy, null, 2));
        };
        header.appendChild(copyBtn);
        div.appendChild(header);

        // Create info row with shapes and score
        const infoRow = document.createElement('div');
        infoRow.className = 'agent-info-row';

        const batchContainer = document.createElement('div');
        batchContainer.className = 'agent-batch-container';

        if (game.currentBatch && game.currentBatch.length > 0) {
            const availableShapeIds = new Set(game.currentShapes.map(s => s.id));
            game.currentBatch.forEach((shape) => {
                const shapeDiv = document.createElement('div');
                shapeDiv.className = 'agent-mini-shape';
                shapeDiv.style.gridTemplateRows = `repeat(${shape.layout.length}, 3px)`;
                shapeDiv.style.gridTemplateColumns = `repeat(${shape.layout[0].length}, 3px)`;
                shapeDiv.style.opacity = availableShapeIds.has(shape.id) ? '1.0' : '0.3';

                for (let y = 0; y < shape.layout.length; y++) {
                    for (let x = 0; x < shape.layout[0].length; x++) {
                        const cell = shape.layout[y][x];
                        const cellDiv = document.createElement('div');
                        cellDiv.className = 'agent-mini-shape-cell';
                        cellDiv.style.backgroundColor = cell ? shape.color : 'transparent';
                        shapeDiv.appendChild(cellDiv);
                    }
                }
                batchContainer.appendChild(shapeDiv);
            });
        }

        // Add score to info row
        const scoreColors = getScoreColor(game.score);
        const scoreElement = document.createElement('span');
        scoreElement.className = 'agent-score';
        scoreElement.style.backgroundColor = scoreColors.bg;
        scoreElement.style.borderColor = scoreColors.border;
        scoreElement.style.color = scoreColors.text;
        scoreElement.textContent = game.score;

        infoRow.appendChild(batchContainer);
        infoRow.appendChild(scoreElement);
        div.appendChild(infoRow);

        // Create board using same structure as main game board
        const board = document.createElement('div');
        board.className = 'agent-mini-board';

        game.grid.forEach((cellColor, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'agent-mini-board-cell';
            cellDiv.dataset.index = index;
            
            if (cellColor) {
                cellDiv.classList.add('occupied');
                cellDiv.style.backgroundColor = cellColor;
            }
            
            board.appendChild(cellDiv);
        });
        div.appendChild(board);

        container.appendChild(div);
    });
}


export function updateModelOutput(modelWeights) {
    const bestEl = document.getElementById('best-model-output');
    const robustEl = document.getElementById('robust-model-output');
    const worstEl = document.getElementById('worst-model-output');
    if (!bestEl || !robustEl || !worstEl) return;
    if (modelWeights && modelWeights.best) {
        bestEl.value = JSON.stringify(modelWeights.best, null, 2);
    } else {
        bestEl.value = 'Run the simulation to generate a model...';
    }
    if (modelWeights && modelWeights.robust) {
        robustEl.value = JSON.stringify(modelWeights.robust, null, 2);
    } else {
        robustEl.value = 'Run the simulation to generate a model...';
    }
    if (modelWeights && modelWeights.worst) {
        worstEl.value = JSON.stringify(modelWeights.worst, null, 2);
    } else {
        worstEl.value = 'Run the simulation to generate a model...';
    }
}
export function highlightHintShape(shapeId) {
    const container = document.getElementById('shapes-container');
    const shapeEl = container.querySelector(`[data-shape*='"id":"${shapeId}"']`);
    if (shapeEl) {
        shapeEl.classList.add('hint-shape');
    }
}
export function highlightHintPlacement(boardElement, layout, x, y) {
    layout.forEach((row, rY) => {
        row.forEach((cell, rX) => {
            if (cell === 1) {
                const index = (y + rY) * BOARD_SIZE + (x + rX);
                const cellEl = boardElement.children[index];
                if (cellEl) {
                    cellEl.classList.add('hint-placement');
                }
            }
        });
    });
}
export function clearAllHighlights() {
    document.querySelectorAll('.hint-shape').forEach(el => el.classList.remove('hint-shape'));
    document.querySelectorAll('.cell.hint-placement').forEach(el => el.classList.remove('hint-placement'));
}