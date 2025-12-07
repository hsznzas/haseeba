import { COACH_PERSONA } from './personas';
import { Habit, HabitLog, HabitType, PrayerQuality, LogStatus } from '../../types';

// Rawatib prayer IDs
const RAWATIB_IDS = [
  'fajr_sunnah',
  'dhuhr_sunnah_before_1',
  'dhuhr_sunnah_before_2', 
  'dhuhr_sunnah_after',
  'maghrib_sunnah',
  'isha_sunnah',
];

// Fard prayer IDs
const FARD_PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

interface DataSummary {
  prayerSummary: string;
  rawatibSummary: string;
  otherHabitsSummary: string;
  topObstacles: string[];
  overallTakbirahPct: number;
  rawatibCompletionPct: number;
  weakestPrayer: string | null;
  strongestPrayer: string | null;
  weakestRawatib: string | null;
}

function aggregateData(habits: Habit[], logs: HabitLog[]): DataSummary {
  // Calculate Fard prayer stats
  const prayerHabits = habits.filter(h => FARD_PRAYER_IDS.includes(h.id));
  
  let totalPrayerLogs = 0;
  let takbirahCount = 0;
  let weakestPrayer: { name: string; pct: number } | null = null;
  let strongestPrayer: { name: string; pct: number } | null = null;

  const prayerStats = prayerHabits.map(h => {
    const habitLogs = logs.filter(l => l.habitId === h.id);
    const total = habitLogs.length;
    totalPrayerLogs += total;

    const takbirah = habitLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
    const jamaa = habitLogs.filter(l => l.value === PrayerQuality.JAMAA).length;
    const onTime = habitLogs.filter(l => l.value === PrayerQuality.ON_TIME).length;
    const missed = habitLogs.filter(l => l.value === PrayerQuality.MISSED).length;
    
    takbirahCount += takbirah;
    
    const takbirahPct = total > 0 ? Math.round((takbirah / total) * 100) : 0;
    
    // Track weakest and strongest
    if (total > 0) {
      if (!weakestPrayer || takbirahPct < weakestPrayer.pct) {
        weakestPrayer = { name: h.name, pct: takbirahPct };
      }
      if (!strongestPrayer || takbirahPct > strongestPrayer.pct) {
        strongestPrayer = { name: h.name, pct: takbirahPct };
      }
    }
    
    return `- ${h.name}: ${takbirahPct}% Takbirah (${takbirah}/${total}), Jamaa: ${jamaa}, OnTime: ${onTime}, Missed: ${missed}`;
  });

  const overallTakbirahPct = totalPrayerLogs > 0 ? Math.round((takbirahCount / totalPrayerLogs) * 100) : 0;

  // Calculate Rawatib stats
  const rawatibHabits = habits.filter(h => RAWATIB_IDS.includes(h.id));
  let totalRawatibLogs = 0;
  let rawatibDoneCount = 0;
  let weakestRawatib: { name: string; pct: number } | null = null;

  const rawatibStats = rawatibHabits.map(h => {
    const habitLogs = logs.filter(l => l.habitId === h.id);
    const total = habitLogs.length;
    totalRawatibLogs += total;
    
    const done = habitLogs.filter(l => l.status === LogStatus.DONE).length;
    rawatibDoneCount += done;
    
    const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
    
    if (total > 0 && (!weakestRawatib || donePct < weakestRawatib.pct)) {
      weakestRawatib = { name: h.name, pct: donePct };
    }
    
    return `- ${h.name}: ${donePct}% done (${done}/${total})`;
  });

  const rawatibCompletionPct = totalRawatibLogs > 0 ? Math.round((rawatibDoneCount / totalRawatibLogs) * 100) : 0;

  // Collect obstacles/reasons
  const reasonsMap: Record<string, number> = {};
  logs.forEach(l => {
    if (l.reason && l.reason.trim()) {
      reasonsMap[l.reason] = (reasonsMap[l.reason] || 0) + 1;
    }
  });
  const topObstacles = Object.entries(reasonsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => `${reason}: ${count} times`);

  // Other habits summary
  const otherHabits = habits.filter(h => 
    h.isActive && 
    !FARD_PRAYER_IDS.includes(h.id) && 
    !RAWATIB_IDS.includes(h.id)
  );
  
  const otherHabitsStats = otherHabits.slice(0, 5).map(h => {
    const habitLogs = logs.filter(l => l.habitId === h.id);
    const done = habitLogs.filter(l => l.status === LogStatus.DONE || (l.value && l.value > 0)).length;
    const total = habitLogs.length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return `- ${h.name}: ${rate}% (${done}/${total})`;
  });

  return {
    prayerSummary: prayerStats.join('\n'),
    rawatibSummary: rawatibStats.join('\n'),
    otherHabitsSummary: otherHabitsStats.join('\n') || 'No other habits tracked.',
    topObstacles,
    overallTakbirahPct,
    rawatibCompletionPct,
    weakestPrayer: weakestPrayer?.name || null,
    strongestPrayer: strongestPrayer?.name || null,
    weakestRawatib: weakestRawatib?.name || null,
  };
}

