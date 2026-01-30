"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent } from "react";

type Cell = string | null;
type Tile = { id: string; letter: string };
type Mode = "path" | "line";
type Topic = { name: string; words: string[] };

const BASE_TILE_SIZE = 76;
const BASE_TILE_GAP = 12;
const WORD_COUNT = 10;
const ACTIVE_WORD_LIMIT = 2;

const TOPIC_LIBRARY: Topic[] = [
  {
    name: "Fruits",
    words: [
      "APPLE",
      "BANANA",
      "CHERRY",
      "GRAPE",
      "LEMON",
      "MANGO",
      "ORANGE",
      "PEACH",
      "PEAR",
      "PLUM",
    ],
  },
  {
    name: "Vegetables",
    words: [
      "BEET",
      "CARROT",
      "CELERY",
      "GARLIC",
      "ONION",
      "PEPPER",
      "POTATO",
      "RADISH",
      "SPINACH",
      "TOMATO",
    ],
  },
  {
    name: "Animals",
    words: [
      "CAT",
      "DOG",
      "HORSE",
      "LION",
      "MOUSE",
      "PANDA",
      "RABBIT",
      "TIGER",
      "WHALE",
      "ZEBRA",
    ],
  },
  {
    name: "Birds",
    words: [
      "EAGLE",
      "FALCON",
      "FINCH",
      "GULL",
      "HAWK",
      "HERON",
      "OWL",
      "ROBIN",
      "SPARROW",
      "SWAN",
    ],
  },
  {
    name: "Colors",
    words: [
      "AMBER",
      "BLUE",
      "CORAL",
      "GREEN",
      "IVORY",
      "OLIVE",
      "PINK",
      "PURPLE",
      "SILVER",
      "TEAL",
    ],
  },
  {
    name: "Weather",
    words: [
      "BREEZE",
      "CLOUD",
      "FROST",
      "HAZE",
      "RAIN",
      "SLEET",
      "SNOW",
      "STORM",
      "SUN",
      "WIND",
    ],
  },
  {
    name: "Household",
    words: [
      "BROOM",
      "CHAIR",
      "CLOCK",
      "COUCH",
      "DRESSER",
      "LAMP",
      "PILLOW",
      "RUG",
      "SHELF",
      "TABLE",
    ],
  },
  {
    name: "Kitchen",
    words: [
      "BOWL",
      "FORK",
      "GLASS",
      "KNIFE",
      "LADLE",
      "MUG",
      "PAN",
      "PLATE",
      "SPOON",
      "TOASTER",
    ],
  },
  {
    name: "Clothing",
    words: [
      "BELT",
      "COAT",
      "DRESS",
      "GLOVE",
      "HAT",
      "JACKET",
      "PANTS",
      "SCARF",
      "SHIRT",
      "SOCK",
    ],
  },
  {
    name: "Footwear",
    words: [
      "BOOT",
      "CLOG",
      "HEEL",
      "LOAFER",
      "MOC",
      "RUNNER",
      "SANDAL",
      "SHOE",
      "SNEAKER",
      "SLIPPER",
    ],
  },
  {
    name: "School",
    words: [
      "BOOK",
      "CLASS",
      "DESK",
      "EXAM",
      "GRADE",
      "LESSON",
      "PENCIL",
      "QUIZ",
      "STUDY",
      "TEACHER",
    ],
  },
  {
    name: "Office",
    words: [
      "BADGE",
      "BRIEF",
      "AGENDA",
      "DESK",
      "EMAIL",
      "FILE",
      "MEETING",
      "NOTES",
      "PRINTER",
      "REPORT",
    ],
  },
  {
    name: "Sports",
    words: [
      "BALL",
      "BAT",
      "COURT",
      "GOAL",
      "HOOP",
      "RACE",
      "RINK",
      "SCORE",
      "SWIM",
      "TRACK",
    ],
  },
  {
    name: "Transport",
    words: [
      "BIKE",
      "BOAT",
      "BUS",
      "CAR",
      "FERRY",
      "PLANE",
      "SUBWAY",
      "TAXI",
      "TRAIN",
      "TRAM",
    ],
  },
  {
    name: "City",
    words: [
      "AVENUE",
      "BRIDGE",
      "ALLEY",
      "MARKET",
      "METRO",
      "PARK",
      "PLAZA",
      "STREET",
      "TOWER",
      "TUNNEL",
    ],
  },
  {
    name: "Nature",
    words: [
      "CLIFF",
      "FOREST",
      "GLEN",
      "HILL",
      "LAKE",
      "MEADOW",
      "OCEAN",
      "RIVER",
      "STONE",
      "VALLEY",
    ],
  },
  {
    name: "Body",
    words: [
      "ARM",
      "BACK",
      "BONE",
      "EAR",
      "FACE",
      "HAND",
      "HEART",
      "LEG",
      "SKIN",
      "TOOTH",
    ],
  },
  {
    name: "Family",
    words: [
      "AUNT",
      "BABY",
      "BROTHER",
      "COUSIN",
      "CHILD",
      "FATHER",
      "MOTHER",
      "SISTER",
      "SON",
      "UNCLE",
    ],
  },
  {
    name: "Emotions",
    words: [
      "ANGRY",
      "BRAVE",
      "CALM",
      "EAGER",
      "HAPPY",
      "PROUD",
      "QUIET",
      "SAD",
      "SHY",
      "WARM",
    ],
  },
  {
    name: "Music",
    words: [
      "ALBUM",
      "BAND",
      "BEAT",
      "CHORD",
      "DRUM",
      "GUITAR",
      "MELODY",
      "NOTE",
      "PIANO",
      "RHYTHM",
    ],
  },
  {
    name: "Technology",
    words: [
      "APP",
      "CABLE",
      "CHIP",
      "CLOUD",
      "CODE",
      "DATA",
      "DEVICE",
      "SCREEN",
      "SERVER",
      "WIRE",
    ],
  },
  {
    name: "Travel",
    words: [
      "BAG",
      "BOARD",
      "HOTEL",
      "MAP",
      "VISA",
      "ROUTE",
      "STAMP",
      "LUGGAGE",
      "TICKET",
      "TOUR",
    ],
  },
  {
    name: "Beach",
    words: [
      "SAND",
      "SHELL",
      "SURF",
      "TIDE",
      "WAVE",
      "SUNSET",
      "PIER",
      "CANOPY",
      "DRIFT",
      "DUNE",
    ],
  },
  {
    name: "Space",
    words: [
      "ASTRO",
      "COMET",
      "EARTH",
      "GALAXY",
      "METEOR",
      "MOON",
      "ORBIT",
      "ROCKET",
      "SATURN",
      "STAR",
    ],
  },
  {
    name: "Time",
    words: [
      "ALARM",
      "CLOCK",
      "DAWN",
      "HOUR",
      "MINUTE",
      "MONTH",
      "NIGHT",
      "NOON",
      "SEASON",
      "WEEK",
    ],
  },
  {
    name: "Tools",
    words: [
      "AXE",
      "DRILL",
      "FILE",
      "HAMMER",
      "LEVEL",
      "NAIL",
      "PLIERS",
      "SAW",
      "SCREW",
      "WRENCH",
    ],
  },
  {
    name: "Health",
    words: [
      "BANDAGE",
      "CLINIC",
      "DOCTOR",
      "WORKOUT",
      "HEART",
      "MEDIC",
      "NURSE",
      "PAIN",
      "REST",
      "VITAMIN",
    ],
  },
  {
    name: "Holidays",
    words: [
      "BANNER",
      "CANDLE",
      "FAMILY",
      "FESTIVE",
      "GIFT",
      "PARTY",
      "PARADE",
      "TRIP",
      "WISH",
      "WRAP",
    ],
  },
];

