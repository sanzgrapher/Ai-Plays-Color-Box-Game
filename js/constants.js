export const BOARD_SIZE = 8;

export const SHAPES = [
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