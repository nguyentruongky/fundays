"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

type Cell = string | null;
type Tile = { id: string; letter: string };
type Mode = "path" | "line";

const ROWS = 7;
const COLS = 6;
const BASE_TILE_SIZE = 76;
const BASE_TILE_GAP = 12;
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
const WORD_COUNT = 10;
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

const createInitialGame = () => {
  let words = pickWords();
  let board = buildBoard(words, "path");
  let attempts = 0;
  while (!board && attempts < 8) {
    words = pickWords();
    board = buildBoard(words, "path");
    attempts += 1;
  }
  if (!board) {
    words = ["PEAR", "LIME", "PLUM"];
    board = buildBoard(words, "path");
  }
  if (!board) {
    words = ["PEAR"];
    board = buildBoard(words, "path");
  }
  return { words, board: board! };
};

const findPlacement = (grid: (string | null)[][], word: string, mode: Mode) => {
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
        if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLS) {
          continue;
        }
        const path: Array<{ row: number; col: number }> = [];
        let valid = true;
        for (let i = 0; i < word.length; i += 1) {
          const nextRow = row + dr * i;
          const nextCol = col + dc * i;
          if (grid[nextRow][nextCol]) {
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
    if (cellLetter) {
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
      if (nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) {
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
      row.map(
        (cell) => cell ?? LETTERS[Math.floor(Math.random() * LETTERS.length)],
      ),
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
  return null;
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
  const initialGameRef = useRef(createInitialGame());
  const initialWordsRef = useRef(initialGameRef.current.words);
  const initialBoardRef = useRef(initialGameRef.current.board);
  const tilesRef = useRef(initialBoardRef.current.tiles);
  const boardRef = useRef<HTMLDivElement>(null);
  const hintTimerRef = useRef<number | null>(null);
  const [wordInput, setWordInput] = useState(
    initialWordsRef.current.join(", "),
  );

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tileSize, setTileSize] = useState(BASE_TILE_SIZE);
  const [tileGap, setTileGap] = useState(BASE_TILE_GAP);

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

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    const updateSizing = () => {
      const padding = 48;
      const availableWidth = Math.max(280, window.innerWidth - padding);
      const desiredBoardWidth =
        COLS * BASE_TILE_SIZE + (COLS - 1) * BASE_TILE_GAP;
      const desiredShellWidth = desiredBoardWidth + 48;
      const scale = Math.min(1, availableWidth / desiredShellWidth);
      const minTile = 40;
      const minGap = 6;
      setTileSize(Math.max(minTile, Math.floor(BASE_TILE_SIZE * scale)));
      setTileGap(Math.max(minGap, Math.floor(BASE_TILE_GAP * scale)));
    };
    updateSizing();
    window.addEventListener("resize", updateSizing);
    return () => window.removeEventListener("resize", updateSizing);
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
        setGrid((prev) => applyRemoval(prev, removed));
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
      if (!board) {
        setMessage("Couldn't place all words. Try fewer or shorter words.");
        return false;
      }
      tilesRef.current = board.tiles;
      setGrid(board.grid);
      setSelected([]);
      setClearing([]);
      setHintPath([]);
      setLocked(false);
      setIsDragging(false);
      setMessage(nextMessage);
      return true;
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
    const nextWords = remainingWords.length > 0 ? remainingWords : pickWords();
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
    const nextWords = remainingWords.length > 0 ? remainingWords : pickWords();
    if (remainingWords.length === 0) {
      setWordList(nextWords);
      setRemainingWords(nextWords);
      setEarned([]);
    }
    const success = resetBoard(
      nextWords,
      nextMode === "line"
        ? "Mode: row/column words only."
        : "Mode: free path words.",
      nextMode,
    );
    if (success) {
      setMode(nextMode);
    }
  };

  const parseWords = useCallback(
    (input: string) => {
      const tokens = input.toUpperCase().match(/[A-Z]+/g) ?? [];
      const maxLen = mode === "line" ? Math.max(ROWS, COLS) : ROWS * COLS;
      const unique: string[] = [];
      const seen = new Set<string>();
      tokens.forEach((token) => {
        if (token.length < 2 || token.length > maxLen) {
          return;
        }
        if (!seen.has(token)) {
          seen.add(token);
          unique.push(token);
        }
      });
      let warning: string | null = null;
      const maxWords = 10;
      if (unique.length > maxWords) {
        warning = `Using first ${maxWords} words.`;
      }
      return { words: unique.slice(0, maxWords), warning };
    },
    [mode],
  );

  const handleGenerate = () => {
    if (lockedRef.current) {
      return;
    }
    const { words, warning } = parseWords(wordInput);
    if (words.length === 0) {
      setMessage(
        "Enter at least one word (A-Z). Shorter words are easier to place.",
      );
      return;
    }
    const success = resetBoard(words, warning ?? "New board generated.");
    if (!success) {
      return;
    }
    setWordList(words);
    setRemainingWords(words);
    setEarned([]);
    setWordInput(words.join(", "));
  };

  const boardWidth = COLS * tileSize + (COLS - 1) * tileGap;
  const boardHeight = ROWS * tileSize + (ROWS - 1) * tileGap;
  const boardShellWidth = boardWidth + 48;
  const score = foundWords.length * 120;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1726] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#21406a,transparent_55%)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_85%,#f7d35f40,transparent_55%)]" />
      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#173053] blur-3xl" />
      <div className="absolute -bottom-20 right-6 h-72 w-72 rounded-full bg-[#0f2442] blur-3xl" />
      <div className="absolute right-1/3 top-16 h-24 w-24 rounded-3xl bg-[#f7d35f]/20 blur-2xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-8">
        <header className="relative flex items-center justify-between">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] transition hover:bg-white/20"
            aria-label="Open settings"
          >
            ⚙️
          </button>

          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-6 py-2 text-center text-xs font-semibold uppercase tracking-[0.4em] text-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
            Fruits
          </div>

          <div className="rounded-full bg-white/10 px-5 py-2 text-center text-xl font-semibold uppercase tracking-[0.25em] text-[#f7d35f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
            {score} pts
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-10">
          <div
            className="relative w-full max-w-full"
            style={{ width: boardShellWidth }}
          >
            <div
              ref={boardRef}
              onPointerMove={handleBoardPointerMove}
              className="relative touch-none rounded-[34px] bg-white/5 p-6 shadow-[0_24px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/20"
            >
              <div
                className="relative"
                style={{ width: boardWidth, height: boardHeight }}
              >
                {tilesInPlay.map((tile) => {
                  const isSelected = selected.includes(tile.id);
                  const isClearing = clearing.includes(tile.id);
                  const isHinted = hintPath.includes(tile.id);
                  const x = tile.col * (tileSize + tileGap);
                  const y = tile.row * (tileSize + tileGap);
                  return (
                    <button
                      key={tile.id}
                      data-tile-id={tile.id}
                      onPointerDown={() => handlePointerDown(tile.id)}
                      onPointerEnter={() => extendSelection(tile.id)}
                      className={`absolute flex touch-none select-none items-center justify-center rounded-2xl font-semibold shadow-[0_10px_18px_rgba(0,0,0,0.35)] transition-transform duration-300 ${
                        isClearing
                          ? "scale-90 bg-[#f7d35f]/70 text-[#2a220f] opacity-40"
                          : isSelected
                            ? "bg-[#f7d35f] text-[#2a220f]"
                            : "bg-[#d7d3c8] text-[#1d1b15]"
                      } ${isHinted ? "ring-4 ring-[#74d3ff]" : ""}`}
                      style={{
                        width: tileSize,
                        height: tileSize,
                        fontSize: Math.max(18, Math.round(tileSize * 0.45)),
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

          <p className="mt-6 text-xs uppercase tracking-[0.4em] text-white/45">
            Drag to select. Release to drop.
          </p>
        </main>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-30 flex items-start justify-center bg-[#08121f]/80 px-6 py-10 backdrop-blur">
          <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#0f2238]/95 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Settings
                </p>
                <p className="text-2xl font-[var(--font-display)] text-[#f7d35f]">
                  Words Drop
                </p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:bg-white/20"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl bg-white/5 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Target word
                </p>
                <p className="mt-2 text-3xl font-[var(--font-display)] text-white">
                  {targetWord ?? "All found"}
                </p>
                <p className="mt-3 text-sm text-white/70">
                  {message}{" "}
                  {targetWord
                    ? `Make ${targetWord} to clear tiles, drop the stack, and pull columns inward.`
                    : "Shuffle for a new set of hidden words."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleHint}
                    className="rounded-full bg-[#74d3ff]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#bfeaff] transition hover:bg-[#74d3ff]/30"
                  >
                    Hint
                  </button>
                  <button
                    onClick={handleShuffle}
                    className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/20"
                  >
                    Shuffle
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Mode
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleModeChange("path")}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                      mode === "path"
                        ? "bg-[#f7d35f] text-[#2a220f]"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    Path
                  </button>
                  <button
                    onClick={() => handleModeChange("line")}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                      mode === "line"
                        ? "bg-[#f7d35f] text-[#2a220f]"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    Row/Col
                  </button>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/50">
                  {mode === "line"
                    ? `Max length ${Math.max(ROWS, COLS)} in row/col mode.`
                    : "Paths can turn. Use short words for best fit."}
                </p>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                    Current word
                  </p>
                  <p className="mt-2 text-2xl font-[var(--font-display)] text-[#f7d35f]">
                    {selectedWord || "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] lg:col-span-2">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Word list
                </p>
                <textarea
                  value={wordInput}
                  onChange={(event) => setWordInput(event.target.value)}
                  placeholder="apple, pear, lime"
                  rows={3}
                  className="mt-3 w-full resize-none rounded-xl bg-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#74d3ff]/70"
                />
                <button
                  onClick={handleGenerate}
                  className="mt-3 w-full rounded-xl bg-[#f7d35f] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#2a220f] transition hover:brightness-95"
                >
                  Generate board
                </button>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                    Hidden words
                  </p>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                    Found {foundWords.length}/{wordList.length}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wordList.length === 0 ? (
                    <span className="text-sm text-white/60">Loading words</span>
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

              <div className="rounded-2xl bg-white/5 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] lg:col-span-2">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Found words
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {earned.length === 0 ? (
                    <span className="text-sm text-white/60">No words yet</span>
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
