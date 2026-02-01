// src/world/themes.js
import { forestTheme } from "./themes/forest.js";
import { oceanTheme } from "./themes/ocean.js";
import { islandTheme } from "./themes/island.js";
import { mountainTheme } from "./themes/mountain.js";

export const THEMES = {
  forest: forestTheme,
  ocean: oceanTheme,
  island: islandTheme,
  mountain: mountainTheme,
};

export function getTheme(key) {
  return THEMES[key] ?? forestTheme;
}
