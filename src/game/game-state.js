import { START_DIRECTION } from "./constants.js";

function createInitialSnake(width, height) {
  const x = Math.floor(width / 2);
  const y = Math.floor(height / 2);

  return [
    { x: x - 1, y },
    { x: x - 2, y },
    { x: x - 3, y }
  ];
}

export function createInitialState(width, height) {
  return {
    eaten: new Set(),
    corruptedChars: new Map(),
    snake: createInitialSnake(width, height),
    direction: { ...START_DIRECTION },
    queuedDirection: { ...START_DIRECTION },
    directionQueue: [],
    score: 0,
    stage: 1,
    eatenCount: 0,
    currentTargetIndex: 0,
    activeTargetChars: [],
    targetQuota: 7,
    eatenThisTarget: 0,
    activeTargets: new Set(),
    hazardCells: new Set(),
    activeHazardChars: [],
    growth: 0,
    speed: 1,
    running: false,
    gameOver: false,
    gameOverReason: null,
    won: false
  };
}
