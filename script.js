document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('game-board');
    const shapesContainer = document.getElementById('shapes-container');
    const scoreElement = document.getElementById('score');
    const resetButton = document.getElementById('reset-button');
    const boardSize = 8;
    let score = 0;
    let grid = Array(boardSize * boardSize).fill(null);
    let draggedShape = null;
    let draggedShapeData = null;

    const shapes = [
        { name: 'I-3', layout: [[1], [1], [1]], color: '#3498db' },
        { name: 'I-4', layout: [[1], [1], [1], [1]], color: '#e74c3c' },
        { name: 'L-3', layout: [[1, 0], [1, 1]], color: '#2ecc71' },
        { name: 'L-4', layout: [[1, 0], [1, 0], [1, 1]], color: '#f1c40f' },
        { name: 'Square-2x2', layout: [[1, 1], [1, 1]], color: '#9b59b6' },
        { name: 'T-shape', layout: [[1, 1, 1], [0, 1, 0]], color: '#e67e22' },
        { name: 'S-shape', layout: [[0, 1, 1], [1, 1, 0]], color: '#1abc9c' },
        { name: 'Z-shape', layout: [[1, 1, 0], [0, 1, 1]], color: '#d35400' },
        { name: 'Dot', layout: [[1]], color: '#bdc3c7' }
    ];

    function createBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < boardSize * boardSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragenter', handleDragEnter);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
            boardElement.appendChild(cell);
        }
    }

    function generateRandomShape() {
        const shapeData = shapes[Math.floor(Math.random() * shapes.length)];
        const shapeElement = document.createElement('div');
        shapeElement.classList.add('shape');
        shapeElement.draggable = true;
        shapeElement.dataset.shape = JSON.stringify(shapeData);

        const numRows = shapeData.layout.length;
        const numCols = shapeData.layout[0].length;

        // Explicitly define the grid structure for the shape element
        shapeElement.style.gridTemplateRows = `repeat(${numRows}, 30px)`;
        shapeElement.style.gridTemplateColumns = `repeat(${numCols}, 30px)`;

        // Use nested loops to build the shape visually, matching its layout array
        shapeData.layout.forEach(row => {
            row.forEach(cellValue => {
                const cell = document.createElement('div');
                if (cellValue === 1) {
                    cell.classList.add('shape-cell');
                    cell.style.backgroundColor = shapeData.color;
                }
                // If cellValue is 0, an empty, transparent div is appended,
                // which correctly creates the empty space in the shape.
                shapeElement.appendChild(cell);
            });
        });

        shapeElement.addEventListener('dragstart', handleDragStart);
        shapeElement.addEventListener('dragend', handleDragEnd);
        return shapeElement;
    }

    function generateNextShapes() {
        shapesContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            shapesContainer.appendChild(generateRandomShape());
        }
    }

    // --- Drag and Drop Logic (same as before) ---
    function handleDragStart(e) {
        draggedShape = e.target;
        draggedShapeData = JSON.parse(e.target.dataset.shape);
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    function handleDragEnd() {
        if (draggedShape) {
            draggedShape.classList.remove('dragging');
        }
        clearPreview();
        draggedShape = null;
        draggedShapeData = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDragEnter(e) {
        e.preventDefault();
        if (!draggedShapeData) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const cellIndex = parseInt(cell.dataset.index);
        const { x, y } = getCoordsFromIndex(cellIndex);

        clearPreview();

        if (canPlaceShape(draggedShapeData.layout, x, y)) {
            showPreview(draggedShapeData.layout, x, y, draggedShapeData.color);
        }
    }

    function handleDragLeave() {
        // Clearing is handled by handleDragEnter of the next cell
    }

    function handleDrop(e) {
        if (!draggedShapeData) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const cellIndex = parseInt(cell.dataset.index);
        const { x, y } = getCoordsFromIndex(cellIndex);

        if (canPlaceShape(draggedShapeData.layout, x, y)) {
            placeShape(draggedShapeData.layout, x, y, draggedShapeData.color);
            clearLines();
            updateBoard();
            draggedShape.remove();

            if (shapesContainer.children.length === 0) {
                generateNextShapes();
            }
        }
    }

    // --- Preview and Placement Logic (same as before) ---
    function clearPreview() {
        document.querySelectorAll('.cell.preview').forEach(cell => {
            cell.classList.remove('preview');
            // Only remove style if it's not an occupied cell
            if (!cell.classList.contains('occupied')) {
                cell.style.backgroundColor = '';
            }
        });
    }

    function showPreview(shapeLayout, startX, startY, color) {
        shapeLayout.forEach((row, y) => {
            row.forEach((cellValue, x) => {
                if (cellValue === 1) {
                    const boardX = startX + x;
                    const boardY = startY + y;
                    const index = getIndexFromCoords(boardX, boardY);
                    if (index !== null) {
                        const cell = boardElement.children[index];
                        cell.classList.add('preview');
                        cell.style.backgroundColor = color;
                    }
                }
            });
        });
    }

    function canPlaceShape(shapeLayout, startX, startY) {
        for (let y = 0; y < shapeLayout.length; y++) {
            for (let x = 0; x < shapeLayout[y].length; x++) {
                if (shapeLayout[y][x] === 1) {
                    const boardX = startX + x;
                    const boardY = startY + y;
                    if (boardX >= boardSize || boardY >= boardSize || grid[boardY * boardSize + boardX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function placeShape(shapeLayout, startX, startY, color) {
        let placedBlocks = 0;
        shapeLayout.forEach((row, y) => {
            row.forEach((cellValue, x) => {
                if (cellValue === 1) {
                    const index = (startY + y) * boardSize + (startX + x);
                    grid[index] = color;
                    placedBlocks++;
                }
            });
        });
        score += placedBlocks;
    }

    // --- Board Update and Utility Functions (same as before) ---
    function updateBoard() {
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
        scoreElement.textContent = score;
    }

    function getCoordsFromIndex(index) {
        return { x: index % boardSize, y: Math.floor(index / boardSize) };
    }

    function getIndexFromCoords(x, y) {
        if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) return null;
        return y * boardSize + x;
    }

    function clearLines() {
        let rowsToClear = [];
        let colsToClear = [];

        for (let i = 0; i < boardSize; i++) {
            let rowFull = true;
            let colFull = true;
            for (let j = 0; j < boardSize; j++) {
                if (!grid[i * boardSize + j]) rowFull = false;
                if (!grid[j * boardSize + i]) colFull = false;
            }
            if (rowFull) rowsToClear.push(i);
            if (colFull) colsToClear.push(i);
        }

        const clearedCells = new Set();
        rowsToClear.forEach(y => {
            for (let x = 0; x < boardSize; x++) clearedCells.add(y * boardSize + x);
        });
        colsToClear.forEach(x => {
            for (let y = 0; y < boardSize; y++) clearedCells.add(y * boardSize + x);
        });

        if (clearedCells.size > 0) {
            clearedCells.forEach(index => grid[index] = null);
            let linesCleared = rowsToClear.length + colsToClear.length;
            if (rowsToClear.length > 0 && colsToClear.length > 0) {
                // Adjust for double-counting corners
                linesCleared -= new Set([...rowsToClear, ...colsToClear]).size;
            }
            score += clearedCells.size * 2 + linesCleared * 10;
        }
    }

    function init() {
        createBoard();
        grid = Array(boardSize * boardSize).fill(null);
        score = 0;
        updateBoard();
        generateNextShapes();
    }

    resetButton.addEventListener('click', init);

    init();
});