import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("mobile controls expose crouch semantics and browser zoom", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const input = fs.readFileSync(path.join(root, "src/core/input.js"), "utf8");
  assert.match(html, /id="crouchBtn"[^>]*aria-label="Ducken"[^>]*aria-pressed="false"/);
  assert.match(html, /id="moveLeftBtn"[^>]*aria-label="Nach links laufen"/);
  assert.match(html, /id="moveRightBtn"[^>]*aria-label="Nach rechts laufen"/);
  assert.match(html, /min-width:44px; min-height:44px/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
  assert.match(html, /Tippen: Sprung/);
  assert.match(html, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(input, /\.touch-controls, #presentationSkip/);
});

test("discoverable help, theme and compact-view controls replace hidden gestures", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const main = fs.readFileSync(path.join(root, "src/main.js"), "utf8");

  assert.match(html, /<dialog id="helpDialog"/);
  assert.match(html, /id="themeBtn"[^>]*aria-label="Nächstes Thema"/);
  assert.match(html, /id="autoThemeBtn"[^>]*aria-label="Automatischen Themenwechsel verwenden"/);
  assert.match(html, /id="minimalBtn"[^>]*aria-label="Kompaktansicht einschalten"/);
  assert.match(html, /id="helpBtn"[^>]*aria-label="Spielhilfe öffnen"/);
  assert.match(html, /id="albumBtn"[^>]*aria-label="Reisealbum öffnen"/);
  assert.match(html, /<dialog id="albumDialog"/);
  assert.doesNotMatch(main, /longPress|setPointerCapture\(e\.pointerId\)/);
  assert.match(main, /purrkour\.onboardingSeen\.v1/);
  assert.match(main, /game\.helpOpen = true/);
  assert.match(main, /game\.helpOpen = false/);
  assert.match(main, /createJourneyAlbum/);
  assert.match(main, /get\("album"\) === "1"/);
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
  const main = fs.readFileSync(path.join(root, "src/main.js"), "utf8");

  assert.match(html, /id="journeyProgress"[^>]*role="progressbar"/);
  assert.match(html, /id="flowDisplay"[^>]*aria-label="Flow x1/);
  assert.match(html, /id="gameOverFlow"/);
  assert.match(html, /id="missionDisplay"[^>]*aria-label=/);
  assert.match(html, /id="riskDisplay"[^>]*aria-label=/);
  assert.match(html, /id="riskKicker">Abzweig/);
  assert.doesNotMatch(html, /id="routeChoice"|id="acceptRouteBtn"|id="declineRouteBtn"/);
  assert.match(html, /id="setpieceActionBtn"/);
  assert.match(html, /id="albumJourneyMap"[^>]*aria-label="Entdeckte Welten"/);
  assert.match(hud, /getFlowProgress/);
  assert.match(hud, /beste Kette/);
  assert.match(main, /getFlowMultiplier\(game\.flow\?\.best\)/);
});

test("chapter, travel and in-world route previews are browser-verifiable", () => {
  const main = fs.readFileSync(path.join(root, "src/main.js"), "utf8");
  const cues = fs.readFileSync(path.join(root, "src/game/presentation-cues.js"), "utf8");
  const draw = fs.readFileSync(path.join(root, "src/objects/draw.js"), "utf8");
  assert.match(main, /PRESENTATION_PREVIEWS/);
  assert.match(cues, /travel: SETPIECE_CUES\.ocean\.travel/);
  assert.doesNotMatch(cues, /DEINE ROUTENWAHL/);
  assert.match(main, /game\.presentationPreview === "route"/);
  assert.match(draw, /function drawSkyPathPlatform\(o\)/);
  assert.match(draw, /o\.routeEntry/);
  assert.match(draw, /function drawPresentation\(\)/);
  assert.match(draw, /getPresentationFrame\(presentation\)/);
  assert.match(main, /dismissPresentation\(game\.presentation\)/);
  assert.match(main, /setupMoveButtons\(game/);
});
