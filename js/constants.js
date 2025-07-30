export const BOARD_SIZE = 8;

export const SHAPES = [
    // I (Line) Shapes
    { name: 'I-2-vertical', layout: [[1], [1]], color: '#00b894' },
    { name: 'I-2-horizontal', layout: [[1, 1]], color: '#0984e3' },
    { name: 'I-3-vertical', layout: [[1], [1], [1]], color: '#3498db' },
    { name: 'I-3-horizontal', layout: [[1, 1, 1]], color: '#16a085' },
    { name: 'I-4-vertical', layout: [[1], [1], [1], [1]], color: '#e74c3c' },
    { name: 'I-4-horizontal', layout: [[1, 1, 1, 1]], color: '#8e44ad' },
    { name: 'I-5-vertical', layout: [[1], [1], [1], [1], [1]], color: '#34495e' },
    // Square & Rectangle Shapes
    { name: 'Square-2x2', layout: [[1, 1], [1, 1]], color: '#9b59b6' },
    { name: 'Square-3x3', layout: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#f39c12' },
    { name: 'Rect-3x2', layout: [[1, 1, 1], [1, 1, 1]], color: '#c0392b' },
    { name: 'Rect-2x3', layout: [[1, 1], [1, 1], [1, 1]], color: '#27ae60' },
    // L Shapes & Variations
    { name: 'L-3', layout: [[1, 0], [1, 1]], color: '#2ecc71' },
    { name: 'L-4', layout: [[1, 0], [1, 0], [1, 1]], color: '#f1c40f' },
    { name: 'L-upside-down', layout: [[0, 1], [0, 1], [1, 1]], color: '#e84393' },
    { name: 'L-right', layout: [[1, 1], [1, 0], [1, 0]], color: '#00b894' },
    { name: 'L-left', layout: [[1, 1], [0, 1], [0, 1]], color: '#fdcb6e' },
    // T Shapes & Variations
    { name: 'T-shape', layout: [[1, 1, 1], [0, 1, 0]], color: '#e67e22' },
    { name: 'T-up', layout: [[0, 1, 0], [1, 1, 1]], color: '#6c5ce7' },
    { name: 'T-down', layout: [[1, 1, 1], [0, 1, 0]], color: '#00cec9' },
    { name: 'T-left', layout: [[1, 0], [1, 1], [1, 0]], color: '#dfe6e9' },
    { name: 'T-right', layout: [[0, 1], [1, 1], [0, 1]], color: '#636e72' },
    // S/Z Shapes
    { name: 'S-shape', layout: [[0, 1, 1], [1, 1, 0]], color: '#1abc9c' },
    { name: 'Z-shape', layout: [[1, 1, 0], [0, 1, 1]], color: '#d35400' },
    // Dot
    { name: 'Dot', layout: [[1]], color: '#bdc3c7' },
    // Right Angle & Other
    { name: 'Right Angle (3v3h)', layout: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: '#ff7675' }
];