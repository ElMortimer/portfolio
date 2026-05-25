"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const WORDS = {
  5: ["CRANE","SLATE","TRACE","PHONE","BLAZE","FROST","GLOOM","NIGHT","SWORD","STORM",
      "FLAME","DREAD","RAVEN","HAUNT","CRYPT","SHADE","CURSE","MAGIC","PIXEL","VAPOR",
      "STEEL","PRISM","LUNAR","SABLE","GLARE","EMBER","FLINT","CLOAK","BROOD","STARK",
      "CRISP","DWELL","FABLE","GRAIL","IRONY","KNEEL","LATCH","MOURN","NOVEL",
      "OAKEN","PROWL","QUIRK","RESIN","SMELT","TAUNT","VIGIL","WALTZ","YIELD"],
  6: ["SHADOW","FALCON","MYSTIC","FROZEN","CASTLE","PORTAL","MIRROR","PLAGUE","ROTTEN",
      "WITHER","INFECT","THRONE","GOBLIN","KNIGHT","DAGGER","PRIEST","VORTEX","COBALT",
      "MORTAL","FAMINE","BANISH","COMPEL","DEVOUR","ENTITY","FATHOM","HARROW",
      "IGNITE","JESTER","KINDLE","LAMENT","NOMADS","OCCULT","PILLAR","RAVAGE","SIGNET"],
  7: ["PHANTOM","CRYSTAL","ECLIPSE","GRAVITY","LANTERN","SILENCE","CRIMSON","ANCIENT",
      "BLESSED","CONQUER","DESTINY","ELEMENT","FRACTAL","HORIZON","INFERNO","JOURNEY",
      "KINGDOM","MASTERY","OBSCURE","PILGRIM","RADIANT","SERPENT","TRIUMPH","UNRAVEL",
      "VILLAIN","WARRIOR","EVASION","FACTION"],
};

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

const PRIORITY = { correct: 3, present: 2, absent: 1 };

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
    w: 8 + Math.random() * 6, h: 4 + Math.random() * 4,
    r: Math.random() * Math.PI * 2, dr: (Math.random() - 0.5) * 0.2,
    dy: 3 + Math.random() * 4, dx: (Math.random() - 0.5) * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      p.x += p.dx; p.y += p.dy; p.r += p.dr;
    });
    frame++;
    if (frame < 180) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// Each committed row flips in with a CSS delay per tile
function CommittedRow({ word, result, wordLen }) {
  const stateClass = {
    correct: "bg-emerald-800 border-emerald-700 text-white",
    present: "bg-amber-700 border-amber-600 text-white",
    absent:  "bg-zinc-800 border-zinc-700 text-zinc-500",
  };
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: wordLen }).map((_, c) => (
        <div
          key={c}
          className={`w-[52px] h-[52px] flex items-center justify-center text-xl font-semibold uppercase rounded border ${stateClass[result[c]]}`}
          style={{
            animation: `tileFlip 0.5s ease forwards`,
            animationDelay: `${c * 150}ms`,
            // start face-down so flip reveals color
          }}
        >
          {word[c]}
        </div>
      ))}
    </div>
  );
}