export function buildDailyBriefingPrompt(habits: Habit[], logs: HabitLog[], language: string): string {
  const data = aggregateData(habits, logs);
  const langInstruction = language === 'ar' ? 'Respond in Arabic.' : 'Respond in English.';
  
  // Determine performance tier
  const performanceTier = data.overallTakbirahPct >= 80 
    ? 'HIGH_PERFORMER' 
    : data.overallTakbirahPct >= 40 
      ? 'MID_PERFORMER' 
      : 'LOW_PERFORMER';

  const performanceGuidance = {
    HIGH_PERFORMER: `User is at ${data.overallTakbirahPct}% Takbirah. WARN against Ujub (self-admiration). Remind them: "Don't let your deeds deceive you."`,
    MID_PERFORMER: `User is at ${data.overallTakbirahPct}% Takbirah. Be direct. Push for improvement. "Good isn't great."`,
    LOW_PERFORMER: `User is at ${data.overallTakbirahPct}% Takbirah. Focus on Hope (Raja). Give ONE small win. "Start with just Fajr this week."`
  };

  const prompt = `
${COACH_PERSONA.role}

## VOICE RULES:
${COACH_PERSONA.voice_rules.map(r => `- ${r}`).join('\n')}

## USER DATA:

### 5 FARD PRAYERS (Obligatory):
Overall Takbirah Rate: ${data.overallTakbirahPct}%
Weakest Prayer: ${data.weakestPrayer || 'N/A'}
Strongest Prayer: ${data.strongestPrayer || 'N/A'}
${data.prayerSummary}

### RAWATIB (Sunnah Prayers):
Completion Rate: ${data.rawatibCompletionPct}%
Weakest Rawatib: ${data.weakestRawatib || 'N/A'}
${data.rawatibSummary}

### OTHER HABITS:
${data.otherHabitsSummary}

### TOP OBSTACLES REPORTED:
${data.topObstacles.length > 0 ? data.topObstacles.join('\n') : 'None recorded.'}

## PERFORMANCE TIER: ${performanceTier}
${performanceGuidance[performanceTier]}

## YOUR TASK:
Generate a JSON object with these 4 keys. Each value should be a string with the insight.

1. **home_advice**: ${COACH_PERSONA.definitions.home_advice}
2. **analytics_insight**: ${COACH_PERSONA.definitions.analytics_insight}
3. **five_prayers_focus**: ${COACH_PERSONA.definitions.five_prayers_focus}
4. **rawatib_focus**: ${COACH_PERSONA.definitions.rawatib_focus}

## CRITICAL RULES:
- Output ONLY raw JSON. No markdown formatting. No \`\`\`json blocks.
- Keep each insight concise (2-4 sentences max).
- Use bullet points where helpful.
- ${langInstruction}

OUTPUT FORMAT (raw JSON only):
{"home_advice":"...","analytics_insight":"...","five_prayers_focus":"...","rawatib_focus":"..."}
`;

  return prompt.trim();
}

