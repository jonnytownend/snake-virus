import { HAZARD_SEQUENCE, TARGET_SEQUENCE } from "./constants.js";
import { SOURCE_CORPUS } from "./source-corpus.js";

const INTEREST_CHARS = new Set([...TARGET_SEQUENCE, ...HAZARD_SEQUENCE]);

function scoreContent(content) {
  let score = 0;
  for (let i = 0; i < content.length; i += 1) {
    if (INTEREST_CHARS.has(content[i])) score += 1;
  }
  return score;
}

function normalizeCorpus(corpus) {
  return corpus
    .map((entry) => {
      const lines = entry.content.split("\n");
      return {
        path: entry.path,
        lines,
        interestScore: scoreContent(entry.content)
      };
    })
    .filter((entry) => entry.lines.length > 0);
}

export class SourceTextProvider {
  constructor(corpus = SOURCE_CORPUS) {
    this.entries = normalizeCorpus(corpus);
    this.lastPick = null;
  }

  nextSource({ width, height }) {
    if (this.entries.length === 0) return "";

    const viable = this.entries.filter((entry) => entry.interestScore >= 18);
    const pool = viable.length > 0 ? viable : this.entries;
    let index = Math.floor(Math.random() * pool.length);

    if (pool.length > 1 && this.lastPick && pool[index].path === this.lastPick.path) {
      index = (index + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length;
    }

    const entry = pool[index];
    const bodyLines = Math.max(1, height - 2);
    const maxStart = Math.max(0, entry.lines.length - bodyLines);
    let start = maxStart > 0 ? Math.floor(Math.random() * (maxStart + 1)) : 0;

    if (
      maxStart > 0 &&
      this.lastPick &&
      this.lastPick.path === entry.path &&
      this.lastPick.start === start
    ) {
      start = (start + 1 + Math.floor(Math.random() * maxStart)) % (maxStart + 1);
    }

    const end = start + bodyLines;
    const selected = entry.lines.slice(start, end);
    const header = [
      `// source: ${entry.path}`,
      `// region: ${start + 1}-${Math.min(entry.lines.length, end)}`
    ];

    const clipped = selected.map((line) => line.slice(0, Math.max(8, width)));
    this.lastPick = { path: entry.path, start };
    return [...header, ...clipped].join("\n");
  }
}

