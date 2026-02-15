import { KEYWORDS } from "../src/game/constants.js";
import { buildStyleGrid } from "../src/game/syntax-highlighter.js";

function lineToGrid(line) {
  return [line.split("")];
}

describe("buildStyleGrid", () => {
  test("highlights keywords and function identifiers", () => {
    const line = "const run = move();";
    const [styles] = buildStyleGrid(lineToGrid(line), KEYWORDS);

    expect(styles.slice(0, 5).every((s) => s === "tk-keyword")).toBe(true);
    expect(styles[line.indexOf("move")]).toBe("tk-function");
  });

  test("highlights strings and numbers", () => {
    const line = "let value = \"hi\" + 10_5;";
    const [styles] = buildStyleGrid(lineToGrid(line), KEYWORDS);

    expect(styles[line.indexOf("let")]).toBe("tk-keyword");
    expect(styles[line.indexOf('"')]).toBe("tk-string");
    expect(styles[line.indexOf("1")]).toBe("tk-number");
  });

  test("highlights comments until line end", () => {
    const line = "x = 2; // todo";
    const [styles] = buildStyleGrid(lineToGrid(line), KEYWORDS);
    const commentStart = line.indexOf("//");

    expect(styles[commentStart]).toBe("tk-comment");
    expect(styles.slice(commentStart).every((s) => s === "tk-comment")).toBe(true);
  });

  test("marks punctuation tokens", () => {
    const line = "{ a: (b + c) }";
    const [styles] = buildStyleGrid(lineToGrid(line), KEYWORDS);

    expect(styles[line.indexOf("{")]).toBe("tk-punct");
    expect(styles[line.indexOf(":")]).toBe("tk-punct");
    expect(styles[line.indexOf("+")]).toBe("tk-punct");
    expect(styles[line.indexOf(")")]).toBe("tk-punct");
  });
});
