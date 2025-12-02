import { GoogleGenAI } from "@google/genai";
import { Habit, HabitLog, HabitType, PrayerQuality, LogStatus } from '../../types';
import { AVAILABLE_ICONS } from '../utils/iconMap';

// Helper to get API key from multiple sources
function getApiKey(): string {
  // 1. Check user's BYOK (Bring Your Own Key) from localStorage
  const userKey = localStorage.getItem('user_openai_key');
  if (userKey && userKey.trim()) {
    return userKey.trim();
  }
  
  // 2. Check Vite environment variable
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  
  return '';
}

export async function generateSpiritualInsights(habits: Habit[], logs: HabitLog[], language: string): Promise<string> {
  try {
    const apiKey = getApiKey();
    
    // Debug logging
    console.log('🤖 AI Insight Debug:', {
      habitsCount: habits?.length || 0,
      logsCount: logs?.length || 0,
      hasApiKey: !!apiKey,
      language
    });
    
    if (!apiKey) {
      console.warn("No Gemini API key found. Set VITE_GEMINI_API_KEY in .env or add your key in Profile > AI Settings");
      return language === 'ar' 
        ? "⚠️ لم يتم العثور على مفتاح API. يرجى إضافة مفتاح Gemini في الإعدادات > AI Settings"
        : "⚠️ No API key found. Please add your Gemini API key in Profile > AI Settings";
    }
    
    // Check if we have data
    if (!habits || habits.length === 0) {
      return language === 'ar'
        ? "⚠️ لا توجد عادات لتحليلها. أضف بعض العادات أولاً."
        : "⚠️ No habits to analyze. Add some habits first.";
    }
    
    if (!logs || logs.length === 0) {
      return language === 'ar'
        ? "⚠️ لا توجد سجلات لتحليلها. سجل بعض العادات أولاً."
        : "⚠️ No logs to analyze. Log some habits first to get insights.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Data Summary Construction
    const prayerHabits = habits.filter(h => h.type === HabitType.PRAYER);
    const otherHabits = habits.filter(h => h.type !== HabitType.PRAYER && h.isActive);
    
    // Calculate prayer stats
    let totalPrayerLogs = 0;
    let takbirahCount = 0;
    let jamaaCount = 0;
    let onTimeCount = 0;
    let missedCount = 0;
    
    const prayerSummary = prayerHabits.map(h => {
        const habitLogs = logs.filter(l => l.habitId === h.id);
        const total = habitLogs.length;
        totalPrayerLogs += total;

        const takbirah = habitLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
        const jamaa = habitLogs.filter(l => l.value === PrayerQuality.JAMAA).length;
        const onTime = habitLogs.filter(l => l.value === PrayerQuality.ON_TIME).length;
        const missed = habitLogs.filter(l => l.value === PrayerQuality.MISSED).length;
        
        takbirahCount += takbirah;
        jamaaCount += jamaa;
        onTimeCount += onTime;
        missedCount += missed;
        
        const takbirahPct = total > 0 ? Math.round((takbirah / total) * 100) : 0;
        return `- ${h.name}: ${takbirahPct}% Takbirah (${takbirah}/${total}), Jamaa: ${jamaa}, OnTime: ${onTime}, Missed: ${missed}`;
    }).join('\n');
    
    const overallTakbirahPct = totalPrayerLogs > 0 ? Math.round((takbirahCount / totalPrayerLogs) * 100) : 0;
    
    // Collect obstacles/reasons
    const reasonsMap: Record<string, number> = {};
    logs.forEach(l => {
      if (l.reason && l.reason.trim()) {
        reasonsMap[l.reason] = (reasonsMap[l.reason] || 0) + 1;
      }
    });
    const topReasons = Object.entries(reasonsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => `${reason}: ${count} times`);
    
    // Other habits summary
    const habitSummary = otherHabits.slice(0, 8).map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id);
      const done = habitLogs.filter(l => l.status === LogStatus.DONE || (l.value && l.value > 0)).length;
      const total = habitLogs.length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return `- ${h.name}: ${rate}% success (${done}/${total})`;
    }).join('\n');

    const langPrompt = language === 'ar' ? "Respond in Arabic." : "Respond in English.";
    
    // Determine performance tier
    const isHighPerformer = overallTakbirahPct >= 70;
    const isMidPerformer = overallTakbirahPct >= 40 && overallTakbirahPct < 70;
    
    const prompt = `
You are a youthful, witty Islamic spiritual coach. Your tone is engaging, occasionally sarcastic (in a friendly way), but always constructive. Keep responses under 1 minute of reading time (max 150 words).

## USER'S PRAYER DATA:
Overall Takbirah Rate: ${overallTakbirahPct}%
${prayerSummary}

## OTHER HABITS:
${habitSummary || "No other habits tracked."}

## TOP OBSTACLES REPORTED:
${topReasons.length > 0 ? topReasons.join('\n') : "None recorded."}

## YOUR MISSION:
${isHighPerformer ? `
HIGH PERFORMER DETECTED (${overallTakbirahPct}% Takbirah). DO NOT praise them excessively. Instead:
- Remind them sincerity (Ikhlas) is what matters, not just showing up early
- Warn against self-admiration (Ujub) - "Don't let your good deeds make you arrogant"
- Urge them to pray for ACCEPTANCE (Qubool): "يا مقلب القلوب ثبت قلبي على دينك"
- A hint of sarcasm: "Impressive numbers... but does Allah see the same quality you see?"
` : isMidPerformer ? `
MID PERFORMER (${overallTakbirahPct}% Takbirah). Be direct:
- Acknowledge effort but push harder: "You're not bad, but 'not bad' won't get you to Jannah VIP section"
- Identify their top obstacle and give ONE actionable tip
- No sugarcoating: If Fajr is weak, call it out specifically
` : `
LOW PERFORMER (${overallTakbirahPct}% Takbirah). Be firm but hopeful:
- Be honest: "Let's not pretend this is okay"
- Pick their WORST prayer and focus advice on that one
- Give them ONE small win they can achieve this week
- End with hope: Every expert was once a beginner
`}

RULES:
1. NEVER say "Great job" or "Well done" for anything below 80% Takbirah
2. Always identify the WEAKEST area and address it directly
3. If obstacles are listed, call them out (e.g., "Sleep? Really? Set an alarm.")
4. Include one short, punchy Hadith or Quran reference
5. End with a specific, actionable next step

${langPrompt}
Format: Use bullet points, keep it scannable. No long paragraphs.
    `;

    // Debug: Log the prompt summary
    console.log('🤖 AI Prompt Summary:', {
      prayerHabitsCount: prayerHabits.length,
      otherHabitsCount: otherHabits.length,
      totalPrayerLogs,
      overallTakbirahPct,
      topReasons,
      promptLength: prompt.length
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    console.log('🤖 AI Response received:', response.text?.substring(0, 100) + '...');
    
    return response.text || "Could not generate insights.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'ar' 
      ? "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي." 
      : "Sorry, encountered an error connecting to the AI assistant.";
  }
}

