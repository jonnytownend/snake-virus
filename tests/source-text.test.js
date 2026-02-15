import { SourceTextProvider } from "../src/game/source-text.js";

describe("SourceTextProvider", () => {
  test("returns source text windows with metadata header", () => {
    const provider = new SourceTextProvider([
      { path: "a.js", content: "one\ntwo\nthree\nfour" }
    ]);

    const snippet = provider.nextSource({ width: 80, height: 4 });
    const lines = snippet.split("\n");

    expect(lines[0]).toMatch(/^\/\/ source: a\.js/);
    expect(lines[1]).toMatch(/^\/\/ region: /);
    expect(lines.length).toBe(4);
  });

  test("avoids repeating identical pick when multiple corpus entries exist", () => {
    const provider = new SourceTextProvider([
      { path: "a.js", content: "alpha\nbeta\ngamma" },
      { path: "b.js", content: "delta\nepsilon\nzeta" }
    ]);

    const first = provider.nextSource({ width: 80, height: 4 });
    const second = provider.nextSource({ width: 80, height: 4 });

    expect(first).not.toBe(second);
  });
});
