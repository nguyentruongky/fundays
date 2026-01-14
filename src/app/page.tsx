"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

type Cell = string | null;
type Tile = { id: string; letter: string };
type Mode = "path" | "line";

const ROWS = 7;
const COLS = 6;
const TILE_SIZE = 64;
const TILE_GAP = 10;
const WORD_POOL = [
  "PEAR",
  "APPLE",
  "PLUM",
  "LIME",
  "MELON",
  "GRAPE",
  "FIG",
  "KIWI",
  "BERRY",
  "ORANGE",
  "LEMON",
  "MANGO",
  "GUAVA",
  "CHERRY",
  "PAPAYA",
];
const WORD_COUNT = 6;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const shuffleArray = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const pickWords = () => {
  return shuffleArray(WORD_POOL).slice(0, WORD_COUNT);
};

const createLetterGrid = () =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));

const findPlacement = (
  grid: (string | null)[][],
  word: string,
  mode: Mode,
) => {
  const positions = shuffleArray(
    Array.from({ length: ROWS * COLS }, (_, index) => index),
  );

  const directions: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  if (mode === "line") {
    for (const flatIndex of positions) {
      const row = Math.floor(flatIndex / COLS);
      const col = flatIndex % COLS;
      const shuffledDirections = shuffleArray(directions);
      for (const [dr, dc] of shuffledDirections) {
        const endRow = row + dr * (word.length - 1);
        const endCol = col + dc * (word.length - 1);
        if (
          endRow < 0 ||
          endRow >= ROWS ||
          endCol < 0 ||
          endCol >= COLS
        ) {
          continue;
        }
        const path: Array<{ row: number; col: number }> = [];
        let valid = true;
        for (let i = 0; i < word.length; i += 1) {
          const nextRow = row + dr * i;
          const nextCol = col + dc * i;
          const cellLetter = grid[nextRow][nextCol];
          if (cellLetter && cellLetter !== word[i]) {
            valid = false;
            break;
          }
          path.push({ row: nextRow, col: nextCol });
        }
        if (valid) {
          return path;
        }
      }
    }
    return null;
  }

  const dfs = (
    row: number,
    col: number,
    index: number,
    visited: Set<string>,
    path: Array<{ row: number; col: number }>,
  ): Array<{ row: number; col: number }> | null => {
    const key = `${row}-${col}`;
    if (visited.has(key)) {
      return null;
    }
    const cellLetter = grid[row]?.[col];
    if (cellLetter && cellLetter !== word[index]) {
      return null;
    }
    const nextPath = [...path, { row, col }];
    if (index === word.length - 1) {
      return nextPath;
    }
    visited.add(key);
    const shuffledDirections = shuffleArray(directions);
    for (const [dr, dc] of shuffledDirections) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (
        nextRow >= 0 &&
        nextRow < ROWS &&
        nextCol >= 0 &&
        nextCol < COLS
      ) {
        const result = dfs(nextRow, nextCol, index + 1, visited, nextPath);
        if (result) {
          visited.delete(key);
          return result;
        }
      }
    }
    visited.delete(key);
    return null;
  };

  for (const flatIndex of positions) {
    const row = Math.floor(flatIndex / COLS);
    const col = flatIndex % COLS;
    const result = dfs(row, col, 0, new Set(), []);
    if (result) {
      return result;
    }
  }
  return null;
};