const pickRandomTopic = (exclude?: Topic) => {
  if (TOPIC_LIBRARY.length === 0) {
    throw new Error("No topics available");
  }
  if (!exclude || TOPIC_LIBRARY.length === 1) {
    return TOPIC_LIBRARY[0];
  }
  let candidate = exclude;
  while (candidate.name === exclude.name) {
    candidate =
      TOPIC_LIBRARY[Math.floor(Math.random() * TOPIC_LIBRARY.length)];
    if (TOPIC_LIBRARY.length === 1) {
      break;
    }
  }
  return candidate;
};

const shuffleArray = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const pickWords = (words: string[]) => {
  return shuffleArray(words).slice(0, WORD_COUNT);
};

const computeGridLayout = (words: string[], mode: Mode) => {
  const totalLetters = words.reduce((sum, word) => sum + word.length, 0);
  const maxWordLength = words.reduce(
    (max, word) => Math.max(max, word.length),
    0,
  );
  let cols = Math.ceil(Math.sqrt(totalLetters));
  if (mode === "line" && maxWordLength > cols) {
    cols = maxWordLength;
  }
  const rows = Math.ceil(totalLetters / cols);
  const rowLengths = Array.from({ length: rows }, () => cols);
  return { rows, cols, rowLengths };
};

const createLetterGrid = (rows: number, cols: number): (string | null)[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

const createInitialGame = () => {
  const topicPool = TOPIC_LIBRARY;
  const mode: Mode = "line";
  for (let attempts = 0; attempts < 12; attempts += 1) {
    const topic = topicPool[Math.floor(Math.random() * topicPool.length)];
    const words = pickWords(topic.words);
    const layout = computeGridLayout(words, mode);
    const board = buildBoard(
      words,
      mode,
      layout.rows,
      layout.cols,
      layout.rowLengths,
    );
    if (board) {
      return { topic, words, board };
    }
  }
  const fallbackTopic = topicPool[0];
  const fallbackWords = pickWords(fallbackTopic.words);
  const fallbackLayout = computeGridLayout(fallbackWords, mode);
  const fallbackBoard = buildBoard(
    fallbackWords,
    mode,
    fallbackLayout.rows,
    fallbackLayout.cols,
    fallbackLayout.rowLengths,
  );
  if (fallbackBoard) {
    return { topic: fallbackTopic, words: fallbackWords, board: fallbackBoard };
  }
  return {
    topic: fallbackTopic,
    words: fallbackWords,
    board: buildLinearBoard(fallbackWords),
  };
};

const isValidCell = (
  row: number,
  col: number,
  rowLengths: number[],
) => col >= 0 && row >= 0 && row < rowLengths.length && col < rowLengths[row];

const findPlacement = (
  grid: (string | null)[][],
  word: string,
  mode: Mode,
  rows: number,
  cols: number,
  rowLengths: number[],
) => {
  const positions = shuffleArray(
    Array.from({ length: rows * cols }, (_, index) => index),
  );

  const directions: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  if (mode === "line") {
    for (const flatIndex of positions) {
      const row = Math.floor(flatIndex / cols);
      const col = flatIndex % cols;
      if (!isValidCell(row, col, rowLengths)) {
        continue;
      }
      const shuffledDirections = shuffleArray(directions);
      for (const [dr, dc] of shuffledDirections) {
        const endRow = row + dr * (word.length - 1);
        const endCol = col + dc * (word.length - 1);
        if (endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols) {
          continue;
        }
        const path: Array<{ row: number; col: number }> = [];
        let valid = true;
        for (let i = 0; i < word.length; i += 1) {
          const nextRow = row + dr * i;
          const nextCol = col + dc * i;
          if (!isValidCell(nextRow, nextCol, rowLengths)) {
            valid = false;
            break;
          }
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
    if (!isValidCell(row, col, rowLengths)) {
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
      if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
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
    const row = Math.floor(flatIndex / cols);
    const col = flatIndex % cols;
    if (!isValidCell(row, col, rowLengths)) {
      continue;
    }
    const result = dfs(row, col, 0, new Set(), []);
    if (result) {
      return result;
    }
  }
  return null;
};

const buildBoard = (
  words: string[],
  mode: Mode,
  rows: number,
  cols: number,
  rowLengths: number[],
) => {
  const ordered = [...words].sort((a, b) => b.length - a.length);
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const grid = createLetterGrid(rows, cols);
    let placedAll = true;
    for (const word of ordered) {
      const placement = findPlacement(
        grid,
        word,
        mode,
        rows,
        cols,
        rowLengths,
      );
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
    let idCounter = 0;
    const tiles: Record<string, Tile> = {};
    const idGrid: Cell[][] = grid.map((row, rowIndex) =>
      row.map((letter, colIndex) => {
        if (!letter || !isValidCell(rowIndex, colIndex, rowLengths)) {
          return null;
        }
        const id = `tile-${idCounter++}`;
        tiles[id] = { id, letter };
        return id;
      }),
    );
    const normalizedGrid = normalizeGrid(idGrid, rows, cols, rowLengths);
    return { grid: normalizedGrid, tiles, rows, cols, rowLengths };
  }
  return null;
};

const buildLinearBoard = (words: string[]) => {
  const rows = Math.max(words.length, 1);
  const cols =
    Math.max(
      words.reduce((max, word) => Math.max(max, word.length), 0),
      1,
    );
  const rowLengths = Array.from({ length: rows }, (_, rowIndex) =>
    words[rowIndex]?.length ?? 0,
  );
  const tiles: Record<string, Tile> = {};
  let idCounter = 0;
  const grid = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => {
      const letters = words[rowIndex] ?? "";
      if (colIndex >= letters.length) {
        return null;
      }
      const id = `tile-${idCounter++}`;
      tiles[id] = { id, letter: letters[colIndex] };
      return id;
    }),
  );
  return { grid, tiles, rows, cols, rowLengths };
};

const normalizeGrid = (
  grid: Cell[][],
  rows: number,
  cols: number,
  rowLengths: number[],
) => {
  const columns: string[][] = [];
  const validRowsByCol: number[][] = [];
  for (let col = 0; col < cols; col += 1) {
    const validRows: number[] = [];
    const stack: string[] = [];
    for (let row = rows - 1; row >= 0; row -= 1) {
      if (!isValidCell(row, col, rowLengths)) {
        continue;
      }
      validRows.push(row);
      const id = grid[row][col];
      if (id) {
        stack.push(id);
      }
    }
    columns.push(stack);
    validRowsByCol.push(validRows);
  }

  const orderedColumnsWithRows = columns.map((column, index) => ({
    column,
    validRows: validRowsByCol[index] ?? [],
  }));

  const nextGrid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );
  orderedColumnsWithRows.forEach(({ column, validRows }, col) => {
    column.forEach((id, index) => {
      const row = validRows[index];
      if (row !== undefined) {
        nextGrid[row][col] = id;
      }
    });
  });

  return nextGrid;
};

const applyRemoval = (
  grid: Cell[][],
  removed: Set<string>,
  rows: number,
  cols: number,
  rowLengths: number[],
) => {
  const pruned = grid.map((row) =>
    row.map((id) => (id && !removed.has(id) ? id : null)),
  );
  return normalizeGrid(pruned, rows, cols, rowLengths);
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("line");
  const initialGame = useMemo(() => createInitialGame(), []);
  const initialWords = initialGame.words;
  const initialBoard = initialGame.board;
  const initialTopic = initialGame.topic;
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [rows, setRows] = useState(initialBoard.rows);
  const [cols, setCols] = useState(initialBoard.cols);
  const [rowLengths, setRowLengths] = useState(initialBoard.rowLengths);
  const [tiles, setTiles] = useState<Record<string, Tile>>(initialBoard.tiles);
  const boardRef = useRef<HTMLDivElement>(null);
  const hintTimerRef = useRef<number | null>(null);
  const [wordInput, setWordInput] = useState(initialWords.join(", "));
  const needsNormalizationRef = useRef(true);

  const [grid, setGrid] = useState<Cell[][]>(initialBoard.grid);
  const [wordList, setWordList] = useState<string[]>(initialWords);
  const [remainingWords, setRemainingWords] = useState<string[]>(initialWords);
  const [activeCount, setActiveCount] = useState(
    Math.min(1, initialWords.length),
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
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [tileSize, setTileSize] = useState(BASE_TILE_SIZE);
  const [tileGap, setTileGap] = useState(BASE_TILE_GAP);
  const [tileOffsets, setTileOffsets] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const selectedRef = useRef(selected);
  const lockedRef = useRef(locked);
  const targetWord = remainingWords[0] ?? null;
  const prevPositionsRef = useRef<Record<string, { row: number; col: number }>>(
    {},
  );

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

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
        cols * BASE_TILE_SIZE + (cols - 1) * BASE_TILE_GAP;
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
  }, [cols]);

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

  const columnLayout = useMemo(() => {
    const seen = new Set<number>();
    const columns: number[] = [];
    grid.forEach((row) => {
      row.forEach((id, colIndex) => {
        if (id && !seen.has(colIndex)) {
          seen.add(colIndex);
          columns.push(colIndex);
        }
      });
    });
    if (columns.length === 0) {
      return { map: {}, count: 1 };
    }
    columns.sort((a, b) => a - b);
    const map: Record<number, number> = {};
    columns.forEach((column, index) => {
      map[column] = index;
    });
    return { map, count: Math.max(columns.length, 1) };
  }, [grid]);

  const columnMap = columnLayout.map;
  const displayCols = columnLayout.count;

  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    const prev = prevPositionsRef.current;
    const nextOffsets: Record<string, { x: number; y: number }> = {};
    Object.entries(positions).forEach(([id, pos]) => {
      const prevPos = prev[id];
      if (!prevPos) {
        return;
      }
      const dy = (prevPos.row - pos.row) * (tileSize + tileGap);
      if (dy !== 0) {
        nextOffsets[id] = { x: 0, y: dy };
      }
    });
    prevPositionsRef.current = positions;
    if (Object.keys(nextOffsets).length === 0) {
      setTileOffsets({});
      return;
    }
    setTileOffsets(nextOffsets);
    const animationFrame = window.requestAnimationFrame(() => {
      setTileOffsets({});
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [positions, tileGap, tileSize]);

  useEffect(() => {
    if (!needsNormalizationRef.current) {
      return;
    }
    setGrid((prev) => normalizeGrid(prev, rows, cols, rowLengths));
    needsNormalizationRef.current = false;
  }, [grid, rows, cols, rowLengths]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
            letter: tiles[id]?.letter ?? "",
          });
        }
      });
    });
    return items;
  }, [grid, tiles]);

  const activeWords = useMemo(
    () => remainingWords.slice(0, activeCount),
    [activeCount, remainingWords],
  );

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
      setActiveCount((prev) => {
        if (nextRemaining.length === 0) {
          return 0;
        }
        if (prev >= ACTIVE_WORD_LIMIT) {
          return Math.min(prev, nextRemaining.length);
        }
        return Math.min(prev + 1, ACTIVE_WORD_LIMIT, nextRemaining.length);
      });

      const removed = new Set(selection);
      window.setTimeout(() => {
        setGrid((prev) => applyRemoval(prev, removed, rows, cols, rowLengths));
        setClearing([]);
        setLocked(false);
      }, 350);
    },
    [mode, remainingWords, rows, cols, rowLengths],
  );

  const finishSelection = useCallback(() => {
    if (!isDragging) {
      return;
    }
    const selection = selectedRef.current;
    setIsDragging(false);
    setSelected([]);
    setHintPath([]);
    const word = selection.map((id) => tiles[id]?.letter ?? "").join("");
    const reversedWord = word.split("").reverse().join("");
    const matchedWord = remainingWords.includes(word)
      ? word
      : remainingWords.includes(reversedWord)
        ? reversedWord
        : null;
    if (matchedWord) {
      clearWord(selection, matchedWord);
    } else if (word.length > 0) {
      setMessage("That word isn't hidden here.");
    }
  }, [clearWord, isDragging, remainingWords, tiles]);

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

  const selectedWord = selected.map((id) => tiles[id]?.letter ?? "").join("");

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
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            if (!isValidCell(row, col, rowLengths)) {
              continue;
            }
            const startId = grid[row]?.[col];
            if (!startId) {
              continue;
            }
            if ((tiles[startId]?.letter ?? "") !== word[0]) {
              continue;
            }
            for (const [dr, dc] of directions) {
              const endRow = row + dr * (word.length - 1);
              const endCol = col + dc * (word.length - 1);
              if (
                endRow < 0 ||
                endRow >= rows ||
                endCol < 0 ||
                endCol >= cols
              ) {
                continue;
              }
              const path: string[] = [];
              let valid = true;
              for (let i = 0; i < word.length; i += 1) {
                const nextRow = row + dr * i;
                const nextCol = col + dc * i;
                const id = grid[nextRow]?.[nextCol];
                if (!isValidCell(nextRow, nextCol, rowLengths) || !id) {
                  valid = false;
                  break;
                }
                const letter = tiles[id]?.letter ?? "";
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
        if (!isValidCell(row, col, rowLengths) || !id) {
          return null;
        }
              const letter = tiles[id]?.letter ?? "";
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
            nextRow < rows &&
            nextCol >= 0 &&
            nextCol < cols &&
            isValidCell(nextRow, nextCol, rowLengths)
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

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (!isValidCell(row, col, rowLengths)) {
            continue;
          }
          const result = dfs(row, col, 0, []);
          if (result) {
            return result;
          }
        }
      }
      return null;
    },
    [grid, mode, rows, cols, rowLengths, tiles],
  );

  const resetBoard = useCallback(
    (words: string[], nextMessage: string, modeOverride?: Mode) => {
      const nextMode = modeOverride ?? mode;
      const layout = computeGridLayout(words, nextMode);
      const board = buildBoard(
        words,
        nextMode,
        layout.rows,
        layout.cols,
        layout.rowLengths,
      );
      if (!board) {
        setMessage("Couldn't place all words. Try different words.");
        return false;
      }
      setTiles(board.tiles);
      setGrid(board.grid);
      setRows(board.rows);
      setCols(board.cols);
      setRowLengths(board.rowLengths);
      setSelected([]);
      setClearing([]);
      setHintPath([]);
      setLocked(false);
      setIsDragging(false);
      setVictoryOpen(false);
      setMessage(nextMessage);
      needsNormalizationRef.current = true;
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

  const handleShuffle = useCallback(
    (forceNewTopic = false) => {
      if (lockedRef.current) {
        return;
      }
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
      const shouldPickNewTopic = forceNewTopic || remainingWords.length === 0;
      const nextTopic = shouldPickNewTopic
        ? pickRandomTopic(topic)
        : topic;
      const nextWords =
        remainingWords.length > 0 && !forceNewTopic
          ? remainingWords
          : pickWords(nextTopic.words);
      if (shouldPickNewTopic) {
        setTopic(nextTopic);
        setWordList(nextWords);
        setRemainingWords(nextWords);
        setActiveCount(Math.min(1, nextWords.length));
        setEarned([]);
        setWordInput(nextWords.join(", "));
      }
      const nextMessage = shouldPickNewTopic
        ? `New board: ${nextTopic.name}`
        : "Shuffled! Words rehung in the grid.";
      resetBoard(nextWords, nextMessage);
    },
    [remainingWords, resetBoard, topic],
  );

  const victoryHandledRef = useRef(false);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (remainingWords.length > 0) {
      victoryHandledRef.current = false;
      return;
    }
    if (victoryHandledRef.current) {
      return;
    }
    victoryHandledRef.current = true;
    setMessage("All words found! Nice work.");
    setVictoryOpen(true);
    setSettingsOpen(false);
  }, [remainingWords]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleModeChange = (nextMode: Mode) => {
    if (mode === nextMode || lockedRef.current) {
      return;
    }
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    const nextWords =
      remainingWords.length > 0 ? remainingWords : pickWords(topic.words);
    if (remainingWords.length === 0) {
      setWordList(nextWords);
      setRemainingWords(nextWords);
      setActiveCount(Math.min(1, nextWords.length));
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
      const unique: string[] = [];
      const seen = new Set<string>();
      tokens.forEach((token) => {
        if (token.length < 2) {
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
    setTopic({ name: "Custom", words });
    setWordList(words);
    setRemainingWords(words);
    setActiveCount(Math.min(1, words.length));
    setEarned([]);
    setWordInput(words.join(", "));
  };

  const boardWidth = cols * tileSize + (cols - 1) * tileGap;
  const boardHeight = rows * tileSize + (rows - 1) * tileGap;
  const boardShellWidth = boardWidth + 48;
  const score = foundWords.length * 120;
  const horizontalOffset =
    ((cols - displayCols) / 2) * (tileSize + tileGap);

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
            {topic.name}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleHint}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] transition hover:bg-white/20"
              aria-label="Hint"
            >
              💡
            </button>
            <div className="rounded-full bg-white/10 px-5 py-2 text-center text-xl font-semibold uppercase tracking-[0.25em] text-[#f7d35f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
              {score} pts
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="mb-4 text-center text-2xl font-semibold uppercase tracking-[0.35em] text-white">
            {selectedWord || "—"}
          </div>
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
                  const columnIndex = columnMap[tile.col] ?? 0;
                  const x = columnIndex * (tileSize + tileGap) + horizontalOffset;
                  const y = tile.row * (tileSize + tileGap);
                  const scale = isClearing ? 0.2 : isSelected ? 1.05 : 1;
                  const rotate = isClearing ? -8 : 0;
                  const offset = tileOffsets[tile.id] ?? { x: 0, y: 0 };
                  const tileStyle = {
                    width: tileSize,
                    height: tileSize,
                    fontSize: Math.max(18, Math.round(tileSize * 0.45)),
                    transform:
                      "translate3d(calc(var(--tile-x) + var(--tile-offset-x)), calc(var(--tile-y) + var(--tile-offset-y)), 0) scale(var(--tile-scale)) rotate(var(--tile-rotate))",
                    ["--tile-x" as const]: `${x}px`,
                    ["--tile-y" as const]: `${y}px`,
                    ["--tile-offset-x" as const]: `${offset.x}px`,
                    ["--tile-offset-y" as const]: `${offset.y}px`,
                    ["--tile-scale" as const]: `${scale}`,
                    ["--tile-rotate" as const]: `${rotate}deg`,
                  } as React.CSSProperties;
                  return (
                    <button
                      key={tile.id}
                      data-tile-id={tile.id}
                      onPointerDown={() => handlePointerDown(tile.id)}
                      onPointerEnter={() => extendSelection(tile.id)}
                      className={`absolute flex touch-none select-none items-center justify-center rounded-2xl font-semibold shadow-[0_10px_18px_rgba(0,0,0,0.35)] transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                        isClearing
                          ? "bg-[#f7d35f]/70 text-[#2a220f] opacity-0 blur-[1px]"
                          : isSelected
                            ? "bg-[#f7d35f] text-[#2a220f]"
                            : "bg-[#d7d3c8] text-[#1d1b15]"
                      } ${isHinted ? "ring-4 ring-[#74d3ff]" : ""}`}
                      style={tileStyle}
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
          <p className="mt-2 text-sm text-center text-white/70">{message}</p>
        </main>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-30 flex items-start justify-center bg-[#08121f]/80 px-6 py-10 backdrop-blur">
          <div className="w-full max-w-3xl rounded-4xl border border-white/10 bg-[#0f2238]/95 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Settings
                </p>
                <p className="text-2xl font-(--font-display) text-[#f7d35f]">
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
                <p className="mt-2 text-3xl font-(--font-display) text-white">
                  {targetWord ?? "All found"}
                </p>
                <p className="mt-3 text-sm text-white/70">
                  {message}{" "}
                  {targetWord
                    ? `Make ${targetWord} to clear tiles and drop the stack.`
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
                    ? "Longest word sets the grid width."
                    : "Paths can turn. Grid scales to total letters."}
                </p>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                    Current word
                  </p>
                  <p className="mt-2 text-2xl font-(--font-display) text-[#f7d35f]">
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
                      const isActive = activeWords.includes(word);
                      const displayWord = word;
                      return (
                        <span
                          key={word}
                          className={`rounded-full px-3 py-1 text-sm font-semibold tracking-[0.2em] ${
                            found
                              ? "bg-white/10 text-white/40 line-through"
                              : isActive
                                ? "bg-[#74d3ff]/20 text-[#bfeaff]"
                                : "bg-white/10 text-white/50"
                          }`}
                        >
                          {displayWord}
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

      {victoryOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#08121f]/85 px-6 backdrop-blur">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0f2238]/95 p-6 text-center shadow-[0_30px_60px_rgba(0,0,0,0.55)]">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Game complete
            </p>
            <p className="mt-2 text-3xl font-(--font-display) text-[#f7d35f]">
              {topic.name} cleared
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.3em] text-white/70">
              Total score
            </p>
            <p className="text-5xl font-semibold text-white">{score}</p>
            <div className="mt-4 rounded-2xl bg-white/5 p-4 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                Found words
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {foundWords.map((word) => (
                  <span
                    key={word}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleShuffle(true)}
              className="mt-6 w-full rounded-full bg-[#f7d35f] px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#2a220f] transition hover:brightness-95"
            >
              Next game
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
