"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Word Lists ───────────────────────────────────────────────────────────────
const WORDS = {
  5: ["CRANE","SLATE","TRACE","PHONE","BLAZE","FROST","GLOOM","NIGHT","SWORD","STORM",
      "FLAME","DREAD","RAVEN","HAUNT","CRYPT","SHADE","CURSE","MAGIC","PIXEL","VAPOR",
      "STEEL","PRISM","LUNAR","SABLE","GLARE","EMBER","FLINT","CLOAK","BROOD","STARK",
      "CRISP","DWELL","FABLE","GRAIL","Haven","IRONY","KNEEL","LATCH","MOURN","NOVEL",
      "OAKEN","PROWL","QUIRK","RESIN","SMELT","TAUNT","UNTIE","VIGIL","WALTZ","YIELD"],
  6: ["SHADOW","FALCON","MYSTIC","FROZEN","CASTLE","PORTAL","MIRROR","PLAGUE","ROTTEN",
      "WITHER","INFECT","THRONE","GOBLIN","KNIGHT","DAGGER","PRIEST","VORTEX","COBALT",
      "MORTAL","FAMINE","BANISH","COMPEL","DEVOUR","ENTITY","FATHOM","GLYPH","HARROW",
      "IGNITE","JESTER","KINDLE","LAMENT","NOMADS","OCCULT","PILLAR","RAVAGE","SIGNET"],
  7: ["PHANTOM","CRYSTAL","ECLIPSE","GRAVITY","LANTERN","SILENCE","CRIMSON","ANCIENT",
      "BLESSED","CONQUER","DESTINY","ELEMENT","FRACTAL","HORIZON","INFERNO","JOURNEY",
      "KINGDOM","LABYRINTH","MASTERY","OBSCURE","PILGRIM","QUALIFY","RADIANT","SERPENT",
      "TRIUMPH","UNRAVEL","VILLAIN","WARRIOR","EVASION","FACTION"],
};

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

function pick(len) {
  const list = WORDS[len];
  return list[Math.floor(Math.random() * list.length)];
}

function scoreGuess(guess, target) {
  const result = Array(target.length).fill("absent");
  const tArr = target.split("");
  const used = Array(target.length).fill(false);
  for (let i = 0; i < target.length; i++) {
    if (guess[i] === tArr[i]) { result[i] = "correct"; used[i] = true; }
  }
  for (let i = 0; i < target.length; i++) {
    if (result[i] === "correct") continue;
    const j = tArr.findIndex((c, k) => !used[k] && c === guess[i]);
    if (j !== -1) { result[i] = "present"; used[j] = true; }
  }
  return result;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ["#a78bfa","#34d399","#fbbf24","#f87171","#60a5fa","#f472b6"];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: 8 + Math.random() * 6,
    h: 4 + Math.random() * 4,
    r: Math.random() * Math.PI * 2,
    dr: (Math.random() - 0.5) * 0.2,
    dy: 3 + Math.random() * 4,
    dx: (Math.random() - 0.5) * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      p.x += p.dx; p.y += p.dy; p.r += p.dr;
    });
    frame++;
    if (frame < 180) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ─── Tile ─────────────────────────────────────────────────────────────────────
function Tile({ letter, state, animState }) {
  const base = "flex items-center justify-center text-xl font-semibold uppercase select-none rounded transition-colors duration-300 border";
  const size = "w-[52px] h-[52px]";

  const stateClass = {
    correct: "bg-emerald-800 border-emerald-700 text-white",
    present: "bg-amber-700 border-amber-600 text-white",
    absent:  "bg-zinc-800 border-zinc-700 text-zinc-500",
    filled:  "border-zinc-500 bg-zinc-900 text-white",
    empty:   "border-zinc-700 bg-zinc-900 text-white",
  }[state] ?? "border-zinc-700 bg-zinc-900 text-white";

  const animClass = animState === "shake" ? "animate-shake" : animState === "pop" ? "animate-pop" : "";

  return (
    <div className={`${base} ${size} ${stateClass} ${animClass}`}>
      {letter}
    </div>
  );
}

