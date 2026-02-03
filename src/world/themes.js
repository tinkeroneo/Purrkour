// src/world/themes.js
import { forestTheme } from "./themes/forest.js";
import { oceanTheme } from "./themes/ocean.js";
import { islandTheme } from "./themes/island.js";
import { mountainTheme } from "./themes/mountain.js";
import { jungleTheme } from "./themes/jungle.js";
import { cityTheme } from "./themes/city.js";
import { desertTheme } from "./themes/desert.js";
import { marsTheme } from "./themes/mars.js";
import { cliffTheme } from "./themes/cliff.js";

export const THEME_ORDER = ["forest","jungle","ocean","island","cliff","mountain","city","desert","mars"];

export const THEMES = {
  forest: forestTheme,
  ocean: oceanTheme,
  island: islandTheme,
  mountain: mountainTheme,
  jungle: jungleTheme,
  city: cityTheme,
  desert: desertTheme,
  mars: marsTheme,
  cliff: cliffTheme,
};

// stable theme order for UI
THEMES.__order = THEME_ORDER;

export function getTheme(key) {
  return THEMES[key] ?? forestTheme;
}