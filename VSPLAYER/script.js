/* 
  Crystal Connect | RS PROJECT [ nightcoreat ]
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("gameStatus");
const restartBtn = document.getElementById("restartBtn");
const mainBtn = document.getElementById("mainBtn");
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
};

const state = {
  horizontal: Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE - 1).fill(0)),
  vertical: Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE).fill(0)),
  boxes: Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE - 1).fill(0)),
  currentPlayer: 1,
  scores: { 1: 0, 2: 0 },
  hoverEdge: null,
  pointer: null,
  status: "Click on a line to play",
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

function drawBoxes() {
  for (let row = 0; row < GRID_SIZE - 1; row += 1) {
    for (let col = 0; col < GRID_SIZE - 1; col += 1) {
      const owner = state.boxes[row][col];
      if (!owner) continue;
      const topLeft = dotPosition(row, col);
      const topRight = dotPosition(row, col + 1);
      const bottomRight = dotPosition(row + 1, col + 1);
      const bottomLeft = dotPosition(row + 1, col);
      ctx.fillStyle = owner === 1 ? COLORS.playerBox : COLORS.aiBox;
      ctx.beginPath();
      ctx.moveTo(topLeft.x, topLeft.y);
      ctx.lineTo(topRight.x, topRight.y);
      ctx.lineTo(bottomRight.x, bottomRight.y);
      ctx.lineTo(bottomLeft.x, bottomLeft.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawEdges() {
  ctx.lineCap = "round";
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE - 1; col += 1) {
      const from = dotPosition(row, col);
      const to = dotPosition(row, col + 1);
      const taken = state.horizontal[row][col];
      const hover = state.hoverEdge?.type === "h" && state.hoverEdge.row === row && state.hoverEdge.col === col;
      ctx.strokeStyle = taken === 1 ? COLORS.edgeTakenPlayer : taken === 2 ? COLORS.edgeTakenAi : hover ? COLORS.edgeHover : COLORS.edgeEmpty;
      ctx.lineWidth = taken ? EDGE_THICKNESS : hover ? EDGE_THICKNESS : EDGE_THICKNESS - 4;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  for (let row = 0; row < GRID_SIZE - 1; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const from = dotPosition(row, col);
      const to = dotPosition(row + 1, col);
      const taken = state.vertical[row][col];
      const hover = state.hoverEdge?.type === "v" && state.hoverEdge.row === row && state.hoverEdge.col === col;
      ctx.strokeStyle = taken === 1 ? COLORS.edgeTakenPlayer : taken === 2 ? COLORS.edgeTakenAi : hover ? COLORS.edgeHover : COLORS.edgeEmpty;
      ctx.lineWidth = taken ? EDGE_THICKNESS : hover ? EDGE_THICKNESS : EDGE_THICKNESS - 4;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }
}

function drawHoverHighlight() {
  if (!state.hoverEdge || !state.pointer) return;
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

  const pointer = state.pointer;
  let bestCell = candidateCells[0];
  let bestDist = Infinity;

  for (const cell of candidateCells) {
    const topLeft = dotPosition(cell.row, cell.col);
    const topRight = dotPosition(cell.row, cell.col + 1);
    const bottomRight = dotPosition(cell.row + 1, cell.col + 1);
    const bottomLeft = dotPosition(cell.row + 1, cell.col);
    const centerX = (topLeft.x + topRight.x + bottomRight.x + bottomLeft.x) / 4;
    const centerY = (topLeft.y + topRight.y + bottomRight.y + bottomLeft.y) / 4;
    const dist = Math.hypot(pointer.x - centerX, pointer.y - centerY);
    if (dist < bestDist) {
      bestDist = dist;
      bestCell = cell;
    }
  }

  const topLeft = dotPosition(bestCell.row, bestCell.col);
  const topRight = dotPosition(bestCell.row, bestCell.col + 1);
  const bottomRight = dotPosition(bestCell.row + 1, bestCell.col + 1);
  const bottomLeft = dotPosition(bestCell.row + 1, bestCell.col);

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(bottomRight.x, bottomRight.y);
  ctx.lineTo(bottomLeft.x, bottomLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDots() {
  ctx.fillStyle = COLORS.dot;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const { x, y } = dotPosition(row, col);
      ctx.beginPath();
      ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return { distance: Math.hypot(px - x1, py - y1), t: 0 };
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = x1 + clampedT * dx;
  const projY = y1 + clampedT * dy;
  return {
    distance: Math.hypot(px - projX, py - projY),
    t: clampedT,
  };
}

function getEdgeUnderPointer(mouseX, mouseY) {
  const candidates = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE - 1; col += 1) {
      if (state.horizontal[row][col]) continue;
      const a = dotPosition(row, col);
      const b = dotPosition(row, col + 1);
      const result = distanceToSegment(mouseX, mouseY, a.x, a.y, b.x, b.y);
      if (result.distance < EDGE_HIT_RADIUS * (window.devicePixelRatio || 1)) {
        candidates.push({ type: "h", row, col, distance: result.distance, t: result.t });
      }
    }
  }

  for (let row = 0; row < GRID_SIZE - 1; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (state.vertical[row][col]) continue;
      const a = dotPosition(row, col);
      const b = dotPosition(row + 1, col);
      const result = distanceToSegment(mouseX, mouseY, a.x, a.y, b.x, b.y);
      if (result.distance < EDGE_HIT_RADIUS * (window.devicePixelRatio || 1)) {
        candidates.push({ type: "v", row, col, distance: result.distance, t: result.t });
      }
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const scoreA = a.distance + Math.abs(0.5 - a.t) * 22;
    const scoreB = b.distance + Math.abs(0.5 - b.t) * 22;
    return scoreA - scoreB;
  });
  return candidates[0];
}

function markCompletedBoxes(type, row, col, player) {
  let completed = 0;
  const check = (topRow, leftCol) => {
    if (topRow < 0 || leftCol < 0 || topRow >= GRID_SIZE - 1 || leftCol >= GRID_SIZE - 1) return false;
    const top = state.horizontal[topRow][leftCol];
    const bottom = state.horizontal[topRow + 1][leftCol];
    const left = state.vertical[topRow][leftCol];
    const right = state.vertical[topRow][leftCol + 1];
    if (top && bottom && left && right && state.boxes[topRow][leftCol] === 0) {
      state.boxes[topRow][leftCol] = player;
      return true;
    }
    return false;
  };

  if (type === "h") {
    if (check(row - 1, col)) completed += 1;
    if (check(row, col)) completed += 1;
  } else {
    if (check(row, col - 1)) completed += 1;
    if (check(row, col)) completed += 1;
  }

  return completed;
}

function isBoardComplete() {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE - 1; col += 1) {
      if (!state.horizontal[row][col]) return false;
    }
  }
  for (let row = 0; row < GRID_SIZE - 1; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!state.vertical[row][col]) return false;
    }
  }
  return true;
}

function updateScoreboard() {
  playerScoreText.textContent = state.scores[1];
  player2ScoreText.textContent = state.scores[2];
}

function updateStatus() {
  if (isBoardComplete()) return;
  state.status = state.currentPlayer === 1 ? "Player 1's turn" : "Player 2's turn";
  statusText.textContent = state.status;
}

function applyMove(edge) {
  if (!edge) return false;
  const { type, row, col } = edge;
  if (type === "h") {
    if (state.horizontal[row][col]) return false;
    state.horizontal[row][col] = state.currentPlayer;
  } else {
    if (state.vertical[row][col]) return false;
    state.vertical[row][col] = state.currentPlayer;
  }

  const completed = markCompletedBoxes(type, row, col, state.currentPlayer);
  state.scores[state.currentPlayer] += completed;
  updateScoreboard();

  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  state.hoverEdge = null;
  updateStatus();

  if (isBoardComplete()) {
    const winnerText = state.scores[1] > state.scores[2] ? "Player 1 won" : state.scores[1] < state.scores[2] ? "Player 2 won" : "It's a tie";
    state.status = `${winnerText}! Game over`;
    statusText.textContent = state.status;
  }

  return true;
}

function resetGame() {
  state.horizontal = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE - 1).fill(false));
  state.vertical = Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE).fill(false));
  state.boxes = Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE - 1).fill(0));
  state.currentPlayer = 1;
  state.scores = { 1: 0, 2: 0 };
  state.hoverEdge = null;
  state.status = "Click on a line to play";
  updateScoreboard();
  statusText.textContent = state.status;
  render();
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
  drawBoxes();
  drawHoverHighlight();
  drawEdges();
  drawDots();
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (event.clientX - rect.left) * (window.devicePixelRatio || 1);
  const mouseY = (event.clientY - rect.top) * (window.devicePixelRatio || 1);
  state.pointer = { x: mouseX, y: mouseY };
  state.hoverEdge = getEdgeUnderPointer(mouseX, mouseY);
  render();
});

canvas.addEventListener("mouseleave", () => {
  state.hoverEdge = null;
  state.pointer = null;
  render();
});

canvas.addEventListener("click", (event) => {
  if (isBoardComplete()) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = (event.clientX - rect.left) * (window.devicePixelRatio || 1);
  const mouseY = (event.clientY - rect.top) * (window.devicePixelRatio || 1);
  const edge = getEdgeUnderPointer(mouseX, mouseY);
  if (edge) {
    const placed = applyMove(edge);
    render();
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

mainBtn.addEventListener("click", () => { location.reload(); });

window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

resetGame();
render();
