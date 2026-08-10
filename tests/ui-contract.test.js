import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("mobile controls stay focused on crouching without browser selection", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const input = fs.readFileSync(path.join(root, "src/core/input.js"), "utf8");
  const main = fs.readFileSync(path.join(root, "src/main.js"), "utf8");
  assert.match(html, /id="crouchBtn"[^>]*aria-label="Ducken"[^>]*aria-pressed="false"/);
  assert.doesNotMatch(html, /id="moveLeftBtn"|id="moveRightBtn"/);
  assert.match(html, /id="touchCrouchBtn"[^>]*aria-label="Ducken"/);
  assert.match(html, /@media \(any-pointer:coarse\)/);
  assert.match(html, /min-width:44px; min-height:44px/);
  assert.match(html, /-webkit-user-select:none; user-select:none; -webkit-touch-callout:none/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
  assert.match(html, /Tippen: Sprung/);
  assert.match(html, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(input, /\.touch-controls, #presentationSkip/);
  assert.match(main, /\["contextmenu", "selectstart"\]/);
});

test("discoverable help, theme and compact-view controls replace hidden gestures", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const main = fs.readFileSync(path.join(root, "src/main.js"), "utf8");

  assert.match(html, /<dialog id="helpDialog"/);
  assert.match(html, /id="themeBtn"[^>]*aria-label="Nächstes Thema"/);
  assert.match(html, /id="autoThemeBtn"[^>]*aria-label="Automatischen Themenwechsel verwenden"/);
  assert.match(html, /id="minimalBtn"[^>]*aria-label="Kompaktansicht einschalten"/);
  assert.match(html, /id="helpBtn"[^>]*aria-label="Spielhilfe öffnen"/);
  assert.match(html, /id="settingsBtn"[^>]*aria-expanded="false"/);
  assert.match(html, /id="albumBtn"[^>]*aria-label="Reisealbum öffnen"/);
  assert.match(html, /<dialog id="albumDialog"/);
  assert.doesNotMatch(main, /longPress|setPointerCapture\(e\.pointerId\)/);
  assert.match(main, /purrkour\.onboardingSeen\.v1/);
  assert.match(main, /game\.helpOpen = true/);
  assert.match(main, /game\.helpOpen = false/);
  assert.match(main, /createJourneyAlbum/);
  assert.match(main, /get\("album"\) === "1"/);
  assert.doesNotMatch(html, /<li><strong>(Flow|Aufträge|Goldpfade|Pause):/);
});

test("game over remains visible until the player requests a restart", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const collider = fs.readFileSync(path.join(root, "src/objects/collide.js"), "utf8");

  assert.match(html, /<dialog id="gameOverDialog"/);
  assert.match(html, /id="gameOverScore"/);
  assert.match(html, /id="gameOverBest"/);
  assert.match(html, /id="gameOverCause"/);
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
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  assert.doesNotMatch(main, /setupMoveButtons\(game/);
  assert.match(main, /function togglePause\(\)/);
  assert.match(main, /game\.pause\.phase = game\.setpiece\?\.active \? "setpiece" : "walk"/);
  assert.match(main, /document\.addEventListener\("visibilitychange"/);
  assert.match(main, /prefers-reduced-motion: reduce[\s\S]*addEventListener\?\.\("change"/);
  assert.match(html, /id="pauseStatus"[^>]*role="status"/);
  assert.match(html, /id="sceneStatus"[^>]*aria-live="polite"/);
  assert.match(html, /#ui\.is-focus ~ #hint\{ opacity:0; \}/);
  assert.match(main, /game\.presentationPreview === "ocean-travel"/);
  assert.match(main, /game\.presentationPreview === "rocket-travel"/);
  assert.match(main, /game\.presentationPreview === "setpiece"/);
  assert.match(main, /data\.previewReady|dataset\.previewReady/);
  assert.match(main, /previewSetpiece/);
  assert.match(main, /previewControlReturned/);
});

test("travel renderers keep a visible passenger and explicit origin-to-target passes", () => {
  const vehicles = ["balloon", "raft", "zeppelin", "rocket"];
  for (const vehicle of vehicles) {
    const source = fs.readFileSync(path.join(root, `src/game/vehicles/${vehicle}.js`), "utf8");
    assert.match(source, /drawPassengerCat/, `${vehicle} must render the passenger`);
  }

  const background = fs.readFileSync(path.join(root, "src/world/background.js"), "utf8");
  const draw = fs.readFileSync(path.join(root, "src/objects/draw.js"), "utf8");
  assert.match(background, /function drawOceanTravel/);
  assert.match(background, /function drawRocketTravel/);
  assert.match(background, /originSurfaceY/);
  assert.match(draw, /bg\.drawOceanTravel/);
  assert.match(draw, /bg\.drawRocketTravel/);
  assert.match(draw, /vehicleScale/);
});
