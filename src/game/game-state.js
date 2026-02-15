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
    snake: createInitialSnake(width, height),
    direction: { ...START_DIRECTION },
    queuedDirection: { ...START_DIRECTION },
    score: 0,
    eatenCount: 0,
    currentTargetIndex: 0,
    targetQuota: 7,
    eatenThisTarget: 0,
    activeTargets: new Set(),
    growth: 0,
    speed: 1,
    running: false,
    gameOver: false,
    won: false
  };
}
