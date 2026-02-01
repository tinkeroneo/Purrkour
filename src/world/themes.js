// src/world/themes.js
import { forestTheme } from "./themes/forest.js";
import { oceanTheme } from "./themes/ocean.js";

export const THEMES = {
  forest: forestTheme,
  ocean: oceanTheme,
};

export function getTheme(key) {
  return THEMES[key] ?? forestTheme;
}
