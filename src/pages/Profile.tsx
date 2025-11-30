import React, { useState, useEffect } from 'react';
import { usePreferences } from '../App';
import { TRANSLATIONS } from '../../constants';
import { useData } from '../context/DataContext';
import { User, Globe, Database, Moon, Loader2, Hourglass, PlayCircle, StopCircle, LogOut, RotateCcw, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { Habit } from '../../types';
import { translateCustomHabits } from '../services/geminiService';
import { addYears, differenceInMilliseconds } from 'date-fns';
import DobModal from '../components/DobModal';
import { useAuth } from '../context/AuthContext';

// Helper to parse YYYY-MM-DD strings locally
const parseLocalISO = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(dateStr);
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const AnimatedCounter = ({ value, className, decimals = 0 }: { value: number, className?: string, decimals?: number }) => {
    return (
        <span className={className}>
            {value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        </span>
    );
};

const LifetimeProgress = ({ dobStr }: { dobStr: string }) => {
    try {
        const dob = parseLocalISO(dobStr);
        const now = new Date();
        const target = addYears(dob, 75);
        const totalLifeMs = differenceInMilliseconds(target, dob);
        const livedMs = differenceInMilliseconds(now, dob);
        const percentage = Math.min(Math.max((livedMs / totalLifeMs) * 100, 0), 100);

        return (
            <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Life Progress</span>
                   <span className="text-lg font-mono font-bold text-primary">{percentage.toFixed(5)}%</span>
                </div>
                <div className="w-full h-5 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800 shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-primary to-emerald-400 relative"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    } catch (e) { return null; }
};

const Profile: React.FC = () => {
  const { preferences, setPreferences } = usePreferences();
  const { user, signOut } = useAuth();
  const { habits, handleSaveHabit, handleSeedData } = useData();
  const t = TRANSLATIONS[preferences.language];
  
  const [message, setMessage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDobModalOpen, setIsDobModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Load API Key from LocalStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('user_openai_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('user_openai_key', val);
  };

  const handleLanguageChange = async (lang: 'en' | 'ar') => {
    if (lang === preferences.language) return;
    setIsTranslating(true);
    setPreferences({ ...preferences, language: lang });
    const updatedHabits = await translateCustomHabits(habits, lang);
    updatedHabits.forEach(h => handleSaveHabit(h));
    setIsTranslating(false);
  };

  const handleSeed = () => {
    handleSeedData();
    setMessage(t.seedSuccess);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleHabit = (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (id === 'rawatib_master') {
        const rawatibIds = ['fajr_sunnah', 'dhuhr_sunnah_before_1', 'dhuhr_sunnah_before_2', 'dhuhr_sunnah_after', 'maghrib_sunnah', 'isha_sunnah'];
        // Check if all currently active to toggle off, else toggle on
        const allActive = habits.filter(h => rawatibIds.includes(h.id)).every(h => h.isActive);
        const newState = !allActive;
        
        habits.forEach(h => {
            if (rawatibIds.includes(h.id)) {
                handleSaveHabit({ ...h, isActive: newState });
            }
        });
        return;
    }
    if (!habit) return;
    handleSaveHabit({ ...habit, isActive: !habit.isActive });
  };

  const toggleAllHabits = (active: boolean) => {
    habits.forEach(h => handleSaveHabit({ ...h, isActive: active }));
  };

  const isRawatibActive = habits.filter(h => h.presetId === 'rawatib').every(h => h.isActive);

  return (
    <div className="p-4 space-y-6 pb-32">
       <h1 className="text-2xl font-bold text-white mb-4">{t.profile}</h1>

       {/* User Card */}
       <div className="glass-card p-6 rounded-2xl flex items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
                <User size={32} className="text-gray-400" />
            </div>
            <div>
                <h2 className="font-bold text-lg text-white">{user?.email || 'User'}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsDobModalOpen(true)} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full border border-slate-700 text-gray-400 transition-colors">
                        {t.setDob}
                    </button>
                </div>
            </div>
         </div>
         <button 
            onClick={signOut}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
            title="Sign Out"
         >
            <LogOut size={20} />
         </button>
       </div>

       {/* Preferences */}
       <div className="glass-card p-5 rounded-2xl">
         <h3 className="font-bold text-white mb-4 flex items-center gap-2">
           <Globe size={18} className="text-primary" /> {t.language}
         </h3>
         <div className="flex gap-3 bg-slate-900 p-1.5 rounded-xl relative">
           {isTranslating && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-white text-xs font-bold">
                      <Loader2 size={14} className="animate-spin" /> {t.translating}
                  </div>
              </div>
           )}
           <button onClick={() => handleLanguageChange('en')} className={clsx("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all", preferences.language === 'en' ? "bg-slate-700 text-white shadow-sm" : "text-gray-400 hover:text-white")}>English</button>
           <button onClick={() => handleLanguageChange('ar')} className={clsx("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all font-arabic", preferences.language === 'ar' ? "bg-slate-700 text-white shadow-sm" : "text-gray-400 hover:text-white")}>العربية</button>
         </div>

         <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-gray-300 flex items-center gap-2"><Calendar size={16} /> Hijri Date</span>
            <button 
                onClick={() => setPreferences({ ...preferences, showHijri: !preferences.showHijri })}
                className={clsx("w-12 h-6 rounded-full relative transition-colors", preferences.showHijri ? "bg-primary" : "bg-slate-700")}
            >
                <div className={clsx("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", preferences.showHijri ? "right-1" : "left-1")} />
            </button>
         </div>
       </div>

       {/* AI Settings (BYOK) */}
       <div className="glass-card p-5 rounded-2xl">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
             <Database size={18} className="text-purple-500" /> AI Settings
          </h3>
          <p className="text-xs text-gray-500 mb-3">Enter your OpenAI API Key to enable smart insights (Stored locally on your device).</p>
          <input 
            type="password" 
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="sk-..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
          />
       </div>

       {/* Islamic Presets */}
       <div className="glass-card p-5 rounded-2xl">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Moon size={18} className="text-yellow-500" /> Islamic Habits</h3>
            <div className="flex gap-2">
                <button onClick={() => toggleAllHabits(true)} className="text-[10px] font-bold bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg border border-green-500/30 flex items-center gap-1"><PlayCircle size={12} /> {t.activateAll}</button>
                <button onClick={() => toggleAllHabits(false)} className="text-[10px] font-bold bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center gap-1"><StopCircle size={12} /> {t.deactivateAll}</button>
            </div>
         </div>
         
         <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                <div>
                    <h4 className="font-bold text-sm text-white">Rawatib (Sunnah Prayers)</h4>
                    <p className="text-xs text-gray-400">Activates all 6 confirmed Sunnahs</p>
                </div>
                <button onClick={() => toggleHabit('rawatib_master')} className={clsx("w-12 h-7 rounded-full transition-colors relative", isRawatibActive ? "bg-primary" : "bg-slate-700")}>
                    <div className={clsx("w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-all", isRawatibActive ? "right-1" : "left-1")} />
                </button>
            </div>
            {habits.filter(h => h.type === 'REGULAR' && h.id !== 'rawatib_master' && !h.id.startsWith('custom_') && h.presetId !== 'rawatib').map(habit => (
                <div key={habit.id} className="flex items-center justify-between p-3 hover:bg-slate-900/50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{habit.emoji || '🔹'}</span>
                        <span className="text-sm font-medium text-gray-200">{preferences.language === 'ar' ? habit.nameAr : habit.name}</span>
                    </div>
                    <button onClick={() => toggleHabit(habit.id)} className={clsx("w-10 h-5 rounded-full transition-colors relative flex-shrink-0", habit.isActive ? "bg-primary/80" : "bg-slate-700")}>
                        <div className={clsx("w-3 h-3 bg-white rounded-full absolute top-1 transition-all", habit.isActive ? "right-1" : "left-1")} />
                    </button>
                </div>
            ))}
         </div>
       </div>

       {/* Developer Tools */}
       <div className="glass-card p-5 rounded-2xl">
         <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Database size={18} className="text-yellow-500" /> Developer Tools</h3>
         <div className="flex gap-2">
             <button onClick={handleSeed} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold text-gray-300 transition-colors flex items-center justify-center gap-2">
               {t.seedData}
             </button>
             {user?.isDemo && (
                 <button onClick={() => { localStorage.removeItem('haseeb_demo_persona'); window.location.reload(); }} className="flex-1 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-sm font-bold text-yellow-500 transition-colors flex items-center justify-center gap-2">
                    <RotateCcw size={14} /> Reset Demo
                 </button>
             )}
         </div>
         {message && <p className="text-green-500 text-xs mt-2 text-center">{message}</p>}
       </div>
       
       <DobModal isOpen={isDobModalOpen} onClose={() => setIsDobModalOpen(false)} />
    </div>
  );
};

export default Profile;