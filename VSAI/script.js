/* 
  Crystal Connect | RS PROJECT [ nightcoreat ]
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("gameStatus");
const restartBtn = document.getElementById("restartBtn");
const playerScoreText = document.getElementById("playerScore");
const player2ScoreText = document.getElementById("player2Score");

const GRID_SIZE = 6;
const DOT_RADIUS = 8;
const EDGE_THICKNESS = 12;
const EDGE_HIT_RADIUS = 14;
const PADDING = 70;
const COLORS = {
    background: "#111",
    dot: "#e8e8ff",
    edgeEmpty: "rgba(150, 180, 255, 0.35)",
    edgeTakenPlayer: "#6a85ff", 
    edgeTakenAi: "#ff7a88",    
    edgeHover: "#f7ff8c",
    playerBox: "rgba(39, 183, 255, 0.35)",
    aiBox: "rgba(255, 96, 118, 0.32)",
    highlight: "rgba(255, 255, 255, 0.12)" 
};

let state = {
    horizontal: Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE - 1).fill(0)),
    vertical: Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE).fill(0)),
    boxes: Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE - 1).fill(0)),
    currentPlayer: 1,
    scores: { 1: 0, 2: 0 },
    hoverEdge: null,
    pointer: null
};

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
}

function getBoardMetrics() {
    const dpr = window.devicePixelRatio || 1;
    const boardSize = Math.min(canvas.width, canvas.height) - PADDING * 2 * dpr;
    const spacing = boardSize / ((GRID_SIZE - 1) * Math.SQRT2);
    return { spacing, centerX: canvas.width / 2, centerY: canvas.height / 2 };
}

function dotPosition(row, col) {
    const { spacing, centerX, centerY } = getBoardMetrics();
    const offset = (GRID_SIZE - 1) / 2;
    const gridX = (col - offset) * spacing;
    const gridY = (row - offset) * spacing;
    return {
        x: (gridX - gridY) / Math.SQRT2 + centerX,
        y: (gridX + gridY) / Math.SQRT2 + centerY
    };
}

function applyMove(edge) {
    if (!edge || isBoardComplete()) return;
    const { type, row, col } = edge;

    if (type === "h") state.horizontal[row][col] = state.currentPlayer;
    else state.vertical[row][col] = state.currentPlayer;

    const points = markCompletedBoxes(type, row, col, state.currentPlayer);
    state.scores[state.currentPlayer] += points;
    
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    
    updateUI();
    render();

    if (!isBoardComplete() && state.currentPlayer === 2) {
        setTimeout(makeSmartAiMove, 600);
    }
}

function markCompletedBoxes(type, row, col, player) {
    let count = 0;
    const check = (r, c) => {
        if (r < 0 || c < 0 || r >= GRID_SIZE - 1 || c >= GRID_SIZE - 1) return false;
        if (state.horizontal[r][c] && state.horizontal[r+1][c] && 
            state.vertical[r][c] && state.vertical[r][c+1] && state.boxes[r][c] === 0) {
            state.boxes[r][c] = player;
            return true;
        }
        return false;
    };
    if (type === "h") { if (check(row - 1, col)) count++; if (check(row, col)) count++; }
    else { if (check(row, col - 1)) count++; if (check(row, col)) count++; }
    return count;
}

function makeSmartAiMove() {
    const moves = getAllAvailableMoves();
    for (let move of moves) {
        if (wouldCompleteBox(move)) { applyMove(move); return; }
    }
    const safeMoves = moves.filter(m => !wouldCreateThirdSide(m));
    const finalMove = safeMoves.length > 0 
        ? safeMoves[Math.floor(Math.random() * safeMoves.length)] 
        : moves[Math.floor(Math.random() * moves.length)];
    applyMove(finalMove);
}

function getAllAvailableMoves() {
    let moves = [];
    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE - 1; c++)
            if (!state.horizontal[r][c]) moves.push({ type: "h", row: r, col: c });
    for (let r = 0; r < GRID_SIZE - 1; r++)
        for (let c = 0; c < GRID_SIZE; c++)
            if (!state.vertical[r][c]) moves.push({ type: "v", row: r, col: c });
    return moves;
}

function wouldCompleteBox(m) {
    let res = false;
    if (m.type === "h") {
        state.horizontal[m.row][m.col] = 2;
        if (isSquareClosed(m.row-1, m.col) || isSquareClosed(m.row, m.col)) res = true;
        state.horizontal[m.row][m.col] = 0;
    } else {
        state.vertical[m.row][m.col] = 2;
        if (isSquareClosed(m.row, m.col-1) || isSquareClosed(m.row, m.col)) res = true;
        state.vertical[m.row][m.col] = 0;
    }
    return res;
}

function isSquareClosed(r, c) {
    if (r < 0 || c < 0 || r >= GRID_SIZE - 1 || c >= GRID_SIZE - 1) return false;
    return state.horizontal[r][c] && state.horizontal[r+1][c] && state.vertical[r][c] && state.vertical[r][c+1];
}

function wouldCreateThirdSide(m) {
    const countSides = (r, c) => {
        if (r < 0 || c < 0 || r >= GRID_SIZE - 1 || c >= GRID_SIZE - 1) return 0;
        return (state.horizontal[r][c]?1:0) + (state.horizontal[r+1][c]?1:0) + (state.vertical[r][c]?1:0) + (state.vertical[r][c+1]?1:0);
    };
    let dangerous = false;
    if (m.type === "h") {
        state.horizontal[m.row][m.col] = 2;
        if (countSides(m.row-1, m.col) === 3 || countSides(m.row, m.col) === 3) dangerous = true;
        state.horizontal[m.row][m.col] = 0;
    } else {
        state.vertical[m.row][m.col] = 2;
        if (countSides(m.row, m.col-1) === 3 || countSides(m.row, m.col) === 3) dangerous = true;
        state.vertical[m.row][m.col] = 0;
    }
    return dangerous;
}

function drawHoverHighlight() {
    if (!state.hoverEdge || !state.pointer || state.currentPlayer !== 1) return;
    const edge = state.hoverEdge;
    const candidateCells = [];

    if (edge.type === "h") {
        if (edge.row > 0) candidateCells.push({ row: edge.row - 1, col: edge.col });
        if (edge.row < GRID_SIZE - 1) candidateCells.push({ row: edge.row, col: edge.col });
    } else {
        if (edge.col > 0) candidateCells.push({ row: edge.row, col: edge.col - 1 });
        if (edge.col < GRID_SIZE - 1) candidateCells.push({ row: edge.row, col: edge.col });
    }

    if (!candidateCells.length) return;

    let bestCell = candidateCells[0];
    if (candidateCells.length > 1) {
        let minD = Infinity;
        for (const cell of candidateCells) {
            const p1 = dotPosition(cell.row, cell.col), p2 = dotPosition(cell.row + 1, cell.col + 1);
            const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
            const d = Math.hypot(state.pointer.x - cx, state.pointer.y - cy);
            if (d < minD) { minD = d; bestCell = cell; }
        }
    }

    const p1 = dotPosition(bestCell.row, bestCell.col), p2 = dotPosition(bestCell.row, bestCell.col + 1),
          p3 = dotPosition(bestCell.row + 1, bestCell.col + 1), p4 = dotPosition(bestCell.row + 1, bestCell.col);

    ctx.fillStyle = COLORS.highlight;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
    ctx.closePath(); ctx.fill();
}

function drawBoardBackground() {
    const { centerX, centerY } = getBoardMetrics();
    const radius = Math.min(canvas.width, canvas.height) * 0.48;
    const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.15, centerX, centerY, radius);
    gradient.addColorStop(0, "rgba(74, 84, 255, 0.18)");
    gradient.addColorStop(1, "rgba(8, 10, 30, 0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBoardBackground();

    for (let r = 0; r < GRID_SIZE - 1; r++) {
        for (let c = 0; c < GRID_SIZE - 1; c++) {
            if (!state.boxes[r][c]) continue;
            ctx.fillStyle = state.boxes[r][c] === 1 ? COLORS.playerBox : COLORS.aiBox;
            const p1 = dotPosition(r, c), p2 = dotPosition(r, c + 1), p3 = dotPosition(r + 1, c + 1), p4 = dotPosition(r + 1, c);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.fill();
        }
    }

    drawHoverHighlight(); 

    ctx.lineCap = "round";
    const drawLine = (r1, c1, r2, c2, val, type, r, c) => {
        const p1 = dotPosition(r1, c1), p2 = dotPosition(r2, c2);
        const isHover = state.hoverEdge?.type === type && state.hoverEdge.row === r && state.hoverEdge.col === c;
        ctx.strokeStyle = val === 1 ? COLORS.edgeTakenPlayer : val === 2 ? COLORS.edgeTakenAi : isHover ? COLORS.edgeHover : COLORS.edgeEmpty;
        ctx.lineWidth = val || isHover ? EDGE_THICKNESS : EDGE_THICKNESS - 4;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    };

    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE - 1; c++) drawLine(r, c, r, c + 1, state.horizontal[r][c], 'h', r, c);
    for (let r = 0; r < GRID_SIZE - 1; r++)
        for (let c = 0; c < GRID_SIZE; c++) drawLine(r, c, r + 1, c, state.vertical[r][c], 'v', r, c);

    ctx.fillStyle = COLORS.dot;
    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++) {
            const p = dotPosition(r, c);
            ctx.beginPath(); ctx.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2); ctx.fill();
        }
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr, my = (e.clientY - rect.top) * dpr;
    state.pointer = { x: mx, y: my };
    state.hoverEdge = null;
    
    const moves = getAllAvailableMoves();
    let minD = Infinity;
    for (let m of moves) {
        const p1 = dotPosition(m.row, m.col), p2 = m.type === 'h' ? dotPosition(m.row, m.col+1) : dotPosition(m.row+1, m.col);
        const dx = p2.x - p1.x, dy = p2.y - p1.y, l2 = dx*dx + dy*dy;
        let t = Math.max(0, Math.min(1, ((mx - p1.x) * dx + (my - p1.y) * dy) / l2));
        const d = Math.hypot(mx - (p1.x + t * dx), my - (p1.y + t * dy));
        if (d < EDGE_HIT_RADIUS * dpr && d < minD) {
            minD = d;
            state.hoverEdge = m;
        }
    }
    render();
});

canvas.addEventListener("mouseleave", () => {
    state.hoverEdge = null;
    state.pointer = null;
    render();
});

canvas.addEventListener("click", () => {
    if (state.currentPlayer === 1 && state.hoverEdge) applyMove(state.hoverEdge);
});

function updateUI() {
    playerScoreText.textContent = state.scores[1];
    player2ScoreText.textContent = state.scores[2];
    if (isBoardComplete()) {
        const res = state.scores[1] > state.scores[2] ? "Victory!" : state.scores[1] < state.scores[2] ? "Bot Won!" : "Tie!";
        statusText.textContent = res + " Game Over.";
    } else {
        statusText.textContent = state.currentPlayer === 1 ? "Your Turn" : "Bot is thinking...";
    }
}

function isBoardComplete() { return getAllAvailableMoves().length === 0; }

restartBtn.addEventListener("click", () => { location.reload(); });
window.addEventListener("resize", render);

resizeCanvas();
render();
updateUI();