function ActiveRow({ letters, wordLen, shake }) {
  return (
    <div className={`flex gap-1.5 ${shake ? "animate-shake" : ""}`}>
      {Array.from({ length: wordLen }).map((_, c) => {
        const letter = letters[c] || "";
        return (
          <div
            key={c}
            className={`w-[52px] h-[52px] flex items-center justify-center text-xl font-semibold uppercase rounded border
              ${letter ? "border-zinc-500 bg-zinc-900 text-white animate-pop" : "border-zinc-700 bg-zinc-900 text-white"}`}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}

function EmptyRow({ wordLen }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: wordLen }).map((_, c) => (
        <div key={c} className="w-[52px] h-[52px] rounded border border-zinc-700 bg-zinc-900" />
      ))}
    </div>
  );
}

function Key({ label, state, onClick }) {
  const isWide = label === "ENTER" || label === "⌫";
  const stateClass = {
    correct: "bg-emerald-800 text-white",
    present: "bg-amber-700 text-white",
    absent:  "bg-zinc-900 text-zinc-600",
  }[state] ?? "bg-zinc-700 text-zinc-200 hover:bg-zinc-600";
  return (
    <button
      className={`flex items-center justify-center rounded font-semibold uppercase cursor-pointer select-none transition-colors duration-200 h-[44px] ${isWide ? "min-w-[52px] px-2 text-xs" : "w-[32px] text-sm"} ${stateClass}`}
      onClick={() => onClick(label)}
    >
      {label}
    </button>
  );
}

function makeState(len) {
  return {
    target: pick(len),
    guesses: [],      // committed words: string[]
    results: [],      // committed results: string[][]
    draft: [],        // current row letters: string[]
    gameOver: false,
    won: false,
    keyMap: {},
  };
}

export default function WordlePage() {
  const [wordLen, setWordLen] = useState(5);
  const [gs, setGs] = useState(() => makeState(5));
  const [shaking, setShaking] = useState(false);
  const [message, setMessage] = useState("");
  const isRevealingRef = useRef(false);

  const showMsg = useCallback((msg, duration = 2000) => {
    setMessage(msg);
    if (duration > 0) setTimeout(() => setMessage(""), duration);
  }, []);

  const handleKey = useCallback((key) => {
    if (isRevealingRef.current) return;

    setGs(prev => {
      if (prev.gameOver) return prev;
      const len = prev.target.length;

      if (key === "⌫" || key === "BACKSPACE") {
        return { ...prev, draft: prev.draft.slice(0, -1) };
      }

      if (/^[A-Z]$/.test(key)) {
        if (prev.draft.length >= len) return prev;
        return { ...prev, draft: [...prev.draft, key] };
      }

      if (key === "ENTER") {
        if (prev.draft.length < len) {
          // shake handled outside
          return prev;
        }
        const word = prev.draft.join("");
        const result = scoreGuess(word, prev.target);
        const newKeyMap = { ...prev.keyMap };
        result.forEach((state, i) => {
          const k = word[i];
          if (!newKeyMap[k] || PRIORITY[state] > PRIORITY[newKeyMap[k]]) newKeyMap[k] = state;
        });
        const newGuesses = [...prev.guesses, word];
        const newResults = [...prev.results, result];
        const won = result.every(r => r === "correct");
        const gameOver = won || newGuesses.length === 6;
        return { ...prev, guesses: newGuesses, results: newResults, draft: [], keyMap: newKeyMap, gameOver, won };
      }

      return prev;
    });
  }, []);

  // Watch for new committed rows to trigger reveal delay + win/lose message
  const prevGuessLen = useRef(0);
  useEffect(() => {
    if (gs.guesses.length > prevGuessLen.current) {
      prevGuessLen.current = gs.guesses.length;
      const len = gs.target.length;
      const revealDuration = len * 150 + 600;
      isRevealingRef.current = true;
      setTimeout(() => {
        isRevealingRef.current = false;
        if (gs.won) {
          showMsg("Brilliant! 🎉", 3000);
          launchConfetti();
        } else if (gs.gameOver) {
          showMsg(`The word was: ${gs.target}`, 5000);
        }
      }, revealDuration);
    }
  }, [gs.guesses.length, gs.won, gs.gameOver, gs.target, showMsg]);

  // Keyboard input
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k === "ENTER") {
        if (gs.draft.length < gs.target.length && !gs.gameOver) {
          setShaking(true);
          showMsg("Not enough letters");
          setTimeout(() => setShaking(false), 400);
          return;
        }
        handleKey("ENTER");
      } else if (k === "BACKSPACE" || /^[A-Z]$/.test(k)) {
        handleKey(k);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey, gs.draft.length, gs.target.length, gs.gameOver, showMsg]);

  const onScreenKey = useCallback((label) => {
    if (label === "ENTER" && gs.draft.length < gs.target.length && !gs.gameOver) {
      setShaking(true);
      showMsg("Not enough letters");
      setTimeout(() => setShaking(false), 400);
      return;
    }
    handleKey(label);
  }, [handleKey, gs.draft, gs.target, gs.gameOver, showMsg]);

  const switchLength = (len) => {
    setWordLen(len);
    setGs(makeState(len));
    prevGuessLen.current = 0;
    setMessage("");
    isRevealingRef.current = false;
  };

  const { guesses, results, draft, gameOver, keyMap, target } = gs;
  const totalRows = 6;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-8 px-4 font-mono">
      <style>{`
        @keyframes tileFlip {
          0%   { transform: rotateX(0deg); }
          49%  { transform: rotateX(90deg); }
          50%  { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
        @keyframes pop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-shake { animation: shake 0.4s ease; }
        .animate-pop   { animation: pop 0.1s ease; }
      `}</style>

      <canvas id="confetti-canvas" className="fixed inset-0 w-full h-full pointer-events-none z-50" />

      <div className="w-full max-w-sm border-b border-zinc-800 pb-4 mb-4 text-center">
        <h1 className="text-2xl font-semibold tracking-[0.2em] text-white uppercase">Wordle</h1>
      </div>

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

      <div className="h-7 mb-3 text-sm text-zinc-400 tracking-wide text-center">{message}</div>

      <div className="flex flex-col gap-1.5 mb-6">
        {Array.from({ length: totalRows }).map((_, r) => {
          if (r < guesses.length) {
            return <CommittedRow key={r} word={guesses[r].split("")} result={results[r]} wordLen={wordLen} />;
          }
          if (r === guesses.length && !gameOver) {
            return <ActiveRow key={r} letters={draft} wordLen={wordLen} shake={shaking} />;
          }
          return <EmptyRow key={r} wordLen={wordLen} />;
        })}
      </div>

      <div className="flex flex-col gap-1.5 items-center">
        {KB_ROWS.map((keys, i) => (
          <div key={i} className="flex gap-1">
            {keys.map(k => <Key key={k} label={k} state={keyMap[k]} onClick={onScreenKey} />)}
          </div>
        ))}
      </div>

      {gameOver && (
        <button
          onClick={() => { setGs(makeState(wordLen)); prevGuessLen.current = 0; setMessage(""); isRevealingRef.current = false; }}
          className="mt-6 px-6 py-2.5 bg-white text-black rounded font-semibold text-sm hover:bg-zinc-200 transition-colors tracking-wide"
        >
          New Game
        </button>
      )}
    </div>
  );
}