// ─── Key ──────────────────────────────────────────────────────────────────────
function Key({ label, state, onClick }) {
  const isWide = label === "ENTER" || label === "⌫";
  const base = "flex items-center justify-center rounded font-semibold uppercase cursor-pointer select-none transition-colors duration-200 text-sm h-[44px]";
  const width = isWide ? "min-w-[52px] px-2 text-xs" : "w-[32px]";
  const stateClass = {
    correct: "bg-emerald-800 text-white",
    present: "bg-amber-700 text-white",
    absent:  "bg-zinc-900 text-zinc-600",
  }[state] ?? "bg-zinc-700 text-zinc-200 hover:bg-zinc-600";

  return (
    <button className={`${base} ${width} ${stateClass}`} onClick={() => onClick(label)}>
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WordlePage() {
  const [wordLen, setWordLen] = useState(5);
  const [target, setTarget] = useState(() => pick(5));
  const [board, setBoard] = useState(() => Array.from({ length: 6 }, () => Array(5).fill("")));
  const [results, setResults] = useState(() => Array(6).fill(null));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [keyMap, setKeyMap] = useState({});
  const [shakeRow, setShakeRow] = useState(null);
  const [revealingRow, setRevealingRow] = useState(null);
  const [tileFlips, setTileFlips] = useState({}); // { "r-c": state }

  const gameOverRef = useRef(false);
  const currentRowRef = useRef(0);
  const currentColRef = useRef(0);
  const boardRef = useRef(board);
  const targetRef = useRef(target);

  gameOverRef.current = gameOver;
  currentRowRef.current = currentRow;
  currentColRef.current = currentCol;
  boardRef.current = board;
  targetRef.current = target;

  const showMsg = useCallback((msg, duration = 2000) => {
    setMessage(msg);
    if (duration > 0) setTimeout(() => setMessage(""), duration);
  }, []);

  const startGame = useCallback((len) => {
    const newTarget = pick(len);
    setTarget(newTarget);
    targetRef.current = newTarget;
    setBoard(Array.from({ length: 6 }, () => Array(len).fill("")));
    setResults(Array(6).fill(null));
    setCurrentRow(0);
    setCurrentCol(0);
    setGameOver(false);
    gameOverRef.current = false;
    setKeyMap({});
    setMessage("");
    setShakeRow(null);
    setRevealingRow(null);
    setTileFlips({});
  }, []);

  const handleKey = useCallback((key) => {
    if (gameOverRef.current) return;
    const row = currentRowRef.current;
    const col = currentColRef.current;
    const len = boardRef.current[0].length;

    if (key === "⌫" || key === "BACKSPACE") {
      if (col > 0) {
        setBoard(prev => {
          const next = prev.map(r => [...r]);
          next[row][col - 1] = "";
          return next;
        });
        setCurrentCol(c => c - 1);
      }
      return;
    }

    if (key === "ENTER") {
      const guess = boardRef.current[row].join("");
      if (guess.length < len) {
        setShakeRow(row);
        setTimeout(() => setShakeRow(null), 400);
        showMsg("Not enough letters");
        return;
      }

      const result = scoreGuess(guess, targetRef.current);

      // Reveal tiles one by one
      setRevealingRow(row);
      result.forEach((state, c) => {
        setTimeout(() => {
          setTileFlips(prev => ({ ...prev, [`${row}-${c}`]: state }));
        }, c * 150 + 250);
      });

      setTimeout(() => {
        setResults(prev => { const next = [...prev]; next[row] = result; return next; });
        setRevealingRow(null);

        // Update key map
        const priority = { correct: 3, present: 2, absent: 1 };
        setKeyMap(prev => {
          const next = { ...prev };
          result.forEach((state, i) => {
            const k = guess[i];
            if (!next[k] || priority[state] > priority[next[k]]) next[k] = state;
          });
          return next;
        });

        if (result.every(r => r === "correct")) {
          setGameOver(true);
          gameOverRef.current = true;
          showMsg("Brilliant! 🎉", 3000);
          setTimeout(launchConfetti, 200);
          return;
        }

        const nextRow = row + 1;
        setCurrentRow(nextRow);
        setCurrentCol(0);

        if (nextRow === 6) {
          setGameOver(true);
          gameOverRef.current = true;
          showMsg(`The word was: ${targetRef.current}`, 5000);
        }
      }, len * 150 + 400);
      return;
    }

    if (/^[A-Z]$/.test(key) && col < len) {
      setBoard(prev => {
        const next = prev.map(r => [...r]);
        next[row][col] = key;
        return next;
      });
      setCurrentCol(c => c + 1);
    }
  }, [showMsg]);

  // Physical keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k === "ENTER" || k === "BACKSPACE" || /^[A-Z]$/.test(k)) handleKey(k);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const switchLength = (len) => {
    setWordLen(len);
    startGame(len);
  };

  const getTileState = (r, c) => {
    const letter = board[r][c];
    const flipState = tileFlips[`${r}-${c}`];
    if (flipState) return flipState;
    if (results[r]) return results[r][c];
    if (!letter) return "empty";
    return "filled";
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-8 px-4 font-mono">
      <canvas id="confetti-canvas" className="fixed inset-0 w-full h-full pointer-events-none z-50" />

      {/* Header */}
      <div className="w-full max-w-sm border-b border-zinc-800 pb-4 mb-4 text-center">
        <h1 className="text-2xl font-semibold tracking-[0.2em] text-white uppercase">Wordle</h1>
      </div>

      {/* Length picker */}
      <div className="flex gap-2 mb-5">
        {[5, 6, 7].map(len => (
          <button
            key={len}
            onClick={() => switchLength(len)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors border ${
              wordLen === len
                ? "bg-white text-black border-white"
                : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"
            }`}
          >
            {len} letters
          </button>
        ))}
      </div>

      {/* Message */}
      <div className="h-7 mb-3 text-sm text-zinc-400 tracking-wide text-center">
        {message}
      </div>

      {/* Board */}
      <div className="flex flex-col gap-1.5 mb-6">
        {board.map((row, r) => (
          <div key={r} className={`flex gap-1.5 ${shakeRow === r ? "animate-shake" : ""}`}>
            {row.map((letter, c) => (
              <Tile
                key={c}
                letter={letter}
                state={getTileState(r, c)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Keyboard */}
      <div className="flex flex-col gap-1.5 items-center">
        {KB_ROWS.map((keys, i) => (
          <div key={i} className="flex gap-1">
            {keys.map(k => (
              <Key key={k} label={k} state={keyMap[k]} onClick={handleKey} />
            ))}
          </div>
        ))}
      </div>

      {/* New game */}
      {gameOver && (
        <button
          onClick={() => startGame(wordLen)}
          className="mt-6 px-6 py-2.5 bg-white text-black rounded font-semibold text-sm hover:bg-zinc-200 transition-colors tracking-wide"
        >
          New Game
        </button>
      )}
    </div>
  );
}
