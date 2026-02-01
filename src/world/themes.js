// src/world/themes.js
import { forestTheme } from "./themes/forest.js";
import { oceanTheme } from "./themes/ocean.js";
import { islandTheme } from "./themes/island.js";

export const THEMES = {
  forest: forestTheme,
  ocean: oceanTheme,
  island: islandTheme,
};

export function getTheme(key) {
  return THEMES[key] ?? forestTheme;
}
