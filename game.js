// ═══════════════════════════════════════════════════════════
// DATA & CONSTANTS
// ═══════════════════════════════════════════════════════════

const EMOJI_OPTIONS = [
  "♜",
  "♝",
  "♞",
  "♟",
  "♙",
  "♛",
  "♚",
  "⚔",
  "🔱",
  "🌙",
  "🌟",
  "⭐",
  "🔥",
  "🌊",
  "🌀",
  "💎",
  "🗡",
  "🏹",
  "🪄",
  "🐉",
  "🦁",
  "🦅",
  "🐺",
  "🧙",
];

// moveGrid[row][col] relative to center (4,4)
// Cell types: 'move' | 'rider' | 'leap' | 'capture' | null
let currentMoveType = "move";
let moveGrid = Array(9)
  .fill(null)
  .map(() => Array(9).fill(null));

// Piece library — saved custom pieces
let pieceLibrary = [];

// Standard chess piece definitions (moves are looked up by type string)
const STANDARD_PIECES = {
  K: { name: "King", symbol: "♚", abbr: "K", value: 0, royal: true },
  Q: { name: "Queen", symbol: "♛", abbr: "Q", value: 9 },
  R: { name: "Rook", symbol: "♜", abbr: "R", value: 5 },
  B: { name: "Bishop", symbol: "♝", abbr: "B", value: 3 },
  N: { name: "Knight", symbol: "♞", abbr: "N", value: 3 },
  P: { name: "Pawn", symbol: "♟", abbr: "P", value: 1 },
};

// ═══════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════

function init() {
  buildEmojiPicker();
  buildMovementGrid();
  updatePreview();
  loadLibraryFromStorage();
  renderLibrary();
  buildBoardLabels();
  renderBlankBoard();

  document.getElementById("opt-firstmove").addEventListener("change", (e) => {
    document.getElementById("firstmove-extra").style.display = e.target.checked
      ? "block"
      : "none";
  });
  document
    .getElementById("piece-name")
    .addEventListener("input", updatePreview);
  document.getElementById("piece-emoji").addEventListener("input", (e) => {
    selectedEmoji = e.target.value || "♟";
    document
      .querySelectorAll(".emoji-opt")
      .forEach((el) => el.classList.remove("selected"));
    updatePreview();
  });
  document
    .getElementById("piece-desc")
    .addEventListener("input", updatePreview);
}

window.addEventListener("DOMContentLoaded", init);

// ═══════════════════════════════════════════════════════════
// EMOJI PICKER
// ═══════════════════════════════════════════════════════════

let selectedEmoji = EMOJI_OPTIONS[0];

function buildEmojiPicker() {
  const row = document.getElementById("emoji-picker");
  EMOJI_OPTIONS.forEach((em, i) => {
    const d = document.createElement("div");
    d.className = "emoji-opt" + (i === 0 ? " selected" : "");
    d.textContent = em;
    d.onclick = () => {
      document
        .querySelectorAll(".emoji-opt")
        .forEach((el) => el.classList.remove("selected"));
      d.classList.add("selected");
      selectedEmoji = em;
      document.getElementById("piece-emoji").value = em;
      updatePreview();
    };
    row.appendChild(d);
  });
  selectedEmoji = EMOJI_OPTIONS[0];
  document.getElementById("piece-emoji").value = selectedEmoji;
}

// ═══════════════════════════════════════════════════════════
// MOVEMENT GRID EDITOR
// ═══════════════════════════════════════════════════════════

function buildMovementGrid() {
  const grid = document.getElementById("movement-grid");
  grid.innerHTML = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "mgrid-cell";
      if (r === 4 && c === 4) {
        cell.classList.add("center");
        cell.textContent = "♟";
      } else {
        cell.onclick = () => toggleCell(r, c);
      }
      cell.dataset.r = r;
      cell.dataset.c = c;
      grid.appendChild(cell);
    }
  }
  syncGridDisplay();
  buildPreviewGrid();
}

function buildPreviewGrid() {
  const grid = document.getElementById("move-preview-grid");
  grid.innerHTML = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "mgrid-cell";
      if (r === 4 && c === 4) {
        cell.classList.add("center");
        cell.textContent = "♟";
      }
      cell.dataset.pr = r;
      cell.dataset.pc = c;
      grid.appendChild(cell);
    }
  }
  syncPreviewDisplay();
}

function toggleCell(r, c) {
  if (r === 4 && c === 4) return;
  const current = moveGrid[r][c];
  moveGrid[r][c] =
    currentMoveType === "clear" || current === currentMoveType
      ? null
      : currentMoveType;
  syncGridDisplay();
  syncPreviewDisplay();
  updatePreview();
}

function syncGridDisplay() {
  document.querySelectorAll("#movement-grid .mgrid-cell").forEach((cell) => {
    const r = parseInt(cell.dataset.r),
      c = parseInt(cell.dataset.c);
    if (r === 4 && c === 4) return;
    cell.className = "mgrid-cell";
    if (moveGrid[r][c]) cell.classList.add(moveGrid[r][c]);
  });
}

function syncPreviewDisplay() {
  document
    .querySelectorAll("#move-preview-grid .mgrid-cell")
    .forEach((cell) => {
      const r = parseInt(cell.dataset.pr),
        c = parseInt(cell.dataset.pc);
      if (r === 4 && c === 4) return;
      cell.className = "mgrid-cell";
      if (moveGrid[r][c]) cell.classList.add(moveGrid[r][c]);
    });
}

