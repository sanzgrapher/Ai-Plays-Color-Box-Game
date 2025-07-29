document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('game-board');
    const shapesContainer = document.getElementById('shapes-container');
    const scoreElement = document.getElementById('score');
    const resetButton = document.getElementById('reset-button');
    const boardSize = 8;
    let score = 0;
    let grid = Array(boardSize * boardSize).fill(null);
    let draggedShape = null;

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
            boardElement.appendChild(cell);
        }
    }

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
            }
            shapeElement.appendChild(shapeCell);
        });

        shapeElement.addEventListener('dragstart', dragStart);
        shapeElement.addEventListener('dragend', dragEnd);
        return shapeElement;
    }

    function generateNextShapes() {
        shapesContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            shapesContainer.appendChild(generateRandomShape());
        }
    }

    function dragStart(e) {
        draggedShape = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    function dragEnd(e) {
        draggedShape.classList.remove('dragging');
        draggedShape = null;
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
        for (let y = 0; y < shapeLayout.length; y++) {
            for (let x = 0; x < shapeLayout[y].length; x++) {
                if (shapeLayout[y][x] === 1) {
                    const index = (startY + y) * boardSize + (startX + x);
                    grid[index] = color;
                    score++;
                }
            }
        }
    }

    function updateBoard() {
        const cells = boardElement.children;
        for (let i = 0; i < grid.length; i++) {
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

    function clearLines() {
        let linesCleared = 0;
        let fullRows = [];
        let fullCols = [];

        // Check for full rows
        for (let y = 0; y < boardSize; y++) {
            let isRowFull = true;
            for (let x = 0; x < boardSize; x++) {
                if (!grid[y * boardSize + x]) {
                    isRowFull = false;
                    break;
                }
            }
            if (isRowFull) {
                fullRows.push(y);
            }
        }

        // Check for full columns
        for (let x = 0; x < boardSize; x++) {
            let isColFull = true;
            for (let y = 0; y < boardSize; y++) {
                if (!grid[y * boardSize + x]) {
                    isColFull = false;
                    break;
                }
            }
            if (isColFull) {
                fullCols.push(x);
            }
        }

        if (fullRows.length > 0 || fullCols.length > 0) {
            fullRows.forEach(y => {
                for (let x = 0; x < boardSize; x++) grid[y * boardSize + x] = null;
                linesCleared++;
            });

            fullCols.forEach(x => {
                for (let y = 0; y < boardSize; y++) grid[y * boardSize + x] = null;
                // Avoid double counting if a cell is in both a full row and column
                if (!fullRows.includes(y)) linesCleared++;
            });

            score += (fullRows.length + fullCols.length) * 10;
            updateBoard();
        }
    }

    function init() {
        createBoard();
        grid = Array(boardSize * boardSize).fill(null);
        score = 0;
        updateBoard();
        generateNextShapes();
    }

    boardElement.addEventListener('dragover', e => e.preventDefault());
    boardElement.addEventListener('drop', e => {
        e.preventDefault();
        if (!draggedShape) return;

        const shapeData = JSON.parse(draggedShape.dataset.shape);
        const rect = boardElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellX = Math.floor(x / 50);
        const cellY = Math.floor(y / 50);

        if (canPlaceShape(shapeData.layout, cellX, cellY)) {
            placeShape(shapeData.layout, cellX, cellY, shapeData.color);
            clearLines();
            updateBoard();
            draggedShape.remove();

            if (shapesContainer.children.length === 0) {
                generateNextShapes();
            }
        }
    });

    resetButton.addEventListener('click', init);

    init();
});