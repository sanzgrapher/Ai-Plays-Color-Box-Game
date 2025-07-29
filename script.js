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
            // Add listeners to each cell for previewing
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragenter', handleDragEnter);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
            boardElement.appendChild(cell);
        }
    }

    // --- Shape Generation (same as before) ---
    function generateRandomShape() {
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        const shapeElement = document.createElement('div');
        shapeElement.classList.add('shape');
        shapeElement.draggable = true;
        shapeElement.dataset.shape = JSON.stringify(randomShape);
        shapeElement.style.gridTemplateColumns = `repeat(${randomShape.layout[0].length}, 30px)`;

        randomShape.layout.flat().forEach(cellValue => {
            const shapeCell = document.createElement('div');
            if (cellValue === 1) {
                shapeCell.classList.add('shape-cell');
                shapeCell.style.backgroundColor = randomShape.color;
            } else {
                // Add an empty div to maintain grid structure for non-rectangular shapes
                shapeElement.appendChild(document.createElement('div'));
            }
            shapeElement.appendChild(shapeCell);
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


    // --- Drag and Drop Logic with Preview ---
    function handleDragStart(e) {
        draggedShape = e.target;
        draggedShapeData = JSON.parse(e.target.dataset.shape);
        // Use setTimeout to allow the browser to render the drag image
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
        e.preventDefault(); // Necessary to allow dropping
    }

    function handleDragEnter(e) {
        e.preventDefault();
        if (!draggedShapeData) return;

        const cellIndex = parseInt(e.target.dataset.index);
        const { x, y } = getCoordsFromIndex(cellIndex);

        clearPreview(); // Clear previous preview before drawing a new one

        if (canPlaceShape(draggedShapeData.layout, x, y)) {
            showPreview(draggedShapeData.layout, x, y, draggedShapeData.color);
        }
    }

    function handleDragLeave() {
        // We clear the preview in dragenter, so this can often be left empty,
        // but it's good practice to have it.
    }

    function handleDrop(e) {
        if (!draggedShapeData) return;

        const cellIndex = parseInt(e.target.dataset.index);
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

    // --- Preview and Placement Logic ---

    function clearPreview() {
        document.querySelectorAll('.cell.preview').forEach(cell => {
            cell.classList.remove('preview');
            cell.style.backgroundColor = ''; // Reset background
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
                        cell.style.backgroundColor = color; // Use shape's color for preview
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
                    // Check bounds and if the cell is already occupied
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
        score += placedBlocks; // Score based on blocks placed
    }


    // --- Board Update and Utility Functions ---

    function updateBoard() {
        const cells = boardElement.children;
        for (let i = 0; i < grid.length; i++) {
            cells[i].classList.remove('preview'); // Ensure no previews remain
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
        if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
            return null;
        }
        return y * boardSize + x;
    }

    function clearLines() {
        let linesCleared = 0;
        let rowsToClear = [];
        let colsToClear = [];

        // Identify full rows and columns
        for (let i = 0; i < boardSize; i++) {
            let rowFull = true;
            let colFull = true;
            for (let j = 0; j < boardSize; j++) {
                if (!grid[i * boardSize + j]) rowFull = false; // Check row i
                if (!grid[j * boardSize + i]) colFull = false; // Check col i
            }
            if (rowFull) rowsToClear.push(i);
            if (colFull) colsToClear.push(i);
        }

        // Clear the identified lines and update score
        const clearedCells = new Set();
        rowsToClear.forEach(y => {
            for (let x = 0; x < boardSize; x++) clearedCells.add(y * boardSize + x);
        });
        colsToClear.forEach(x => {
            for (let y = 0; y < boardSize; y++) clearedCells.add(y * boardSize + x);
        });

        if (clearedCells.size > 0) {
            clearedCells.forEach(index => grid[index] = null);
            score += clearedCells.size * 2; // Bonus points for clearing lines
            linesCleared = rowsToClear.length + colsToClear.length;
            score += linesCleared * 10; // Extra bonus per line
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