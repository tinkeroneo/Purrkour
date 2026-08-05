export const WORLD_RULES = Object.freeze({
  forest: { label: "Ausgewogene Pfade", gravityMul: 1, jumpMul: 1, controlMul: 1, paceMul: 1 },
  ocean: { label: "Schwebende Bögen", gravityMul: 0.92, jumpMul: 1.03, controlMul: 0.95, paceMul: 0.96 },
  island: { label: "Wendige Strandpfade", gravityMul: 0.98, jumpMul: 1, controlMul: 1.08, paceMul: 1 },
  mars: { label: "Leichte Schwerkraft", gravityMul: 0.72, jumpMul: 1.08, controlMul: 0.9, paceMul: 0.92 },
  mountain: { label: "Hohe Sprünge", gravityMul: 1.02, jumpMul: 1.08, controlMul: 0.92, paceMul: 1.02 },
  jungle: { label: "Flinke Lianenwege", gravityMul: 1, jumpMul: 1.03, controlMul: 1.12, paceMul: 1.04 },
  cliff: { label: "Windige Kanten", gravityMul: 0.96, jumpMul: 1.05, controlMul: 0.88, paceMul: 1.06 },
  city: { label: "Schnelle Dächer", gravityMul: 1.03, jumpMul: 0.98, controlMul: 1.15, paceMul: 1.09 },
  desert: { label: "Schwerer Sand", gravityMul: 1.06, jumpMul: 1, controlMul: 0.98, paceMul: 1.08 },
});

export function getWorldRule(theme) {
  return WORLD_RULES[theme] || WORLD_RULES.forest;
}