export async function translateCustomHabits(habits: Habit[], targetLang: 'en' | 'ar'): Promise<Habit[]> {
  try {
    // Filter for custom habits (those starting with 'custom_') that need translation
    const customHabits = habits.filter(h => h.id.startsWith('custom_'));
    
    if (customHabits.length === 0) return habits;
    
    const apiKey = getApiKey();
    if (!apiKey) return habits;

    const ai = new GoogleGenAI({ apiKey });
    
    const habitsToTranslate = customHabits.map(h => ({
      id: h.id,
      name: h.name, // Current Name
      nameAr: h.nameAr // Current Arabic Name
    }));

    const prompt = `
      Translate the following habit names to ${targetLang === 'en' ? 'English' : 'Arabic'}.
      Return JSON only: [{ "id": "...", "translatedName": "..." }].
      
      Input: ${JSON.stringify(habitsToTranslate)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const translations = JSON.parse(response.text || '[]');
    
    // Merge translations back
    const updatedHabits = habits.map(h => {
      const translation = translations.find((t: any) => t.id === h.id);
      if (translation) {
        return {
          ...h,
          // If switching to EN, update 'name'. If switching to AR, update 'nameAr'.
          // Ensure we preserve the original if translation fails, but here we assume success.
          name: targetLang === 'en' ? translation.translatedName : h.name,
          nameAr: targetLang === 'ar' ? translation.translatedName : h.nameAr
        };
      }
      return h;
    });

    return updatedHabits;

  } catch (error) {
    console.error("Translation Error:", error);
    return habits; // Return original on failure
  }
}

export async function suggestIcon(habitName: string): Promise<string> {
  try {
    if (!habitName.trim()) return 'Activity';
    
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("No API key found, using default icon");
      return 'Activity';
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an expert icon selector. Choose the BEST matching icon from this list for the habit: "${habitName}"
      
      Available icons (choose ONE that fits best):
      ${AVAILABLE_ICONS.join(', ')}
      
      Rules:
      1. Return ONLY the icon name (e.g., "Dumbbell" or "BookOpen")
      2. Pick the most semantically relevant icon
      3. If unsure, return "Activity"
      4. NO explanations, JUST the icon name
      
      Examples:
      - "Morning Jog" → Dumbbell
      - "Read Quran" → BookOpen
      - "Drink Water" → Droplets
      - "Code Practice" → Code
      - "Family Time" → Users
      
      Habit: "${habitName}"
      Best icon:
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const suggestion = (response.text || 'Activity').trim();
    
    // Validate the suggestion is in our available icons
    if ((AVAILABLE_ICONS as string[]).includes(suggestion)) {
      console.log(`✨ AI suggested icon "${suggestion}" for habit "${habitName}"`);
      return suggestion;
    } else {
      console.warn(`AI suggested invalid icon "${suggestion}", using Activity`);
      return 'Activity';
    }
    
  } catch (error) {
    console.error("Icon suggestion error:", error);
    return 'Activity';
  }
}