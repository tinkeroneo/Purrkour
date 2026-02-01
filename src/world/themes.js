// src/world/themes.js
import { forestTheme } from "./themes/forest.js";
import { oceanTheme } from "./themes/ocean.js";
import { islandTheme } from "./themes/island.js";
import { mountainTheme } from "./themes/mountain.js";
import { jungleTheme } from "./themes/jungle.js";
import { cityTheme } from "./themes/city.js";
import { desertTheme } from "./themes/desert.js";

export const THEMES = {
  forest: forestTheme,
  ocean: oceanTheme,
  island: islandTheme,
  mountain: mountainTheme,
  jungle: jungleTheme,
  city: cityTheme,
  desert: desertTheme,
};

export function getTheme(key) {
  return THEMES[key] ?? forestTheme;
}
