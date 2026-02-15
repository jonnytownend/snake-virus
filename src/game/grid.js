export function buildCodeGrid(sourceText, width, height) {
  const lines = sourceText.split("\n").slice(0, height);
  return Array.from({ length: height }, (_, y) => {
    const base = (lines[y] || "").padEnd(width, " ").slice(0, width);
    return base.split("");
  });
}

export function cellKey(x, y) {
  return `${x},${y}`;
}

export function inBounds(x, y, width, height) {
  return x >= 0 && x < width && y >= 0 && y < height;
}

export function shuffled(values) {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function collectTargetCandidates(codeGrid, char, eatenSet) {
  const candidates = [];
  const height = codeGrid.length;
  const width = codeGrid[0] ? codeGrid[0].length : 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = cellKey(x, y);
      if (eatenSet.has(key)) continue;
      if (codeGrid[y][x] === char) candidates.push(key);
    }
  }

  return candidates;
}
