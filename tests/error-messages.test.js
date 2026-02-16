import { formatMultiplayerJoinError } from "../src/network/error-messages.js";

describe("formatMultiplayerJoinError", () => {
  test("maps invalid config error", () => {
    const text = formatMultiplayerJoinError({ code: "config/invalid" });
    expect(text).toMatch(/config is invalid or incomplete/i);
  });

  test("maps SDK load failures", () => {
    const text = formatMultiplayerJoinError({ code: "sdk/load-failed" });
    expect(text).toMatch(/Could not load Firebase SDK/i);
  });

  test("maps room join retry exhaustion", () => {
    const text = formatMultiplayerJoinError({ code: "room/join-failed" });
    expect(text).toMatch(/Room allocation failed/i);
  });

  test("maps permission denied to firestore rules guidance", () => {
    const text = formatMultiplayerJoinError({ code: "permission-denied" });
    expect(text).toMatch(/Firestore denied access/i);
  });

  test("maps failed precondition to firestore creation guidance", () => {
    const text = formatMultiplayerJoinError({ code: "failed-precondition" });
    expect(text).toMatch(/Create a Firestore database/i);
  });

  test("maps anonymous auth configuration errors", () => {
    const text = formatMultiplayerJoinError({ code: "auth/operation-not-allowed" });
    expect(text).toMatch(/Anonymous auth is disabled/i);
  });

  test("maps invalid API key auth errors", () => {
    const text = formatMultiplayerJoinError({ code: "auth/invalid-api-key" });
    expect(text).toMatch(/Invalid Firebase API key/i);
  });

  test("maps unauthorized domain auth errors", () => {
    const text = formatMultiplayerJoinError({ code: "auth/unauthorized-domain" });
    expect(text).toMatch(/Authorized domains/i);
  });

  test("maps app not authorized auth errors", () => {
    const text = formatMultiplayerJoinError({ code: "auth/app-not-authorized" });
    expect(text).toMatch(/Authorized domains/i);
  });

  test("maps auth network request failures", () => {
    const text = formatMultiplayerJoinError({ code: "auth/network-request-failed" });
    expect(text).toMatch(/network/i);
  });

  test("maps dynamic import fetch failures by message", () => {
    const text = formatMultiplayerJoinError({
      message: "TypeError: Failed to fetch dynamically imported module"
    });
    expect(text).toMatch(/Could not download Firebase SDK modules/i);
  });

  test("falls back to code-based generic message", () => {
    const text = formatMultiplayerJoinError({ code: "some-unknown-code" });
    expect(text).toMatch(/some-unknown-code/);
  });

  test("uses plain generic message with no code", () => {
    const text = formatMultiplayerJoinError(new Error("plain"));
    expect(text).toBe("Failed to connect to multiplayer. Check Firebase config/network.");
  });
});