const findPlacementOnIds = (
  grid: Cell[][],
  word: string,
  letterGrid: (string | null)[][],
  mode: Mode,
) => {
  const positions = shuffleArray(
    Array.from({ length: ROWS * COLS }, (_, index) => index),
  );
  const directions: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  if (mode === "line") {
    for (const flatIndex of positions) {
      const row = Math.floor(flatIndex / COLS);
      const col = flatIndex % COLS;
      const shuffledDirections = shuffleArray(directions);
      for (const [dr, dc] of shuffledDirections) {
        const endRow = row + dr * (word.length - 1);
        const endCol = col + dc * (word.length - 1);
        if (
          endRow < 0 ||
          endRow >= ROWS ||
          endCol < 0 ||
          endCol >= COLS
        ) {
          continue;
        }
        const path: Array<{ row: number; col: number }> = [];
        let valid = true;
        for (let i = 0; i < word.length; i += 1) {
          const nextRow = row + dr * i;
          const nextCol = col + dc * i;
          const id = grid[nextRow]?.[nextCol];
          const assigned = letterGrid[nextRow]?.[nextCol];
          if (!id || (assigned && assigned !== word[i])) {
            valid = false;
            break;
          }
          path.push({ row: nextRow, col: nextCol });
        }
        if (valid) {
          return path;
        }
      }
    }
    return null;
  }

  const dfs = (
    row: number,
    col: number,
    index: number,
    visited: Set<string>,
    path: Array<{ row: number; col: number }>,
  ): Array<{ row: number; col: number }> | null => {
    const key = `${row}-${col}`;
    const id = grid[row]?.[col];
    const assigned = letterGrid[row]?.[col];
    if (!id || visited.has(key) || (assigned && assigned !== word[index])) {
      return null;
    }
    const nextPath = [...path, { row, col }];
    if (index === word.length - 1) {
      return nextPath;
    }
    visited.add(key);
    const shuffledDirections = shuffleArray(directions);
    for (const [dr, dc] of shuffledDirections) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (
        nextRow >= 0 &&
        nextRow < ROWS &&
        nextCol >= 0 &&
        nextCol < COLS
      ) {
        const result = dfs(nextRow, nextCol, index + 1, visited, nextPath);
        if (result) {
          visited.delete(key);
          return result;
        }
      }
    }
    visited.delete(key);
    return null;
  };

  for (const flatIndex of positions) {
    const row = Math.floor(flatIndex / COLS);
    const col = flatIndex % COLS;
    const result = dfs(row, col, 0, new Set(), []);
    if (result) {
      return result;
    }
  }
  return null;
};

const imprintWordsOnGrid = (
  grid: Cell[][],
  tiles: Record<string, Tile>,
  words: string[],
  mode: Mode,
) => {
  let bestLetterGrid: (string | null)[][] | null = null;
  let bestPlaced = 0;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const letterGrid: (string | null)[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => null),
    );
    let placed = 0;
    const orderedWords = shuffleArray(words);
    for (const word of orderedWords) {
      const placement = findPlacementOnIds(grid, word, letterGrid, mode);
      if (!placement) {
        break;
      }
      placement.forEach(({ row, col }, index) => {
        letterGrid[row][col] = word[index];
      });
      placed += 1;
    }
    if (placed === words.length) {
      bestLetterGrid = letterGrid;
      break;
    }
    if (placed > bestPlaced) {
      bestPlaced = placed;
      bestLetterGrid = letterGrid;
    }
  }

  const finalLetterGrid =
    bestLetterGrid ??
    Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));

  grid.forEach((row, rowIndex) => {
    row.forEach((id, colIndex) => {
      if (!id) {
        return;
      }
      const assigned = finalLetterGrid[rowIndex]?.[colIndex];
      tiles[id].letter =
        assigned ?? LETTERS[Math.floor(Math.random() * LETTERS.length)];
    });
  });
};

const buildBoard = (words: string[], mode: Mode) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const grid = createLetterGrid();
    let placedAll = true;
    for (const word of words) {
      const placement = findPlacement(grid, word, mode);
      if (!placement) {
        placedAll = false;
        break;
      }
      placement.forEach(({ row, col }, index) => {
        grid[row][col] = word[index];
      });
    }
    if (!placedAll) {
      continue;
    }
    const filled = grid.map((row) =>
      row.map((cell) => cell ?? LETTERS[Math.floor(Math.random() * LETTERS.length)]),
    );

    let idCounter = 0;
    const tiles: Record<string, Tile> = {};
    const idGrid: Cell[][] = filled.map((row) =>
      row.map((letter) => {
        const id = `tile-${idCounter++}`;
        tiles[id] = { id, letter };
        return id;
      }),
    );
    return { grid: idGrid, tiles };
  }

  let idCounter = 0;
  const tiles: Record<string, Tile> = {};
  const idGrid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => {
      const id = `tile-${idCounter++}`;
      tiles[id] = {
        id,
        letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
      };
      return id;
    }),
  );
  return { grid: idGrid, tiles };
};

