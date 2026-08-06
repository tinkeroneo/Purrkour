const BEAT_CUES = Object.freeze({
  FOREST_INTRO: { kicker: "KAPITEL 01", subtitle: "Der erste Pfotenabdruck", accent: "#8fe3bc" },
  CHECKPOINT_BREATH: { kicker: "RUHEPUNKT", subtitle: "Durchatmen. Dann weiter.", accent: "#ffc5da" },
  OCEAN_JOURNEY: { kicker: "REISE-SETPIECE", subtitle: "Eine neue Küste wartet", accent: "#76ddf2" },
  ISLAND_REST: { kicker: "KAPITEL 02", subtitle: "Warmer Sand unter den Pfoten", accent: "#ffd783" },
  ROCKET_FLIGHT: { kicker: "REISE-SETPIECE", subtitle: "Kurs auf den roten Planeten", accent: "#ff9b86" },
  MARS_RUN: { kicker: "KAPITEL 03", subtitle: "Leichte Pfoten, weiter Horizont", accent: "#ff9d75" },
  ROCKET_RETURN: { kicker: "RÜCKREISE", subtitle: "Die Erde ruft", accent: "#b9c7ff" },
  MOUNTAIN_FOCUS: { kicker: "KAPITEL 04", subtitle: "Hoch hinaus", accent: "#d6e2ff" },
  NIGHT_PASSAGE: { kicker: "NACHTETAPPE", subtitle: "Folge dem Mondlicht", accent: "#a9b8ff" },
  JUNGLE_RUN: { kicker: "KAPITEL 05", subtitle: "Zwischen Blättern und Lianen", accent: "#88e39a" },
  CLIFF_RUN: { kicker: "KAPITEL 06", subtitle: "Der Wind zeigt den Weg", accent: "#cfd6df" },
  CITY_RUN: { kicker: "KAPITEL 07", subtitle: "Über den Dächern", accent: "#f3a6db" },
  DESERT_RUN: { kicker: "KAPITEL 08", subtitle: "Spuren im Abendgold", accent: "#ffc26e" },
  RETURN_JOURNEY: { kicker: "HEIMREISE", subtitle: "Zurück zum ersten Pfad", accent: "#75d8ea" },
});

const SETPIECE_CUES = Object.freeze({
  ocean: {
    travel: { kicker: "LEINEN LOS", title: "Über das Meer", subtitle: "Der Horizont öffnet sich", accent: "#76ddf2" },
    arrive: { kicker: "LAND IN SICHT", title: "Neue Küste", subtitle: "Gleich wieder Boden unter den Pfoten", accent: "#ffd783" },
  },
  rocket: {
    travel: { kicker: "ZÜNDUNG", title: "Zu den Sternen", subtitle: "Schwerkraft war gestern", accent: "#ff9b86" },
    arrive: { kicker: "LANDEANFLUG", title: "Pfoten voraus", subtitle: "Das nächste Kapitel beginnt", accent: "#b9c7ff" },
  },
});

export const PRESENTATION_PREVIEWS = Object.freeze({
  travel: SETPIECE_CUES.ocean.travel,
});

export function getBeatPresentationCue(beatId) {
  return BEAT_CUES[beatId] || null;
}

export function getSetpiecePresentationCue(mode, phase) {
  return SETPIECE_CUES[mode]?.[phase] || null;
}
