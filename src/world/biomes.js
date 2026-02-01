export const BIOMES = [
  {
    key: "wald",
    label: "wald",
    day:  { skyTop:[160,220,255], skyBot:[240,252,255], far:[55,85,125], forest:[35,120,80], lake:[70,160,190], ground:[78,155,88] },
    night:{ skyTop:[18,28,50],   skyBot:[6,10,18],     far:[20,30,55],  forest:[12,55,42],   lake:[25,75,105],  ground:[22,70,45] },
    lakeChance: 0.002
  },
  {
    key: "see",
    label: "seeufer",
    day:  { skyTop:[165,230,255], skyBot:[245,255,255], far:[70,95,135], forest:[50,135,95], lake:[55,150,210], ground:[95,170,92] },
    night:{ skyTop:[18,32,55],   skyBot:[6,12,22],     far:[26,38,62],  forest:[18,62,50],  lake:[22,70,115],  ground:[28,78,48] },
    lakeChance: 0.015
  },
  {
    key: "berge",
    label: "berge",
    day:  { skyTop:[150,210,255], skyBot:[235,245,255], far:[75,90,115], forest:[60,125,90], lake:[80,145,185], ground:[120,165,110] },
    night:{ skyTop:[16,26,48],   skyBot:[6,10,18],     far:[24,32,50],  forest:[18,56,46],  lake:[28,70,95],   ground:[34,74,58] },
    lakeChance: 0.001
  }
];

export function biomeIndexForScore(score) {
  return Math.floor(score / 90) % BIOMES.length;
}