function setMoveType(type, btn) {
  currentMoveType = type;
  document
    .querySelectorAll(".move-type-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

// ═══════════════════════════════════════════════════════════
// PIECE CREATOR PREVIEW
// ═══════════════════════════════════════════════════════════

function updatePreview() {
  const name = document.getElementById("piece-name").value || "New Piece";
  const sym = document.getElementById("piece-emoji").value || "♟";
  const desc = document.getElementById("piece-desc").value || "";

  document.getElementById("preview-symbol").textContent = sym;
  document.getElementById("preview-name").textContent = name.toUpperCase();
  document.getElementById("preview-desc").textContent = desc;

  const tags = document.getElementById("preview-tags");
  tags.innerHTML = "";
  let hasMoves = false,
    hasRider = false,
    hasCapture = false;
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      if (moveGrid[r][c] === "move" || moveGrid[r][c] === "leap")
        hasMoves = true;
      if (moveGrid[r][c] === "rider") hasRider = true;
      if (moveGrid[r][c] === "capture") hasCapture = true;
    }
  if (hasMoves) tags.innerHTML += '<span class="tag move">Stepper</span>';
  if (hasRider) tags.innerHTML += '<span class="tag rider">Rider</span>';
  if (hasCapture)
    tags.innerHTML += '<span class="tag capture">Special Capture</span>';
  if (document.getElementById("opt-royal").checked)
    tags.innerHTML += '<span class="tag move">Royal</span>';
}

// ═══════════════════════════════════════════════════════════
// SAVE / LOAD / DELETE PIECES
// ═══════════════════════════════════════════════════════════

function savePiece() {
  const name = document.getElementById("piece-name").value.trim();
  if (!name) {
    showToast("Please enter a piece name");
    return;
  }

  const symbol = document.getElementById("piece-emoji").value || "♟";
  const abbr =
    document.getElementById("piece-abbr").value || name[0].toUpperCase();
  const desc = document.getElementById("piece-desc").value;
  const value = parseFloat(document.getElementById("piece-value").value) || 3;
  const royal = document.getElementById("opt-royal").checked;
  const hopper = document.getElementById("opt-hop").checked;
  const firstMove = document.getElementById("opt-firstmove").checked;
  const firstMoveExtra =
    parseInt(document.getElementById("firstmove-extra-val").value) || 1;
  const promotable = document.getElementById("opt-promotable").checked;
  const promotes = document.getElementById("opt-promotes").checked;
  const castlingRole =
    (document.getElementById("opt-castling-role") &&
      document.getElementById("opt-castling-role").value) ||
    "none";

  const grid = moveGrid.map((row) => row.map((v) => v));
  if (!grid.some((row) => row.some((v) => v !== null))) {
    showToast("Please define at least one move on the grid");
    return;
  }

  const piece = {
    id: Date.now(),
    name,
    symbol,
    abbr,
    desc,
    value,
    royal,
    hopper,
    firstMove,
    firstMoveExtra,
    promotable,
    promotes,
    castlingRole,
    grid,
  };
  pieceLibrary.push(piece);
  saveLibraryToStorage();
  renderLibrary();
  if (editorMode) buildPalette();
  showToast(`✦ "${name}" saved to library`);
}

function deletePiece(id) {
  pieceLibrary = pieceLibrary.filter((p) => p.id !== id);
  saveLibraryToStorage();
  renderLibrary();
  if (editorMode) buildPalette();
}

function saveLibraryToStorage() {
  try {
    localStorage.setItem("fairyChessLibrary", JSON.stringify(pieceLibrary));
  } catch (e) {}
}

function loadLibraryFromStorage() {
  try {
    const d = localStorage.getItem('fairyChessLibrary');
    if (d) {
      pieceLibrary = JSON.parse(d);
    } else {
      // No saved library — populate with standard-piece templates as defaults
      const keys = ['K','Q','R','B','N','P'];
      pieceLibrary = keys.map((k,i) => {
        const t = TEMPLATES[k];
        return {
          id: -(i+1),
          name: t.name,
          symbol: t.symbol,
          abbr: t.abbr || (t.name ? t.name[0].toUpperCase() : ''),
          desc: t.desc || '',
          value: t.value || 0,
          royal: t.royal || false,
          hopper: t.hopper || false,
          firstMove: t.firstMove || (t.isPawn ? true : false),
          firstMoveExtra: t.firstMoveExtra || 1,
          promotable: (t.promotable !== undefined) ? t.promotable : (t.promotes ? true : false),
          promotes: t.promotes || false,
          castlingRole: t.castlingRole || 'none',
          grid: t.grid.map(row => [...row]),
        };
      });
      saveLibraryToStorage();
    }
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════
// LIBRARY RENDERING
// ═══════════════════════════════════════════════════════════

function renderLibrary() {
  const grid = document.getElementById("library-grid");
  document.getElementById("library-count").textContent = pieceLibrary.length;

  if (!pieceLibrary.length) {
    grid.innerHTML =
      '<div style="color:var(--cream-dim);font-style:italic;padding:2rem;text-align:center;grid-column:1/-1;">No pieces yet. Visit the Piece Forge to create your first custom piece.</div>';
    return;
  }

  grid.innerHTML = "";
  pieceLibrary.forEach((piece) => {
    const card = document.createElement("div");
    card.style.cssText =
      "background:var(--dark3);border:1px solid var(--dark4);border-top:2px solid var(--gold-dim);padding:1rem;";
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.8rem;">
        <div style="font-size:2.2rem;">${piece.symbol}</div>
        <div>
          <div style="font-family:'Cinzel',serif;color:var(--gold);font-size:0.85rem;letter-spacing:0.08em;">${piece.name.toUpperCase()}</div>
          <div style="font-size:0.78rem;color:var(--cream-dim);">Value: ${piece.value} pawns${piece.royal ? " · Royal" : ""}</div>
        </div>
      </div>
      ${piece.desc ? `<div style="font-size:0.82rem;color:var(--cream-dim);font-style:italic;margin-bottom:0.8rem;">${piece.desc}</div>` : ""}
      <div style="display:flex;justify-content:center;margin-bottom:0.8rem;">
        <div class="mgrid" style="max-width:150px;pointer-events:none;" id="lib-grid-${piece.id}"></div>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn-secondary" style="flex:1;font-size:0.65rem;" onclick="loadPieceToEditor(${piece.id})">Edit</button>
        <button class="btn-danger" onclick="deletePiece(${piece.id})">Delete</button>
      </div>`;
    grid.appendChild(card);
    buildMiniGrid(`lib-grid-${piece.id}`, piece.grid);
  });
}

function buildMiniGrid(id, grid) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = "";
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "mgrid-cell";
      if (r === 4 && c === 4) {
        cell.classList.add("center");
        cell.textContent = "♟";
      } else if (grid[r] && grid[r][c]) cell.classList.add(grid[r][c]);
      el.appendChild(cell);
    }
}

function loadPieceToEditor(id) {
  const piece = pieceLibrary.find((p) => p.id === id);
  if (!piece) return;
  document.getElementById("piece-name").value = piece.name;
  document.getElementById("piece-emoji").value = piece.symbol;
  selectedEmoji = piece.symbol;
  document.getElementById("piece-abbr").value = piece.abbr;
  document.getElementById("piece-desc").value = piece.desc || "";
  document.getElementById("piece-value").value = piece.value;
  document.getElementById("opt-royal").checked = piece.royal || false;
  document.getElementById("opt-hop").checked = piece.hopper || false;
  document.getElementById("opt-firstmove").checked = piece.firstMove || false;
  document.getElementById("firstmove-extra").style.display = piece.firstMove
    ? "block"
    : "none";
  document.getElementById("firstmove-extra-val").value =
    piece.firstMoveExtra || 1;
  document.getElementById("opt-promotable").checked =
    piece.promotable !== false;
  document.getElementById("opt-promotes").checked = piece.promotes || false;
  if (document.getElementById("opt-castling-role"))
    document.getElementById("opt-castling-role").value =
      piece.castlingRole || "none";
  moveGrid = piece.grid.map((row) => [...row]);
  syncGridDisplay();
  syncPreviewDisplay();
  updatePreview();
  switchTab("creator");
  showToast(`Loaded "${piece.name}" for editing`);
}

function clearEditor() {
  document.getElementById("piece-name").value = "";
  document.getElementById("piece-emoji").value = EMOJI_OPTIONS[0];
  selectedEmoji = EMOJI_OPTIONS[0];
  document.getElementById("piece-abbr").value = "";
  document.getElementById("piece-desc").value = "";
  document.getElementById("piece-value").value = 3;
  document.getElementById("opt-royal").checked = false;
  document.getElementById("opt-hop").checked = false;
  document.getElementById("opt-firstmove").checked = false;
  document.getElementById("firstmove-extra").style.display = "none";
  document.getElementById("opt-promotable").checked = true;
  document.getElementById("opt-promotes").checked = false;
  if (document.getElementById("opt-castling-role"))
    document.getElementById("opt-castling-role").value = "none";
  moveGrid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));
  syncGridDisplay();
  syncPreviewDisplay();
  updatePreview();
}

// ═══════════════════════════════════════════════════════════
// PIECE TEMPLATES
// ═══════════════════════════════════════════════════════════

const TEMPLATES = {
  /* Standard chess pieces as templates so editor & game use them */
  K: {
    name: "King",
    symbol: "♚",
    abbr: "K",
    desc: "Standard King — one-step in any direction; can castle.",
    value: 0,
    royal: true,
    castlingRole: "king",
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          g[4 + dr][4 + dc] = "move";
        }
      return g;
    })(),
  },
  Q: {
    name: "Queen",
    symbol: "♛",
    abbr: "Q",
    desc: "Queen — slides along ranks, files and diagonals.",
    value: 9,
    castlingRole: "none",
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      // unit-direction riders only
      g[4][5] = "rider";
      g[4][3] = "rider";
      g[5][4] = "rider";
      g[3][4] = "rider";
      g[5][5] = "rider";
      g[5][3] = "rider";
      g[3][5] = "rider";
      g[3][3] = "rider";
      return g;
    })(),
  },
  R: {
    name: "Rook",
    symbol: "♜",
    abbr: "R",
    desc: "Rook — slides along files and ranks; used for castling.",
    value: 5,
    castlingRole: "rook",
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      // unit-direction riders only
      g[4][5] = "rider";
      g[4][3] = "rider";
      g[5][4] = "rider";
      g[3][4] = "rider";
      return g;
    })(),
  },
  B: {
    name: "Bishop",
    symbol: "♝",
    abbr: "B",
    desc: "Bishop — slides along diagonals.",
    value: 3,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      // unit-direction riders only
      g[5][5] = "rider";
      g[5][3] = "rider";
      g[3][5] = "rider";
      g[3][3] = "rider";
      return g;
    })(),
  },
  N: {
    name: "Knight",
    symbol: "♞",
    abbr: "N",
    desc: "Knight — standard (2,1) leaps.",
    value: 3,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ].forEach(([dr, dc]) => {
        const r = 4 + dr,
          c = 4 + dc;
        if (r >= 0 && r < 9 && c >= 0 && c < 9) g[r][c] = "leap";
      });
      return g;
    })(),
  },
  P: {
    name: "Pawn",
    symbol: "♟",
    abbr: "P",
    desc: "Pawn — forward step, diagonal capture; first double-step and promotion enabled.",
    value: 1,
    isPawn: true,
    promotes: true,
    promotable: false,
    firstMove: true,
    firstMoveExtra: 1,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      // forward one (relative - up direction will be handled in pawnMoves using color)
      g[3][4] = "move"; // one forward (dr = -1)
      g[3][3] = "capture";
      g[3][5] = "capture"; // diagonal captures
      return g;
    })(),
  },
  chancellor: {
    name: "Chancellor",
    symbol: "🔱",
    abbr: "C",
    desc: "Combines Rook and Knight.",
    value: 8.5,
    royal: false,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      for (let i = 0; i < 9; i++) {
        if (i !== 4) {
          g[4][i] = "rider";
          g[i][4] = "rider";
        }
      }
      [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ].forEach(([dr, dc]) => {
        const r = 4 + dr,
          c = 4 + dc;
        if (r >= 0 && r < 9 && c >= 0 && c < 9) g[r][c] = "leap";
      });
      return g;
    })(),
  },
  archbishop: {
    name: "Archbishop",
    symbol: "⭐",
    abbr: "A",
    desc: "Combines Bishop and Knight.",
    value: 7.5,
    royal: false,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      for (let i = 1; i <= 4; i++) {
        g[4 - i][4 - i] = "rider";
        g[4 - i][4 + i] = "rider";
        g[4 + i][4 - i] = "rider";
        g[4 + i][4 + i] = "rider";
      }
      [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ].forEach(([dr, dc]) => {
        const r = 4 + dr,
          c = 4 + dc;
        if (r >= 0 && r < 9 && c >= 0 && c < 9) g[r][c] = "leap";
      });
      return g;
    })(),
  },
  nightrider: {
    name: "Nightrider",
    symbol: "🌙",
    abbr: "NR",
    desc: "Rides along knight-move trajectories.",
    value: 5,
    royal: false,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      [
        [1, 2],
        [2, 1],
        [2, -1],
        [1, -2],
        [-1, -2],
        [-2, -1],
        [-2, 1],
        [-1, 2],
      ].forEach(([dr, dc]) => {
        let r = 4 + dr,
          c = 4 + dc;
        for (let s = 0; s < 2 && r >= 0 && r < 9 && c >= 0 && c < 9; s++) {
          g[r][c] = "rider";
          r += dr;
          c += dc;
        }
      });
      return g;
    })(),
  },
  amazon: {
    name: "Amazon",
    symbol: "🗡",
    abbr: "AM",
    desc: "Combines Queen and Knight. Most powerful piece!",
    value: 12,
    royal: false,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      for (let i = 0; i < 9; i++) {
        if (i !== 4) {
          g[4][i] = "rider";
          g[i][4] = "rider";
        }
      }
      for (let i = 1; i <= 4; i++) {
        g[4 - i][4 - i] = "rider";
        g[4 - i][4 + i] = "rider";
        g[4 + i][4 - i] = "rider";
        g[4 + i][4 + i] = "rider";
      }
      [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ].forEach(([dr, dc]) => {
        const r = 4 + dr,
          c = 4 + dc;
        if (r >= 0 && r < 9 && c >= 0 && c < 9) g[r][c] = "leap";
      });
      return g;
    })(),
  },
  camel: {
    name: "Camel",
    symbol: "🌟",
    abbr: "CA",
    desc: "Leaps in a (3,1) pattern. A colorbound leaper.",
    value: 3,
    royal: false,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      [
        [3, 1],
        [3, -1],
        [-3, 1],
        [-3, -1],
        [1, 3],
        [1, -3],
        [-1, 3],
        [-1, -3],
      ].forEach(([dr, dc]) => {
        const r = 4 + dr,
          c = 4 + dc;
        if (r >= 0 && r < 9 && c >= 0 && c < 9) g[r][c] = "leap";
      });
      return g;
    })(),
  },
  grasshopper: {
    name: "Grasshopper",
    symbol: "🌊",
    abbr: "G",
    desc: "Jumps over exactly one piece along ranks, files, or diagonals.",
    value: 3.5,
    royal: false,
    hopper: true,
    grid: (() => {
      const g = Array(9)
        .fill(null)
        .map(() => Array(9).fill(null));
      for (let i = 0; i < 9; i++) {
        if (i !== 4) {
          g[4][i] = "capture";
          g[i][4] = "capture";
        }
      }
      for (let i = 1; i <= 4; i++) {
        g[4 - i][4 - i] = "capture";
        g[4 - i][4 + i] = "capture";
        g[4 + i][4 - i] = "capture";
        g[4 + i][4 + i] = "capture";
      }
      return g;
    })(),
  },
};

function loadTemplate(key) {
  const t = TEMPLATES[key];
  if (!t) return;
  document.getElementById("piece-name").value = t.name;
  document.getElementById("piece-emoji").value = t.symbol;
  selectedEmoji = t.symbol;
  document.getElementById("piece-abbr").value = t.abbr;
  document.getElementById("piece-desc").value = t.desc;
  document.getElementById("piece-value").value = t.value;
  document.getElementById("opt-royal").checked = t.royal || false;
  document.getElementById("opt-hop").checked = t.hopper || false;
  moveGrid = t.grid.map((row) => [...row]);
  syncGridDisplay();
  syncPreviewDisplay();
  updatePreview();
  showToast(`Loaded template: ${t.name}`);
}

// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════

let board = [];
let currentTurn = "white";
let gameActive = false;
let selectedSq = null;
let validMoves = [];
let moveHistory = [];
let capturedByWhite = [];
let capturedByBlack = [];
let undoStack = [];
let activeGamePieces = {}; // type key → piece definition
let enPassantSq = null;
let castlingRights = {
  white: { kingSide: true, queenSide: true },
  black: { kingSide: true, queenSide: true },
};
let checkSq = null;

// ═══════════════════════════════════════════════════════════
// BOARD LABELS
// ═══════════════════════════════════════════════════════════

function buildBoardLabels() {
  const rl = document.getElementById("rank-labels");
  rl.innerHTML = "";
  for (let r = 7; r >= 0; r--) {
    const d = document.createElement("div");
    d.className = "axis-label";
    d.textContent = r + 1;
    rl.appendChild(d);
  }
  const fl = document.getElementById("file-labels");
  fl.innerHTML = "";
  "abcdefgh".split("").forEach((f) => {
    const d = document.createElement("div");
    d.className = "axis-label";
    d.textContent = f;
    fl.appendChild(d);
  });
}

// ═══════════════════════════════════════════════════════════
// BOARD EDITOR (Setup Mode)
// ═══════════════════════════════════════════════════════════

let editorBoard = null;
let editorMode = false;
let selectedPaletteType = null; // null = eraser
let placingColor = "white";

function buildPalette() {
  const stdEl = document.getElementById("palette-standard");
  const custEl = document.getElementById("palette-custom");
  const custWrap = document.getElementById("palette-custom-wrap");

  const STD = [
    { type: "K", def: STANDARD_PIECES.K },
    { type: "Q", def: STANDARD_PIECES.Q },
    { type: "R", def: STANDARD_PIECES.R },
    { type: "B", def: STANDARD_PIECES.B },
    { type: "N", def: STANDARD_PIECES.N },
    { type: "P", def: STANDARD_PIECES.P },
  ];

  stdEl.innerHTML = "";
  STD.forEach(({ type, def }) =>
    stdEl.appendChild(makePaletteBtn(type, def, false)),
  );

  // Eraser button
  const eraser = document.createElement("div");
  eraser.className =
    "palette-piece eraser" + (selectedPaletteType === null ? " selected" : "");
  eraser.title = "Eraser — click squares to remove pieces";
  eraser.textContent = "✕";
  eraser.onclick = () => selectPalette(null);
  stdEl.appendChild(eraser);

  // Custom pieces
  custEl.innerHTML = "";
  if (pieceLibrary.length > 0) {
    custWrap.style.display = "block";
    pieceLibrary.forEach((p) =>
      custEl.appendChild(makePaletteBtn("fairy_" + p.id, p, true)),
    );
  } else {
    custWrap.style.display = "none";
  }
}

function makePaletteBtn(type, def, isCustom) {
  const btn = document.createElement("div");
  btn.className =
    "palette-piece" + (selectedPaletteType === type ? " selected" : "");
  btn.title = def.name + (isCustom ? " (custom)" : "");

  const sym = document.createElement("span");
  sym.textContent = def.symbol;

  const lbl = document.createElement("span");
  lbl.className = "palette-label";
  lbl.textContent = def.abbr || "";

  btn.appendChild(sym);
  btn.appendChild(lbl);
  btn.onclick = () => selectPalette(type);
  return btn;
}

function selectPalette(type) {
  selectedPaletteType = type;
  buildPalette(); // rebuilds with correct .selected state
}

function setPlacingColor(color) {
  placingColor = color;
  document.getElementById("color-white-btn").className =
    color === "white" ? "btn-primary" : "btn-secondary";
  document.getElementById("color-black-btn").className =
    color === "black" ? "btn-primary" : "btn-secondary";
  // Preserve inline flex + font-size set by HTML
  ["color-white-btn", "color-black-btn"].forEach((id) => {
    const el = document.getElementById(id);
    el.style.flex = "1";
    el.style.fontSize = "0.7rem";
  });
}

function resetEditorToStandard() {
  editorBoard = createStandardBoard();
  renderEditorBoard();
}

function clearEditorBoard() {
  editorBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  renderEditorBoard();
}

function createStandardBoard() {
  const b = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  const backRow = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: backRow[c], color: "white" };
    b[7][c] = { type: backRow[c], color: "black" };
    b[1][c] = { type: "P", color: "white" };
    b[6][c] = { type: "P", color: "black" };
  }
  return b;
}

function renderEditorBoard() {
  const el = document.getElementById("chess-board");
  el.innerHTML = "";
  for (let r = 7; r >= 0; r--) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement("div");
      const isLight = (r + c) % 2 === 0;
      sq.className = "sq editor-hover " + (isLight ? "light" : "dark");

      const piece = editorBoard[r][c];
      if (piece) {
        const pd = document.createElement("div");
        pd.className = "piece-on-board";
        const def = activeGamePieces[piece.type] || STANDARD_PIECES[piece.type];
        pd.textContent = def ? def.symbol : "?";
        if (piece.color === "black")
          pd.style.filter =
            "drop-shadow(0 0 2px rgba(0,0,0,1)) brightness(0.35) contrast(2)";
        sq.appendChild(pd);
      }

      sq.onclick = () => handleEditorClick(r, c);
      sq.oncontextmenu = (e) => {
        e.preventDefault();
        editorBoard[r][c] = null;
        renderEditorBoard();
      };
      el.appendChild(sq);
    }
  }
}

function handleEditorClick(r, c) {
  if (selectedPaletteType === null) {
    editorBoard[r][c] = null;
  } else {
    const existing = editorBoard[r][c];
    if (
      existing &&
      existing.type === selectedPaletteType &&
      existing.color === placingColor
    ) {
      editorBoard[r][c] = null; // toggle off
    } else {
      editorBoard[r][c] = { type: selectedPaletteType, color: placingColor };
    }
  }
  renderEditorBoard();
}

function handleVariantChange() {
  const v = document.getElementById("variant-select").value;
  const editorPanel = document.getElementById("board-editor-panel");

  if (v === "custom") {
    editorPanel.style.display = "block";
    editorMode = true;
    activeGamePieces = { ...STANDARD_PIECES };
    // prefer templates (including standard-piece templates) when available
    Object.keys(TEMPLATES).forEach((k) => {
      activeGamePieces[k] = TEMPLATES[k];
    });
    pieceLibrary.forEach((p) => {
      activeGamePieces["fairy_" + p.id] = p;
    });
    editorBoard = createStandardBoard();
    buildPalette();
    renderEditorBoard();
    updateStatus("Place pieces on the board, then press Start Game");
  } else {
    editorPanel.style.display = "none";
    editorMode = false;
    renderBlankBoard();
  }
}

function renderBlankBoard() {
  const el = document.getElementById("chess-board");
  el.innerHTML = "";
  for (let r = 7; r >= 0; r--) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement("div");
      sq.className = "sq " + ((r + c) % 2 === 0 ? "light" : "dark");
      el.appendChild(sq);
    }
  }
}

function returnToSetup() {
  gameActive = false;
  selectedSq = null;
  validMoves = [];
  document.getElementById("setup-mode").style.display = "block";
  document.getElementById("game-mode").style.display = "none";
  document.getElementById("game-controls").classList.remove("visible");
  const v = document.getElementById("variant-select").value;
  if (v === "custom") renderEditorBoard();
  else renderBlankBoard();
  updateStatus("Configure a game and press Start");
}

// ═══════════════════════════════════════════════════════════
// GAME START
// ═══════════════════════════════════════════════════════════

function startGame() {
  const variant = document.getElementById("variant-select").value;
  activeGamePieces = { ...STANDARD_PIECES };
  // prefer templates (so standard pieces come from templates where provided)
  Object.keys(TEMPLATES).forEach((k) => {
    activeGamePieces[k] = TEMPLATES[k];
  });
  pieceLibrary.forEach((p) => {
    activeGamePieces["fairy_" + p.id] = p;
  });

  let b;
  if (variant === "custom") {
    b = editorBoard.map((row) => row.map((sq) => (sq ? { ...sq } : null)));
    let wRoyal = false,
      bRoyal = false;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (!p) continue;
        const def = activeGamePieces[p.type];
        const isRoyal = p.type === "K" || (def && def.royal);
        if (isRoyal && p.color === "white") wRoyal = true;
        if (isRoyal && p.color === "black") bRoyal = true;
      }
    if (!wRoyal || !bRoyal) {
      showToast("Both sides need at least one King or Royal piece!");
      return;
    }
  } else if (variant === "random") {
    b = createRandomBoard();
  } else {
    b = createStandardBoard();
  }

  board = b;
  currentTurn = "white";
  gameActive = true;
  editorMode = false;
  selectedSq = null;
  validMoves = [];
  moveHistory = [];
  capturedByWhite = [];
  capturedByBlack = [];
  undoStack = [];
  enPassantSq = null;
  castlingRights = {
    white: { kingSide: true, queenSide: true },
    black: { kingSide: true, queenSide: true },
  };
  checkSq = null;

  document.getElementById("setup-mode").style.display = "none";
  document.getElementById("game-mode").style.display = "block";
  document.getElementById("game-controls").classList.add("visible");

  updateStatus("White's turn to move");
  renderBoard();
  renderMoveHistory();
  renderCaptured();
  updatePieceLegend();
  switchTab("game");
}

function createRandomBoard() {
  const b = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  const fairyIds = pieceLibrary.map((p) => "fairy_" + p.id);
  const pool = ["Q", "R", "R", "B", "B", "N", "N", ...fairyIds];
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 7);
  const finalRow = [...shuffled.slice(0, 4), "K", ...shuffled.slice(4, 7)];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: finalRow[c] || "R", color: "white" };
    b[7][c] = { type: finalRow[c] || "R", color: "black" };
    b[1][c] = { type: "P", color: "white" };
    b[6][c] = { type: "P", color: "black" };
  }
  return b;
}

// ═══════════════════════════════════════════════════════════
// MOVE GENERATION
// ═══════════════════════════════════════════════════════════

function kingMoves(row, col, color, b) {
  const moves = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = row + dr,
        c = col + dc;
      if (inBounds(r, c) && (!b[r][c] || b[r][c].color !== color))
        moves.push({ r, c });
    }
  // Castling
  const cr = castlingRights[color];
  const backRank = color === "white" ? 0 : 7;
  if (row === backRank && col === 4) {
    if (
      cr.kingSide &&
      !b[backRank][5] &&
      !b[backRank][6] &&
      b[backRank][7]?.type === "R"
    )
      moves.push({ r: backRank, c: 6, castle: "king" });
    if (
      cr.queenSide &&
      !b[backRank][3] &&
      !b[backRank][2] &&
      !b[backRank][1] &&
      b[backRank][0]?.type === "R"
    )
      moves.push({ r: backRank, c: 2, castle: "queen" });
  }
  return moves;
}

function rookMoves(row, col, color, b) {
  return slideMoves(row, col, color, b, [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]);
}
function bishopMoves(row, col, color, b) {
  return slideMoves(row, col, color, b, [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]);
}
function queenMoves(row, col, color, b) {
  return slideMoves(row, col, color, b, [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]);
}
function knightMoves(row, col, color, b) {
  const moves = [];
  [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ].forEach(([dr, dc]) => {
    const r = row + dr,
      c = col + dc;
    if (inBounds(r, c) && (!b[r][c] || b[r][c].color !== color))
      moves.push({ r, c });
  });
  return moves;
}
function pawnMoves(row, col, color, b) {
  const moves = [];
  const dir = color === "white" ? 1 : -1;
  const startRow = color === "white" ? 1 : 6;
  const r1 = row + dir;

  if (inBounds(r1, col) && !b[r1][col]) {
    moves.push({ r: r1, c: col });
    if (row === startRow && !b[row + 2 * dir][col])
      moves.push({ r: row + 2 * dir, c: col, pawnDouble: true });
  }
  [
    [r1, col - 1],
    [r1, col + 1],
  ].forEach(([r, c]) => {
    if (
      inBounds(r, c) &&
      ((b[r][c] && b[r][c].color !== color) ||
        (enPassantSq && enPassantSq.r === r && enPassantSq.c === c))
    )
      moves.push({ r, c, enPassant: !b[r][c] });
  });
  return moves;
}

function slideMoves(row, col, color, b, dirs) {
  const moves = [];
  dirs.forEach(([dr, dc]) => {
    let r = row + dr,
      c = col + dc;
    while (inBounds(r, c)) {
      if (b[r][c]) {
        if (b[r][c].color !== color) moves.push({ r, c });
        break;
      }
      moves.push({ r, c });
      r += dr;
      c += dc;
    }
  });
  return moves;
}

function fairyPieceMoves(row, col, color, b, piece) {
  const moves = [];
  const grid = piece.grid;
  for (let gr = 0; gr < 9; gr++)
    for (let gc = 0; gc < 9; gc++) {
      if (!grid[gr][gc]) continue;
      const dr = gr - 4;
      const dc = gc - 4;
      const type = grid[gr][gc];

      if (type === "move" || type === "leap") {
        const r = row + dr,
          c = col + dc;
        if (inBounds(r, c) && (!b[r][c] || b[r][c].color !== color))
          moves.push({ r, c });
      } else if (type === "rider") {
        let r = row + dr,
          c = col + dc;
        while (inBounds(r, c)) {
          if (b[r][c]) {
            if (b[r][c].color !== color) moves.push({ r, c });
            break;
          }
          moves.push({ r, c });
          r += dr;
          c += dc;
        }
      } else if (type === "capture") {
        const r = row + dr,
          c = col + dc;
        if (inBounds(r, c) && b[r][c] && b[r][c].color !== color)
          moves.push({ r, c });
      }
    }
  return moves;
}

function getMovesForPiece(row, col, skipLegalCheck = false) {
  const piece = board[row][col];
  if (!piece) return [];
  const def = activeGamePieces[piece.type];
  let rawMoves = [];

  // Pawn-role pieces keep pawn semantics (double-step, en-passant, promotion)
  if (def && def.isPawn) {
    rawMoves = pawnMoves(row, col, piece.color, board);
  } else {
    // Use the generic fairy grid for move generation when available
    if (def && def.grid)
      rawMoves = fairyPieceMoves(row, col, piece.color, board, def);
    else {
      // Fallback to legacy handlers for safety
      switch (piece.type) {
        case "P":
          rawMoves = pawnMoves(row, col, piece.color, board);
          break;
        case "K":
          rawMoves = kingMoves(row, col, piece.color, board);
          break;
        case "Q":
          rawMoves = queenMoves(row, col, piece.color, board);
          break;
        case "R":
          rawMoves = rookMoves(row, col, piece.color, board);
          break;
        case "B":
          rawMoves = bishopMoves(row, col, piece.color, board);
          break;
        case "N":
          rawMoves = knightMoves(row, col, piece.color, board);
          break;
      }
    }

    // Add castling moves for any piece declared as king-role in its template
    if (def && def.castlingRole === "king") {
      // similar logic to previous kingMoves castling but based on role
      const backRank = piece.color === "white" ? 0 : 7;
      if (row === backRank && col === 4) {
        const cr = castlingRights[piece.color];
        if (
          cr.kingSide &&
          !board[backRank][5] &&
          !board[backRank][6] &&
          board[backRank][7]?.type &&
          activeGamePieces[board[backRank][7].type]?.castlingRole === "rook"
        )
          rawMoves.push({ r: backRank, c: 6, castle: "king" });
        if (
          cr.queenSide &&
          !board[backRank][3] &&
          !board[backRank][2] &&
          !board[backRank][1] &&
          board[backRank][0]?.type &&
          activeGamePieces[board[backRank][0].type]?.castlingRole === "rook"
        )
          rawMoves.push({ r: backRank, c: 2, castle: "queen" });
      }
    }
  }

  if (skipLegalCheck) return rawMoves;

  // Filter moves that leave own king in check
  return rawMoves.filter((mv) => {
    const saved = simulateMove(row, col, mv.r, mv.c, mv);
    const inChk = isInCheck(piece.color);
    undoSimulate(saved);
    return !inChk;
  });
}

function simulateMove(fr, fc, tr, tc, mv) {
  const saved = {
    from: board[fr][fc],
    to: board[tr][tc],
    fr,
    fc,
    tr,
    tc,
    enPassant: enPassantSq,
    cr: JSON.parse(JSON.stringify(castlingRights)),
    epPiece: null,
    epR: null,
    epC: null,
  };
  board[tr][tc] = board[fr][fc];
  board[fr][fc] = null;

  if (mv?.enPassant) {
    const dir = board[tr][tc].color === "white" ? -1 : 1;
    saved.epR = tr + dir;
    saved.epC = tc;
    saved.epPiece = board[tr + dir][tc];
    board[tr + dir][tc] = null;
  }
  if (mv?.castle) {
    const br = board[tr][tc].color === "white" ? 0 : 7;
    if (mv.castle === "king") {
      saved.rookFrom = board[br][7];
      board[br][5] = saved.rookFrom;
      board[br][7] = null;
    } else {
      saved.rookFrom = board[br][0];
      board[br][3] = saved.rookFrom;
      board[br][0] = null;
    }
    saved.castleKind = mv.castle;
    saved.backRank = br;
  }
  return saved;
}

function undoSimulate(saved) {
  board[saved.fr][saved.fc] = saved.from;
  board[saved.tr][saved.tc] = saved.to;
  enPassantSq = saved.enPassant;
  castlingRights = saved.cr;
  if (saved.epR !== null) board[saved.epR][saved.epC] = saved.epPiece;
  if (saved.castleKind) {
    const br = saved.backRank;
    if (saved.castleKind === "king") {
      board[br][7] = saved.rookFrom;
      board[br][5] = null;
    } else {
      board[br][0] = saved.rookFrom;
      board[br][3] = null;
    }
  }
}

function isInCheck(color) {
  // Locate royal piece
  let kingPos = null;
  outer: for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      const def = activeGamePieces[p.type];
      if (p.type === "K" || (def && def.royal)) {
        kingPos = { r, c };
        break outer;
      }
    }
  if (!kingPos) return false;

  const opp = color === "white" ? "black" : "white";
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== opp) continue;
      if (
        getMovesForPiece(r, c, true).some(
          (m) => m.r === kingPos.r && m.c === kingPos.c,
        )
      )
        return true;
    }
  return false;
}

function hasAnyLegalMove(color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === color && getMovesForPiece(r, c).length > 0)
        return true;
    }
  return false;
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// ═══════════════════════════════════════════════════════════
// BOARD RENDERING (Play Mode)
// ═══════════════════════════════════════════════════════════

function renderBoard() {
  const el = document.getElementById("chess-board");
  el.innerHTML = "";
  for (let r = 7; r >= 0; r--) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement("div");
      const isLight = (r + c) % 2 === 0;
      sq.className = "sq " + (isLight ? "light" : "dark");
      sq.dataset.r = r;
      sq.dataset.c = c;

      if (selectedSq && selectedSq.r === r && selectedSq.c === c)
        sq.classList.add("selected");
      if (validMoves.some((m) => m.r === r && m.c === c)) {
        sq.classList.add(board[r][c] ? "capturable" : "moveable");
      }
      if (checkSq && checkSq.r === r && checkSq.c === c)
        sq.classList.add("check-sq");

      const piece = board[r][c];
      if (piece) {
        const pd = document.createElement("div");
        pd.className = "piece-on-board";
        const def = activeGamePieces[piece.type];
        pd.textContent = def ? def.symbol : "?";
        if (piece.color === "black")
          pd.style.filter =
            "drop-shadow(0 0 2px rgba(0,0,0,1)) brightness(0.35) contrast(2)";
        sq.appendChild(pd);
      }

      sq.onclick = () => handleSquareClick(r, c);
      el.appendChild(sq);
    }
  }
}

function handleSquareClick(r, c) {
  if (!gameActive) return;
  const piece = board[r][c];

  if (selectedSq) {
    const mv = validMoves.find((m) => m.r === r && m.c === c);
    if (mv) {
      executeMove(selectedSq.r, selectedSq.c, r, c, mv);
      return;
    }
  }

  if (piece && piece.color === currentTurn) {
    selectedSq = { r, c };
    validMoves = getMovesForPiece(r, c);
  } else {
    selectedSq = null;
    validMoves = [];
  }
  renderBoard();
}

// ═══════════════════════════════════════════════════════════
// EXECUTE MOVE
// ═══════════════════════════════════════════════════════════

function executeMove(fr, fc, tr, tc, mv) {
  const movingPiece = board[fr][fc];
  const capturedPiece = board[tr][tc];
  const def = activeGamePieces[movingPiece.type];

  // Save undo snapshot
  undoStack.push({
    board: board.map((r) => r.map((c) => (c ? { ...c } : null))),
    enPassantSq,
    castlingRights: JSON.parse(JSON.stringify(castlingRights)),
    capturedByWhite: [...capturedByWhite],
    capturedByBlack: [...capturedByBlack],
    moveHistory: [...moveHistory],
    turn: currentTurn,
  });

  // Handle capture
  if (capturedPiece) {
    (currentTurn === "white" ? capturedByWhite : capturedByBlack).push(
      capturedPiece,
    );
  }

  // En passant capture
  enPassantSq = null;
  if (mv.enPassant) {
    const dir = currentTurn === "white" ? -1 : 1;
    const epCap = board[tr + dir][tc];
    if (epCap)
      (currentTurn === "white" ? capturedByWhite : capturedByBlack).push(epCap);
    board[tr + dir][tc] = null;
  }
  if (mv.pawnDouble) {
    const dir = currentTurn === "white" ? 1 : -1;
    enPassantSq = { r: tr - dir, c: tc };
  }

  // Castling — move the rook
  if (mv.castle) {
    const br = currentTurn === "white" ? 0 : 7;
    if (mv.castle === "king") {
      board[br][5] = board[br][7];
      board[br][7] = null;
    } else {
      board[br][3] = board[br][0];
      board[br][0] = null;
    }
  }

  // Update castling rights
  const movingDef = activeGamePieces[movingPiece.type];
  if (movingDef && movingDef.castlingRole === "king")
    castlingRights[currentTurn] = { kingSide: false, queenSide: false };
  if (movingDef && movingDef.castlingRole === "rook") {
    if (fc === 0) castlingRights[currentTurn].queenSide = false;
    if (fc === 7) castlingRights[currentTurn].kingSide = false;
  }

  board[tr][tc] = movingPiece;
  board[fr][fc] = null;

  // Record move notation
  const files = "abcdefgh";
  const notation = `${def?.abbr ?? "?"}${files[fc]}${fr + 1}-${files[tc]}${tr + 1}${capturedPiece || mv.enPassant ? "x" : ""}`;
  moveHistory.push({ text: notation, color: currentTurn });

  // Post-move continuation (shared between normal moves and promotion)
  function finishMove() {
    selectedSq = null;
    validMoves = [];
    currentTurn = currentTurn === "white" ? "black" : "white";
    checkSq = null;

    if (isInCheck(currentTurn)) {
      outer: for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (!p || p.color !== currentTurn) continue;
          const d = activeGamePieces[p.type];
          if (p.type === "K" || (d && d.royal)) {
            checkSq = { r, c };
            break outer;
          }
        }
      if (!hasAnyLegalMove(currentTurn)) {
        endGame(currentTurn === "white" ? "black" : "white", "checkmate");
        return;
      }
      updateStatus(
        `${currentTurn === "white" ? "⬜ White" : "⬛ Black"} is in CHECK!`,
      );
    } else if (!hasAnyLegalMove(currentTurn)) {
      endGame(null, "stalemate");
      return;
    } else {
      updateStatus(
        `${currentTurn === "white" ? "⬜ White" : "⬛ Black"}'s turn`,
      );
    }
    renderBoard();
    renderMoveHistory();
    renderCaptured();
  }

  // Pawn / custom-promoter promotion
  const isPromoter =
    movingPiece.type === "P" || activeGamePieces[movingPiece.type]?.promotes;
  const promotionRank = currentTurn === "white" ? 7 : 0;
  if (isPromoter && tr === promotionRank) {
    renderBoard();
    renderMoveHistory();
    renderCaptured();
    showPromotionDialog(currentTurn, (chosenType) => {
      if (chosenType.startsWith("fairy_")) {
        const id = parseInt(chosenType.replace("fairy_", ""));
        const fp = pieceLibrary.find((p) => p.id === id);
        if (fp) activeGamePieces[chosenType] = fp;
      }
      board[tr][tc] = { type: chosenType, color: currentTurn };
      const chosenDef = activeGamePieces[chosenType];
      if (moveHistory.length)
        moveHistory[moveHistory.length - 1].text +=
          `=${chosenDef?.abbr ?? "?"}`;
      finishMove();
    });
    return;
  }

  finishMove();
}

// ═══════════════════════════════════════════════════════════
// PROMOTION DIALOG
// ═══════════════════════════════════════════════════════════

function showPromotionDialog(color, callback) {
  const choices = [];
  ["Q", "R", "B", "N"].forEach((type) =>
    choices.push({ type, def: STANDARD_PIECES[type] }),
  );
  pieceLibrary
    .filter((p) => p.promotable !== false)
    .forEach((p) => {
      choices.push({ type: "fairy_" + p.id, def: p });
    });

  const overlay = document.getElementById("promo-overlay");
  const choicesEl = document.getElementById("promo-choices");
  document.getElementById("promo-subtitle").textContent =
    `${color === "white" ? "White" : "Black"}'s pawn has reached the back rank — choose a promotion piece`;
  choicesEl.innerHTML = "";

  choices.forEach(({ type, def }) => {
    const btn = document.createElement("div");
    btn.className = "promo-choice";

    const symEl = document.createElement("div");
    symEl.className = "promo-sym";
    symEl.textContent = def.symbol;
    if (color === "black") symEl.style.filter = "brightness(0.35) contrast(2)";

    const nameEl = document.createElement("div");
    nameEl.className = "promo-name";
    nameEl.textContent = def.name;

    btn.appendChild(symEl);
    btn.appendChild(nameEl);
    btn.onclick = () => {
      overlay.classList.remove("show");
      callback(type);
    };
    choicesEl.appendChild(btn);
  });

  overlay.classList.add("show");
}

// ═══════════════════════════════════════════════════════════
// UNDO / END GAME
// ═══════════════════════════════════════════════════════════

function undoMove() {
  if (!undoStack.length) return;
  const state = undoStack.pop();
  board = state.board;
  enPassantSq = state.enPassantSq;
  castlingRights = state.castlingRights;
  capturedByWhite = state.capturedByWhite;
  capturedByBlack = state.capturedByBlack;
  moveHistory = state.moveHistory;
  currentTurn = state.turn;
  checkSq = null;
  selectedSq = null;
  validMoves = [];
  updateStatus(
    `${currentTurn === "white" ? "⬜ White" : "⬛ Black"}'s turn (after undo)`,
  );
  renderBoard();
  renderMoveHistory();
  renderCaptured();
}

function endGame(winner, reason) {
  gameActive = false;
  checkSq = null;
  selectedSq = null;
  validMoves = [];
  const overlay = document.getElementById("game-overlay");
  const title = document.getElementById("overlay-title");
  const msg = document.getElementById("overlay-msg");
  const msgs = {
    checkmate: [
      `Checkmate!`,
      `${winner === "white" ? "White" : "Black"} wins by checkmate!`,
    ],
    stalemate: [`Stalemate!`, `The game is a draw by stalemate.`],
    resignation: [
      `Resignation`,
      `${winner === "white" ? "White" : "Black"} wins by resignation.`,
    ],
    draw: [`Draw Agreed`, `The players agreed to a draw.`],
  };
  [title.textContent, msg.textContent] = msgs[reason] || ["Game Over", ""];
  overlay.classList.add("show");
  renderBoard();
  renderMoveHistory();
}

function closeOverlay() {
  document.getElementById("game-overlay").classList.remove("show");
  startGame();
}

function offerDraw() {
  if (!gameActive) return;
  if (confirm("Offer draw? (both sides agree)")) endGame(null, "draw");
}

// ═══════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════

function updateStatus(txt) {
  document.getElementById("status-bar").textContent = txt;
}

function renderMoveHistory() {
  const el = document.getElementById("move-history");
  if (!moveHistory.length) {
    el.textContent = "—";
    return;
  }
  let html = "";
  for (let i = 0; i < moveHistory.length; i += 2) {
    const n = Math.floor(i / 2) + 1;
    html += `<span class="move-num">${n}.</span>`;
    html += `<span class="white-move">${moveHistory[i].text}</span> `;
    if (moveHistory[i + 1])
      html += `<span class="black-move">${moveHistory[i + 1].text}</span> `;
  }
  el.innerHTML = html;
  el.scrollTop = el.scrollHeight;
}

function renderCaptured() {
  const fmt = (list) =>
    list
      .map((p) => {
        const d = activeGamePieces[p.type];
        return d ? `<span title="${d.name}">${d.symbol}</span>` : "";
      })
      .join("");
  document.getElementById("white-captured").innerHTML = fmt(capturedByWhite);
  document.getElementById("black-captured").innerHTML = fmt(capturedByBlack);
}

function updatePieceLegend() {
  const el = document.getElementById("piece-legend");
  const unique = new Set();
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if (board[r][c]) unique.add(board[r][c].type);
    }
  if (!unique.size) {
    el.innerHTML = "No pieces on board.";
    return;
  }
  el.innerHTML = [...unique]
    .map((type) => {
      const def = activeGamePieces[type];
      if (!def) return "";
      return `<div style="display:flex;align-items:center;gap:0.5rem;">
      <span style="font-size:1.3rem;">${def.symbol}</span>
      <div>
        <div style="color:var(--gold);font-family:'Cinzel',serif;font-size:0.72rem;">${def.name}</div>
        <div style="font-size:0.73rem;">${type.startsWith("fairy_") ? "Custom Fairy Piece" : "Standard"}</div>
      </div>
    </div>`;
    })
    .join("");
}

function switchTab(name) {
  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  document.querySelectorAll(".tab-btn").forEach((b) => {
    if (b.getAttribute("onclick").includes(`'${name}'`))
      b.classList.add("active");
  });
  if (name === "library") renderLibrary();
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
