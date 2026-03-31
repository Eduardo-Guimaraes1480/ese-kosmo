export function calculateLevelInfo(totalXp: number) {
  if (totalXp < 100) return { level: 1, xpInCurrentLevel: totalXp, xpNext: 100 };
  let currentLevel = 1;
  let xpAccumulated = 0;
  let xpForNext = 100;

  for (let i = 1; i < 11; i++) {
    if (totalXp >= xpAccumulated + xpForNext) {
      xpAccumulated += xpForNext;
      currentLevel++;
      xpForNext *= 2;
    } else {
      break;
    }
  }

  if (totalXp >= 204700) {
    let excessXp = totalXp - 204700;
    let extraLevels = Math.floor(excessXp / 100000);
    currentLevel = 12 + extraLevels;
    return {
      level: currentLevel,
      xpInCurrentLevel: excessXp % 100000,
      xpNext: 100000,
    };
  }

  return {
    level: currentLevel,
    xpInCurrentLevel: totalXp - xpAccumulated,
    xpNext: xpForNext,
  };
}
