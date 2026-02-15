export const TARGET_SEQUENCE = ["{", "}", "(", ")", "[", "]", ";", "=", "<", ">"];
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
  maxActive: 16,
  baseQuota: 5,
  maxQuota: 10,
  scoreStep: 80
});

export const SPEED = Object.freeze({
  baseDelayMs: 180,
  minDelayMs: 60,
  maxMultiplier: 2.75,
  increasePerEat: 0.03
});

export const START_DIRECTION = Object.freeze({ x: 1, y: 0 });

export const UI_TEXT = Object.freeze({
  ready: "Press Space to deploy virus.",
  fullCorruption: "System fully corrupted. Press Space to replay.",
  fullCorruptionReset: "System fully corrupted. Press Space to run again.",
  crash: "Virus crashed. Press Space to re-run."
});
