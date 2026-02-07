export const OVERLAYS = {
  spring: {
    id: "spring",
    label: "Fruehling",
    speedMul: 1.02,
    jumpMul: 1.04,
    gravityMul: 0.98,
    controlMul: 1.0,
    tint: "rgba(140,220,140,0.10)"
  },
  summer: {
    id: "summer",
    label: "Sommer",
    speedMul: 1.05,
    jumpMul: 1.02,
    gravityMul: 1.0,
    controlMul: 1.02,
    tint: "rgba(255,210,140,0.10)"
  },
  autumn: {
    id: "autumn",
    label: "Herbst",
    speedMul: 0.98,
    jumpMul: 0.98,
    gravityMul: 1.01,
    controlMul: 0.98,
    tint: "rgba(200,150,90,0.12)"
  },
  winter: {
    id: "winter",
    label: "Winter",
    speedMul: 0.97,
    jumpMul: 1.0,
    gravityMul: 1.02,
    controlMul: 0.85, // slippery
    tint: "rgba(170,210,255,0.14)"
  }
};

export function getOverlay(id) {
  return OVERLAYS[id] ?? null;
}
