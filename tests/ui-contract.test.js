import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("mobile controls expose crouch semantics and browser zoom", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /id="crouchBtn"[^>]*aria-label="Ducken"[^>]*aria-pressed="false"/);
  assert.match(html, /min-width:44px; min-height:44px/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
  assert.match(html, /Tippen: springen/);
});

test("game over remains visible until the player requests a restart", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const collider = fs.readFileSync(path.join(root, "src/objects/collide.js"), "utf8");

  assert.match(html, /<dialog id="gameOverDialog"/);
  assert.match(html, /id="gameOverScore"/);
  assert.match(html, /id="gameOverBest"/);
  assert.match(html, /<button[^>]*id="restartBtn"[^>]*>Erneut spielen<\/button>/);
  assert.doesNotMatch(collider, /setTimeout\(resetAll/);
  assert.match(collider, /game\.finished = true/);
});
