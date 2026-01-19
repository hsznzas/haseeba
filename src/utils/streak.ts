export const shouldShowStreak = (streak: number): boolean => streak >= 3;

export const getStreakOpacity = (streak: number): number => {
  if (streak < 3) return 0;
  if (streak <= 21) return 1;
  if (streak >= 30) return 0;
  const faded = 1 - (streak - 21) / 9;
  return Math.max(0, Math.min(1, faded));
};