const normalizeGrid = (grid: Cell[][]) => {
  const columns: string[][] = [];
  for (let col = 0; col < COLS; col += 1) {
    const stack: string[] = [];
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const id = grid[row][col];
      if (id) {
        stack.push(id);
      }
    }
    columns.push(stack);
  }

  const nonEmpty = columns.filter((column) => column.length > 0);
  const emptyCount = COLS - nonEmpty.length;
  const leftPadding = Math.floor(emptyCount / 2);
  const rightPadding = emptyCount - leftPadding;
  const centeredColumns = [
    ...Array.from({ length: leftPadding }, () => [] as string[]),
    ...nonEmpty,
    ...Array.from({ length: rightPadding }, () => [] as string[]),
  ];

  const nextGrid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null),
  );
  centeredColumns.forEach((column, col) => {
    column.forEach((id, index) => {
      const row = ROWS - 1 - index;
      nextGrid[row][col] = id;
    });
  });

  return nextGrid;
};

const applyRemoval = (grid: Cell[][], removed: Set<string>) => {
  const pruned = grid.map((row) =>
    row.map((id) => (id && !removed.has(id) ? id : null)),
  );
  return normalizeGrid(pruned);
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("path");
  const initialWordsRef = useRef(pickWords());
  const initialBoardRef = useRef(buildBoard(initialWordsRef.current, "path"));
  const tilesRef = useRef(initialBoardRef.current.tiles);
  const boardRef = useRef<HTMLDivElement>(null);
  const hintTimerRef = useRef<number | null>(null);

  const [grid, setGrid] = useState<Cell[][]>(initialBoardRef.current.grid);
  const [wordList, setWordList] = useState<string[]>(initialWordsRef.current);
  const [remainingWords, setRemainingWords] = useState<string[]>(
    initialWordsRef.current,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [clearing, setClearing] = useState<string[]>([]);
  const [hintPath, setHintPath] = useState<string[]>([]);
  const [earned, setEarned] = useState<string[]>([]);
  const [message, setMessage] = useState(
    "Swipe across adjacent tiles to earn the word.",
  );
  const [isDragging, setIsDragging] = useState(false);
  const [locked, setLocked] = useState(false);

  const selectedRef = useRef(selected);
  const lockedRef = useRef(locked);
  const targetWord = remainingWords[0] ?? null;

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    if (remainingWords.length === 0) {
      setMessage("All words found! Shuffle for a new board.");
    }
  }, [remainingWords]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  const positions = useMemo(() => {
    const map: Record<string, { row: number; col: number }> = {};
    grid.forEach((row, rowIndex) => {
      row.forEach((id, colIndex) => {
        if (id) {
          map[id] = { row: rowIndex, col: colIndex };
        }
      });
    });
    return map;
  }, [grid]);

  const positionsRef = useRef(positions);
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const tilesInPlay = useMemo(() => {
    const items: Array<{
      id: string;
      row: number;
      col: number;
      letter: string;
    }> = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((id, colIndex) => {
        if (id) {
          items.push({
            id,
            row: rowIndex,
            col: colIndex,
            letter: tilesRef.current[id]?.letter ?? "",
          });
        }
      });
    });
    return items;
  }, [grid]);

  const extendSelection = useCallback(
    (id: string) => {
      if (lockedRef.current) {
        return;
      }

      setSelected((prev) => {
        if (prev.includes(id)) {
          if (prev.length >= 2 && prev[prev.length - 2] === id) {
            return prev.slice(0, -1);
          }
          return prev;
        }
        const last = prev[prev.length - 1];
        if (!last) {
          return prev;
        }
        const currentPos = positionsRef.current[id];
        const lastPos = positionsRef.current[last];
        if (!currentPos || !lastPos) {
          return prev;
        }
        if (mode === "line" && prev.length >= 2) {
          const firstPos = positionsRef.current[prev[0]];
          const secondPos = positionsRef.current[prev[1]];
          if (!firstPos || !secondPos) {
            return prev;
          }
          const axisRow = firstPos.row === secondPos.row;
          const axisCol = firstPos.col === secondPos.col;
          if (
            (axisRow && currentPos.row !== firstPos.row) ||
            (axisCol && currentPos.col !== firstPos.col)
          ) {
            return prev;
          }
        }
        const distance =
          Math.abs(currentPos.row - lastPos.row) +
          Math.abs(currentPos.col - lastPos.col);
        if (distance !== 1) {
          return prev;
        }
        return [...prev, id];
      });
    },
    [mode],
  );

  const clearWord = useCallback(
    (selection: string[], word: string) => {
      if (!selection.length) {
        return;
      }
      setLocked(true);
      setClearing(selection);
      setSelected([]);
      setHintPath([]);
      setIsDragging(false);
      setMessage(`Great! ${word} cleared.`);
      setEarned((prev) => {
        if (prev.includes(word)) {
          return prev;
        }
        return [word, ...prev].slice(0, 4);
      });
      const nextRemaining = remainingWords.filter((entry) => entry !== word);
      setRemainingWords(nextRemaining);

      const removed = new Set(selection);
      window.setTimeout(() => {
        setGrid((prev) => {
          const droppedGrid = applyRemoval(prev, removed);
          return droppedGrid;
        });
        setClearing([]);
        setLocked(false);
      }, 350);
    },
    [mode, remainingWords],
  );

  const finishSelection = useCallback(() => {
    if (!isDragging) {
      return;
    }
    const selection = selectedRef.current;
    setIsDragging(false);
    setSelected([]);
    setHintPath([]);
    const word = selection
      .map((id) => tilesRef.current[id]?.letter ?? "")
      .join("");
    if (remainingWords.includes(word)) {
      clearWord(selection, word);
    } else if (word.length > 0) {
      setMessage("That word isn't hidden here.");
    }
  }, [clearWord, isDragging, remainingWords]);

  useEffect(() => {
    const handlePointerUp = () => finishSelection();
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [finishSelection]);

  const handlePointerDown = (id: string) => {
    if (lockedRef.current) {
      return;
    }
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setIsDragging(true);
    setSelected([id]);
    setHintPath([]);
    setMessage("Release to submit the word.");
  };

  const handleBoardPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || lockedRef.current) {
      return;
    }
    const target = document.elementFromPoint(
      event.clientX,
      event.clientY,
    ) as HTMLElement | null;
    const tileElement = target?.closest("[data-tile-id]") as HTMLElement | null;
    const id = tileElement?.dataset.tileId;
    if (id) {
      extendSelection(id);
    }
  };

  const selectedWord = selected
    .map((id) => tilesRef.current[id]?.letter ?? "")
    .join("");

  const foundWords = useMemo(
    () => wordList.filter((word) => !remainingWords.includes(word)),
    [wordList, remainingWords],
  );

  const findWordPath = useCallback(
    (word: string) => {
      if (mode === "line") {
        const directions: Array<[number, number]> = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        for (let row = 0; row < ROWS; row += 1) {
          for (let col = 0; col < COLS; col += 1) {
            const startId = grid[row]?.[col];
            if (!startId) {
              continue;
            }
            if ((tilesRef.current[startId]?.letter ?? "") !== word[0]) {
              continue;
            }
            for (const [dr, dc] of directions) {
              const endRow = row + dr * (word.length - 1);
              const endCol = col + dc * (word.length - 1);
              if (
                endRow < 0 ||
                endRow >= ROWS ||
                endCol < 0 ||
                endCol >= COLS
              ) {
                continue;
              }
              const path: string[] = [];
              let valid = true;
              for (let i = 0; i < word.length; i += 1) {
                const nextRow = row + dr * i;
                const nextCol = col + dc * i;
                const id = grid[nextRow]?.[nextCol];
                if (!id) {
                  valid = false;
                  break;
                }
                const letter = tilesRef.current[id]?.letter ?? "";
                if (letter !== word[i]) {
                  valid = false;
                  break;
                }
                path.push(id);
              }
              if (valid) {
                return path;
              }
            }
          }
        }
        return null;
      }

      const visited = new Set<string>();

      const dfs = (
        row: number,
        col: number,
        index: number,
        path: string[],
      ): string[] | null => {
        const id = grid[row]?.[col];
        if (!id) {
          return null;
        }
        const letter = tilesRef.current[id]?.letter ?? "";
        if (letter !== word[index]) {
          return null;
        }
        if (visited.has(id)) {
          return null;
        }
        const nextPath = [...path, id];
        if (index === word.length - 1) {
          return nextPath;
        }
        visited.add(id);
        const directions = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        for (const [dr, dc] of directions) {
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (
            nextRow >= 0 &&
            nextRow < ROWS &&
            nextCol >= 0 &&
            nextCol < COLS
          ) {
            const result = dfs(nextRow, nextCol, index + 1, nextPath);
            if (result) {
              visited.delete(id);
              return result;
            }
          }
        }
        visited.delete(id);
        return null;
      };

      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          const result = dfs(row, col, 0, []);
          if (result) {
            return result;
          }
        }
      }
      return null;
    },
    [grid, mode],
  );

  const resetBoard = useCallback(
    (words: string[], nextMessage: string, modeOverride?: Mode) => {
      const board = buildBoard(words, modeOverride ?? mode);
      tilesRef.current = board.tiles;
      setGrid(board.grid);
      setSelected([]);
      setClearing([]);
      setHintPath([]);
      setLocked(false);
      setIsDragging(false);
      setMessage(nextMessage);
    },
    [mode],
  );

  const handleHint = () => {
    if (lockedRef.current) {
      return;
    }
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
    }
    if (!targetWord) {
      setMessage("All words found. Shuffle for a new board.");
      return;
    }
    const path = findWordPath(targetWord);
    if (!path) {
      setMessage("No hint available. Shuffle to try again.");
      return;
    }
    setHintPath(path);
    setSelected([]);
    setMessage("Hint: follow the blue glow.");
    hintTimerRef.current = window.setTimeout(() => {
      setHintPath([]);
      hintTimerRef.current = null;
    }, 1500);
  };

  const handleShuffle = () => {
    if (lockedRef.current) {
      return;
    }
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    const nextWords =
      remainingWords.length > 0 ? remainingWords : pickWords();
    if (remainingWords.length === 0) {
      setWordList(nextWords);
      setRemainingWords(nextWords);
      setEarned([]);
    }
    resetBoard(nextWords, "Shuffled! Words rehung in the grid.");
  };

  const handleModeChange = (nextMode: Mode) => {
    if (mode === nextMode || lockedRef.current) {
      return;
    }
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setMode(nextMode);
    const nextWords =
      remainingWords.length > 0 ? remainingWords : pickWords();
    if (remainingWords.length === 0) {
      setWordList(nextWords);
      setRemainingWords(nextWords);
      setEarned([]);
    }
    resetBoard(
      nextWords,
      nextMode === "line"
        ? "Mode: row/column words only."
        : "Mode: free path words.",
      nextMode,
    );
  };

  const boardWidth = COLS * TILE_SIZE + (COLS - 1) * TILE_GAP;
  const boardHeight = ROWS * TILE_SIZE + (ROWS - 1) * TILE_GAP;
  const boardShellWidth = boardWidth + 48;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#133B63] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b6aa4,transparent_55%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,#f8d35b33,transparent_50%)]" />
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#244c7b] blur-3xl" />
      <div className="absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-[#1a2f57] blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
              ⚙️
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
              …
            </button>
          </div>

          <div className="rounded-full bg-white/15 px-8 py-3 text-center text-lg uppercase tracking-[0.2em] text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
            Fruits
          </div>

          <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
            <span className="text-2xl">🪙</span>
            <span className="text-lg font-semibold">120</span>
            <button className="ml-2 rounded-full bg-[#f7d35f] px-3 py-1 text-sm font-semibold text-[#3b2f12] shadow">
              +
            </button>
            <button
              onClick={handleHint}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
              aria-label="Hint"
            >
              💡
            </button>
            <button
              onClick={handleShuffle}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
              aria-label="Shuffle"
            >
              🔀
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-[#c5a43a] px-8 py-2 text-2xl font-semibold tracking-[0.3em] text-[#2a220f] shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
              {targetWord ?? "ALL FOUND"}
            </div>
            <div className="max-w-md rounded-2xl border border-white/20 bg-[#171a3b]/80 px-6 py-4 text-center text-base text-white/80 shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
              <p className="leading-relaxed">
                {message}{" "}
                {targetWord
                  ? `Make ${targetWord} to clear tiles, drop the stack, and pull columns toward the center.`
                  : "Shuffle to deal a fresh set of hidden words."}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-end lg:justify-center">
            <div className="flex w-full max-w-sm flex-col gap-3">
              <div className="rounded-2xl bg-white/10 px-5 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Settings
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleModeChange("path")}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                      mode === "path"
                        ? "bg-[#f7d35f] text-[#2a220f]"
                        : "bg-white/15 text-white/70 hover:bg-white/25"
                    }`}
                  >
                    Path
                  </button>
                  <button
                    onClick={() => handleModeChange("line")}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                      mode === "line"
                        ? "bg-[#f7d35f] text-[#2a220f]"
                        : "bg-white/15 text-white/70 hover:bg-white/25"
                    }`}
                  >
                    Row/Col
                  </button>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Current word
                </p>
                <p className="mt-2 text-3xl font-[var(--font-display)] text-[#f7d35f]">
                  {selectedWord || "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Hidden words
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wordList.length === 0 ? (
                    <span className="text-sm text-white/60">
                      Loading words
                    </span>
                  ) : (
                    wordList.map((word) => {
                      const found = foundWords.includes(word);
                      return (
                        <span
                          key={word}
                          className={`rounded-full px-3 py-1 text-sm font-semibold tracking-[0.2em] ${
                            found
                              ? "bg-white/10 text-white/40 line-through"
                              : "bg-white/20 text-white/80"
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Found
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {earned.length === 0 ? (
                    <span className="text-sm text-white/60">
                      No words yet
                    </span>
                  ) : (
                    earned.map((word) => (
                      <span
                        key={word}
                        className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold tracking-[0.2em] text-white/80"
                      >
                        {word}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="relative" style={{ width: boardShellWidth }}>
              <div
                ref={boardRef}
                onPointerMove={handleBoardPointerMove}
                className="relative touch-none rounded-[30px] bg-white/5 p-6 shadow-[0_24px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/15"
              >
                <div
                  className="relative"
                  style={{ width: boardWidth, height: boardHeight }}
                >
                  {tilesInPlay.map((tile) => {
                    const isSelected = selected.includes(tile.id);
                    const isClearing = clearing.includes(tile.id);
                    const isHinted = hintPath.includes(tile.id);
                    const x = tile.col * (TILE_SIZE + TILE_GAP);
                    const y = tile.row * (TILE_SIZE + TILE_GAP);
                    return (
                      <button
                        key={tile.id}
                        data-tile-id={tile.id}
                        onPointerDown={() => handlePointerDown(tile.id)}
                        onPointerEnter={() => extendSelection(tile.id)}
                        className={`absolute flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl text-2xl font-semibold shadow-[0_8px_16px_rgba(0,0,0,0.35)] transition-transform duration-300 ${
                          isClearing
                            ? "scale-90 bg-[#f7d35f]/70 text-[#2a220f] opacity-40"
                            : isSelected
                              ? "bg-[#f7d35f] text-[#2a220f]"
                              : "bg-[#c9c7bf] text-[#1d1b15]"
                        } ${isHinted ? "ring-4 ring-[#74d3ff]" : ""}`}
                        style={{
                          transform: `translate3d(${x}px, ${y}px, 0)`,
                        }}
                      >
                        {tile.letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.4em] text-white/50">
            <span>Drag to select</span>
            <span>Release to drop</span>
            <span>Columns pull inward</span>
          </div>
        </main>
      </div>
    </div>
  );
}
