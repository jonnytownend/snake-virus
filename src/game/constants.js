export const TARGET_SEQUENCE = [
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ";",
  "=",
  "<",
  ">",
  "a",
  "e",
  "i",
  "o",
  "u",
  "s",
  "r",
  "t",
  "n",
  "l",
  "c",
  "d",
  "m",
  "f"
];
export const HAZARD_SEQUENCE = [
  ":",
  ".",
  ",",
  "\"",
  "'",
  "`",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9"
];

export const CORRUPTION_CHARS = [
  "#",
  "@",
  "%",
  "&",
  "*",
  "?",
  "!",
  "+",
  "=",
  "~",
  "$",
  "^",
  "/",
  "\\",
  "|",
  "<",
  ">",
  "_"
];
export const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "class", "new", "true", "false", "null", "undefined", "switch", "case",
  "break", "continue", "try", "catch", "finally", "import", "from", "export"
]);

export const GRID = Object.freeze({
  width: 72,
  height: 30
});

export const TARGETS = Object.freeze({
  minChars: 2,
  maxChars: 4,
  charGrowthStep: 22,
  perCharBase: 8,
  perCharMax: 20,
  perCharScoreStep: 120,
  baseQuota: 8,
  maxQuota: 20,
  scoreStep: 70
});

export const HAZARDS = Object.freeze({
  unlockAtEaten: 8,
  baseCount: 4,
  growthStep: 6,
  maxCount: 100
});

export const SPEED = Object.freeze({
  baseDelayMs: 180,
  minDelayMs: 60,
  maxMultiplier: 2.75,
  increasePerEat: 0.03
});

export const STAGES = Object.freeze({
  corruptionsPerLevel: 10
});

export const START_DIRECTION = Object.freeze({ x: 1, y: 0 });

export const UI_TEXT = Object.freeze({
  ready: "Press Space to unleash Snake Virus.",
  fullCorruption: "System fully corrupted. Press Space to replay.",
  fullCorruptionReset: "System fully corrupted. Press Space to run again.",
  crash: "Virus crashed. Press Space to re-run.",
  hazardCrash: "Virus hit protected code. Press Space to re-run.",
  corruptionCrash: "Virus consumed corrupted code. Press Space to re-run."
});
