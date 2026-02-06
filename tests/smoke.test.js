const fs = require("fs");
const path = require("path");
const assert = require("assert");

function read(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function extractArrayLiteral(src, name) {
  const re = new RegExp(`${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`, "m");
  const m = src.match(re);
  assert(m, `Could not find ${name} array`);
  const raw = m[1];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^['"]|['"]$/g, ""));
}

function extractObjectKeys(src, name) {
  const re = new RegExp(`${name}\\s*=\\s*\\{([\\s\\S]*?)\\}`, "m");
  const m = src.match(re);
  assert(m, `Could not find ${name} object`);
  const body = m[1];
  const keys = [];
  const keyRe = /^\s*([a-zA-Z0-9_]+)\s*:/gm;
  let km;
  while ((km = keyRe.exec(body))) keys.push(km[1]);
  return keys;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function extractNestedBlock(src, name, nested) {
  const re = new RegExp(`${name}\\s*=\\s*\\{[\\s\\S]*?${nested}\\s*:\\s*\\{([\\s\\S]*?)\\}\\s*,?`, "m");
  const m = src.match(re);
  assert(m, `Could not find ${name}.${nested} object`);
  return m[1];
}

function extractThemePlanPhases(src, mode) {
  const re = new RegExp(`${mode}\\s*:\\s*\\[([\\s\\S]*?)\\]\\s*,?`, "m");
  const m = src.match(re);
  assert(m, `Could not find THEME_PLANS.${mode} array`);
  const block = m[1];
  const phases = [];
  const phaseRe = /at\s*:\s*["']([^"']+)["']/g;
  let pm;
  while ((pm = phaseRe.exec(block))) phases.push(pm[1]);
  return phases;
}

function extractThemePlanEntries(src, mode) {
  const re = new RegExp(`${mode}\\s*:\\s*\\[([\\s\\S]*?)\\]\\s*,?`, "m");
  const m = src.match(re);
  assert(m, `Could not find THEME_PLANS.${mode} array`);
  const block = m[1];
  const entries = [];
  const entryRe = /\{[\s\S]*?\}/g;
  let em;
  while ((em = entryRe.exec(block))) entries.push(em[0]);
  return entries;
}
// Theme order should cover all exported themes (excluding helper keys).
const themesSrc = read("src/world/themes.js");
const order = extractArrayLiteral(themesSrc, "THEME_ORDER");
const themeKeys = extractObjectKeys(themesSrc, "THEMES");

assert(order.length > 0, "THEME_ORDER must not be empty");
assert(themeKeys.length > 0, "THEMES must not be empty");

const orderSet = new Set(order);
const missingInOrder = themeKeys.filter((k) => !orderSet.has(k));
assert(
  missingInOrder.length === 0,
  `THEME_ORDER missing keys: ${missingInOrder.join(", ")}`
);

const orderUnique = uniq(order);
assert(
  orderUnique.length === order.length,
  "THEME_ORDER contains duplicate entries"
);

// Setpieces: timings and theme plans must be aligned.
const setpiecesSrc = read("src/game/setpieces.js");
const setpieceModes = extractObjectKeys(setpiecesSrc, "SETPIECE_TIMINGS");
const themePlanModes = extractObjectKeys(setpiecesSrc, "THEME_PLANS");

assert(setpieceModes.length > 0, "SETPIECE_TIMINGS must not be empty");
assert(themePlanModes.length > 0, "THEME_PLANS must not be empty");

const planMissing = setpieceModes.filter((k) => !themePlanModes.includes(k));
assert(
  planMissing.length === 0,
  `THEME_PLANS missing modes: ${planMissing.join(", ")}`
);

const timingMissing = themePlanModes.filter((k) => !setpieceModes.includes(k));
assert(
  timingMissing.length === 0,
  `SETPIECE_TIMINGS missing modes: ${timingMissing.join(", ")}`
);

const oceanBlock = extractNestedBlock(setpiecesSrc, "SETPIECE_TIMINGS", "ocean");
const rocketBlock = extractNestedBlock(setpiecesSrc, "SETPIECE_TIMINGS", "rocket");
const expectedPhases = ["APPROACH", "BOARD", "TRAVEL", "ARRIVE"];

for (const phase of expectedPhases) {
  assert(
    new RegExp(`\\b${phase}\\s*:`).test(oceanBlock),
    "SETPIECE_TIMINGS.ocean must define APPROACH/BOARD/TRAVEL/ARRIVE"
  );
  assert(
    new RegExp(`\\b${phase}\\s*:`).test(rocketBlock),
    "SETPIECE_TIMINGS.rocket must define APPROACH/BOARD/TRAVEL/ARRIVE"
  );
}

const planBlockRe = /THEME_PLANS\s*=\s*\{([\s\S]*?)\n\}/m;
const planBlockMatch = setpiecesSrc.match(planBlockRe);
assert(planBlockMatch, "Could not find THEME_PLANS block");
const planBlock = planBlockMatch[1];
const modesRe = /^\s*([a-zA-Z0-9_]+)\s*:\s*\[/gm;
let mm;
while ((mm = modesRe.exec(planBlock))) {
  const mode = mm[1];
  const phases = extractThemePlanPhases(planBlock, mode);
  assert(phases.length > 0, `THEME_PLANS.${mode} must not be empty`);
  for (const phase of phases) {
    assert(
      ["approach", "board", "travel", "arrive"].includes(phase),
      `THEME_PLANS.${mode} has invalid phase: ${phase}`
    );
  }

  const entries = extractThemePlanEntries(planBlock, mode);
  for (const entry of entries) {
    const themeMatch = entry.match(/theme\s*:\s*["']([^"']+)["']/);
    assert(themeMatch, `Theme plan entry missing 'theme' in ${mode}`);
    const theme = themeMatch[1];
    if (theme === "target") {
      const fallbackMatch = entry.match(/fallback\s*:\s*["']([^"']+)["']/);
      assert(fallbackMatch, `Theme plan entry missing fallback for ${mode}`);
      const fallback = fallbackMatch[1];
      assert(
        themeKeys.includes(fallback),
        `THEME_PLANS.${mode} fallback theme not in THEMES: ${fallback}`
      );
    } else {
      assert(
        themeKeys.includes(theme),
        `THEME_PLANS.${mode} theme not in THEMES: ${theme}`
      );
    }
  }
}

console.log("smoke test: themes order + setpiece plans/timings");
