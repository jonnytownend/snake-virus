function paintRange(styles, start, end, className) {
  for (let i = start; i < end && i < styles.length; i += 1) styles[i] = className;
}

export function buildStyleGrid(codeGrid, keywords) {
  const height = codeGrid.length;
  const width = codeGrid[0] ? codeGrid[0].length : 0;
  const styleGrid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "ch")
  );

  for (let y = 0; y < height; y += 1) {
    const line = codeGrid[y].join("");
    const styles = styleGrid[y];
    let i = 0;

    while (i < width) {
      const ch = line[i];
      const next = i + 1 < width ? line[i + 1] : "";

      if (ch === "/" && next === "/") {
        paintRange(styles, i, width, "tk-comment");
        break;
      }

      if (ch === "'" || ch === '"' || ch === "`") {
        const quote = ch;
        let j = i + 1;

        while (j < width) {
          if (line[j] === "\\" && j + 1 < width) {
            j += 2;
            continue;
          }
          if (line[j] === quote) {
            j += 1;
            break;
          }
          j += 1;
        }

        paintRange(styles, i, j, "tk-string");
        i = j;
        continue;
      }

      if (/[0-9]/.test(ch)) {
        let j = i + 1;
        while (j < width && /[0-9_.]/.test(line[j])) j += 1;
        paintRange(styles, i, j, "tk-number");
        i = j;
        continue;
      }

      if (/[A-Za-z_$]/.test(ch)) {
        let j = i + 1;
        while (j < width && /[A-Za-z0-9_$]/.test(line[j])) j += 1;

        const word = line.slice(i, j);
        if (keywords.has(word)) {
          paintRange(styles, i, j, "tk-keyword");
        } else {
          let lookahead = j;
          while (lookahead < width && /\s/.test(line[lookahead])) lookahead += 1;
          if (lookahead < width && line[lookahead] === "(") {
            paintRange(styles, i, j, "tk-function");
          }
        }

        i = j;
        continue;
      }

      if ("{}[]();,.<>:+-*/=%!?&|".includes(ch)) styles[i] = "tk-punct";
      i += 1;
    }
  }

  return styleGrid;
}
