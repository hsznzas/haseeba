import { GoogleGenAI } from "@google/genai";
import { Habit, HabitLog, HabitType, PrayerQuality, LogStatus } from '../../types';
import { AVAILABLE_ICONS } from '../utils/iconMap';

export async function generateSpiritualInsights(habits: Habit[], logs: HabitLog[], language: string): Promise<string> {
  try {
    if (!process.env.API_KEY) {
       console.warn("API_KEY not found in env");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Data Summary Construction
    const summary = habits.map(h => {
        const habitLogs = logs.filter(l => l.habitId === h.id);
        const total = habitLogs.length;

        if (h.type === HabitType.PRAYER) {
          const takbirah = habitLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
          const jamaa = habitLogs.filter(l => l.value === PrayerQuality.JAMAA).length;
          const onTime = habitLogs.filter(l => l.value === PrayerQuality.ON_TIME).length;
          const missed = habitLogs.filter(l => l.value === PrayerQuality.MISSED).length;
          
          return `- ${h.name} (Prayer): Total ${total} days logged. 
             PERFECT (Takbirah): ${takbirah} (Only this is considered a true success).
             GOOD BUT NOT PERFECT (In Group): ${jamaa}.
             NEEDS IMPROVEMENT (On Time): ${onTime}.
             FAILED (Missed): ${missed}.`;
        } else {
          const done = habitLogs.filter(l => l.status === LogStatus.DONE || (l.value && l.value > 0)).length;
          return `- ${h.name}: Completed ${done} times in last 30 days.`;
        }
    }).join('\n');

    const langPrompt = language === 'ar' ? "Respond in Arabic." : "Respond in English.";
    
    const prompt = `
      You are a wise and strict but compassionate Islamic spiritual coach. 
      Here is the user's habit tracking data for the last 30 days:
      
      ${summary}
      
      CRITICAL RULES FOR YOUR ANALYSIS:
      1. For Prayers, ONLY "Takbirah" (Level 3) is considered a success/perfect score.
      2. "In Group" (Jamaa) is good, but clearly state it is not the highest level.
      3. "On Time" or "Missed" should be treated as needing serious improvement. 
      4. If the user has a low percentage of "Takbirah" (e.g. 11%), DO NOT say "Well done" overall. Be honest that they are missing the highest reward.
      5. Be encouraging, but do not give false praise for mediocre performance.

      Please provide:
      1. A breakdown of their spiritual quality (Focus heavily on whether they are reaching Takbirah or just praying on time).
      2. A gentle but firm suggestion for improvement.
      3. A relevant short Quran verse or Hadith about the excellence of the first Takbirah or early prayer.
      
      ${langPrompt}
      Keep the tone inspiring. Format as Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

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
    if (!process.env.API_KEY) return habits;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
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
    if (!process.env.API_KEY) {
      console.warn("API_KEY not found, using default icon");
      return 'Activity';
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
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