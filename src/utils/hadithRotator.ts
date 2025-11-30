import hadithDB from '../data/hadiths.json';
import { differenceInDays, startOfYear } from 'date-fns';

export interface Hadith {
  text: string;
  source: string;
}

type HadithCategory = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'general';

const prayerIdToCategory: Record<string, HadithCategory> = {
  'fajr': 'fajr',
  'fajr_sunnah': 'fajr',
  'dhuhr': 'dhuhr',
  'dhuhr_sunnah_before_1': 'dhuhr',
  'dhuhr_sunnah_before_2': 'dhuhr',
  'dhuhr_sunnah_after': 'dhuhr',
  'asr': 'asr',
  'maghrib': 'maghrib',
  'maghrib_sunnah': 'maghrib',
  'isha': 'isha',
  'isha_sunnah': 'isha',
  'witr': 'isha',
};

export function getDailyHadith(prayerId: string): Hadith {
  const category = prayerIdToCategory[prayerId] || 'general';
  
  const hadithList = (hadithDB as Record<string, Hadith[]>)[category] || 
                     (hadithDB as Record<string, Hadith[]>)['general'] ||
                     (hadithDB as Record<string, Hadith[]>)['fajr'] || [];
  
  if (hadithList.length === 0) {
    return {
      text: 'اللهم صل على محمد وعلى آل محمد',
      source: 'Default'
    };
  }
  
  const today = new Date();
  const dayOfYear = differenceInDays(today, startOfYear(today));
  
  const index = dayOfYear % hadithList.length;
  
  return hadithList[index];
}

export function getHadithForPrayer(prayerName: string): Hadith {
  const normalizedName = prayerName.toLowerCase();
  
  for (const [id, category] of Object.entries(prayerIdToCategory)) {
    if (normalizedName.includes(id) || id.includes(normalizedName)) {
      return getDailyHadith(id);
    }
  }
  
  return getDailyHadith('general');
}
