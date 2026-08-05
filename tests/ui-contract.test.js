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
  assert.match(html, /Tippen: Sprung/);
});

test("discoverable help, theme and compact-view controls replace hidden gestures", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const main = fs.readFileSync(path.join(root, "src/main.js"), "utf8");

  assert.match(html, /<dialog id="helpDialog"/);
  assert.match(html, /id="themeBtn"[^>]*aria-label="Nächstes Thema"/);
  assert.match(html, /id="autoThemeBtn"[^>]*aria-label="Automatischen Themenwechsel verwenden"/);
  assert.match(html, /id="minimalBtn"[^>]*aria-label="Kompaktansicht einschalten"/);
  assert.match(html, /id="helpBtn"[^>]*aria-label="Spielhilfe öffnen"/);
  assert.doesNotMatch(main, /longPress|setPointerCapture\(e\.pointerId\)/);
  assert.match(main, /purrkour\.onboardingSeen\.v1/);
  assert.match(main, /game\.helpOpen = true/);
  assert.match(main, /game\.helpOpen = false/);
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

test("journey, flow and run summary expose the new reward loop", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const hud = fs.readFileSync(path.join(root, "src/game/hud.js"), "utf8");

  assert.match(html, /id="journeyProgress"[^>]*role="progressbar"/);
  assert.match(html, /id="flowDisplay"[^>]*aria-label="Flow x1/);
  assert.match(html, /id="gameOverFlow"/);
  assert.match(hud, /getFlowProgress/);
  assert.match(hud, /beste Kette/);
});
