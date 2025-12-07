import { GoogleGenAI } from "@google/genai";
import { Habit, HabitLog, DailyBriefing } from '../../types';
import { buildDailyBriefingPrompt } from '../ai/promptBuilder';
import { format } from 'date-fns';

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

// Generate cache key for today
function getCacheKey(): string {
  const today = format(new Date(), 'yyyy-MM-dd');
  return `haseeb_daily_briefing_${today}`;
}

// Clean JSON response from potential markdown formatting
function cleanJsonResponse(response: string): string {
  return response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

// Get cached briefing if available
export function getCachedBriefing(): DailyBriefing | null {
  try {
    const cacheKey = getCacheKey();
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as DailyBriefing;
    }
  } catch (error) {
    console.error('Error reading cached briefing:', error);
  }
  return null;
}

// Clear today's cache (useful for forcing refresh)
export function clearBriefingCache(): void {
  const cacheKey = getCacheKey();
  localStorage.removeItem(cacheKey);
}

// Default/fallback briefing for error cases
function getDefaultBriefing(language: string): DailyBriefing {
  const isArabic = language === 'ar';
  return {
    home_advice: isArabic 
      ? 'ركز على صلاة واحدة اليوم وأتقنها.' 
      : 'Focus on one prayer today and perfect it.',
    analytics_insight: isArabic 
      ? 'سجّل المزيد من البيانات للحصول على تحليل مفصل.' 
      : 'Log more data to get detailed analysis.',
    five_prayers_focus: isArabic 
      ? 'حافظ على الصلوات الخمس في وقتها.' 
      : 'Maintain all five prayers on time.',
    rawatib_focus: isArabic 
      ? 'السنن الرواتب تكمّل النقص في الفرائض.' 
      : 'Rawatib prayers complement any gaps in obligatory prayers.',
    timestamp: new Date().toISOString(),
  };
}

// Main function to generate daily briefing
export async function generateDailyBriefing(
  habits: Habit[], 
  logs: HabitLog[], 
  language: string
): Promise<DailyBriefing> {
  // 1. Check cache first
  const cached = getCachedBriefing();
  if (cached) {
    console.log('🧠 AI Briefing: Using cached briefing from today');
    return cached;
  }

  // 2. Check for API key
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('🧠 AI Briefing: No API key found');
    return {
      ...getDefaultBriefing(language),
      home_advice: language === 'ar' 
        ? '⚠️ لم يتم العثور على مفتاح API. أضف المفتاح في الإعدادات.' 
        : '⚠️ No API key found. Add your key in Settings.',
    };
  }

  // 3. Check if we have enough data
  if (!habits || habits.length === 0 || !logs || logs.length === 0) {
    console.log('🧠 AI Briefing: Insufficient data for analysis');
    return getDefaultBriefing(language);
  }

  try {
    console.log('🧠 AI Briefing: Generating new briefing...');
    
    // 4. Build prompt
    const prompt = buildDailyBriefingPrompt(habits, logs, language);
    
    // 5. Call Gemini API
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    console.log('🧠 AI Briefing: Raw response received');

    // 6. Clean and parse JSON
    const cleanedJson = cleanJsonResponse(responseText);
    
    let parsed: Partial<DailyBriefing>;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('🧠 AI Briefing: JSON parse error, attempting fallback parse');
      // Try to extract JSON from response if it contains extra text
      const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    // 7. Construct briefing with timestamp
    const briefing: DailyBriefing = {
      home_advice: parsed.home_advice || getDefaultBriefing(language).home_advice,
      analytics_insight: parsed.analytics_insight || getDefaultBriefing(language).analytics_insight,
      five_prayers_focus: parsed.five_prayers_focus || getDefaultBriefing(language).five_prayers_focus,
      rawatib_focus: parsed.rawatib_focus || getDefaultBriefing(language).rawatib_focus,
      timestamp: new Date().toISOString(),
    };

    // 8. Cache the briefing
    const cacheKey = getCacheKey();
    localStorage.setItem(cacheKey, JSON.stringify(briefing));
    console.log('🧠 AI Briefing: Cached successfully');

    return briefing;

  } catch (error) {
    console.error('🧠 AI Briefing Error:', error);
    return {
      ...getDefaultBriefing(language),
      home_advice: language === 'ar' 
        ? '⚠️ حدث خطأ أثناء التحليل. حاول مرة أخرى.' 
        : '⚠️ Error during analysis. Please try again.',
    };
  }
}

// Force regenerate (clears cache and generates new)
export async function regenerateBriefing(
  habits: Habit[], 
  logs: HabitLog[], 
  language: string
): Promise<DailyBriefing> {
  clearBriefingCache();
  return generateDailyBriefing(habits, logs, language);
}

