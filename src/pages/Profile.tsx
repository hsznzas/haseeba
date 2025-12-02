import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../App';
import { TRANSLATIONS, INITIAL_HABITS } from '../../constants';
import { useData } from '../context/DataContext';
import { User, Globe, Moon, Loader2, PlayCircle, StopCircle, LogOut, RotateCcw, Calendar, Home, Hourglass, MessageSquare, X, Sparkles, Database, Info, Edit2, Trash2, AlertTriangle, Plus, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { translateCustomHabits } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { differenceInMonths, differenceInYears, addYears } from 'date-fns';
import { HabitType, CustomReason } from '../../types';
import { ICON_MAP, IconName } from '../utils/iconMap';

// Inline Tooltip for column headers
const ColumnTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-flex items-center ml-1">
    <Info size={10} className="text-gray-600 hover:text-gray-400 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-40 p-2 bg-slate-900 text-[10px] text-white text-center rounded-lg border border-slate-700 shadow-xl z-50">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  </div>
);

// Custom Reasons Settings Section
const CustomReasonsSection: React.FC = () => {
  const { preferences } = usePreferences();
  const { customReasons, handleSaveCustomReason, handleDeleteCustomReason, logs } = useData();
  const isArabic = preferences.language === 'ar';
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteWarning, setShowDeleteWarning] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');

  // Check if a reason is used in any logs
  const getReasonUsageCount = (reasonText: string) => {
    return logs.filter(l => l.reason === reasonText).length;
  };

  const handleEdit = (reason: CustomReason) => {
    setEditingId(reason.id);
    setEditText(reason.reason_text);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    
    const existing = customReasons.find(r => r.id === editingId);
    if (existing) {
      await handleSaveCustomReason({
        ...existing,
        reason_text: editText.trim(),
      });
    }
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (reasonId: string) => {
    await handleDeleteCustomReason(reasonId);
    setShowDeleteWarning(null);
  };

  const handleAddNew = async () => {
    if (!newReasonText.trim()) return;
    
    const newReason: CustomReason = {
      id: `custom_${Date.now()}`,
      reason_text: newReasonText.trim(),
      createdAt: new Date().toISOString()
    };
    await handleSaveCustomReason(newReason);
    setIsAddingNew(false);
    setNewReasonText('');
  };

  if (customReasons.length === 0 && !isAddingNew) {
    return (
      <div className="glass-card p-5 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-cyan-500" />
            {isArabic ? 'الأسباب المخصصة' : 'Custom Reasons'}
          </h3>
        </div>
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 mb-3">
            {isArabic ? 'لا توجد أسباب مخصصة. أضف سبباً جديداً عند تسجيل العادات.' : 'No custom reasons yet. Add one when logging habits.'}
          </p>
          <button
            onClick={() => setIsAddingNew(true)}
            className="text-xs bg-cyan-500/10 text-cyan-500 px-3 py-2 rounded-lg border border-cyan-500/30 flex items-center gap-1 mx-auto"
          >
            <Plus size={12} /> {isArabic ? 'إضافة سبب' : 'Add Reason'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <MessageSquare size={18} className="text-cyan-500" />
          {isArabic ? 'الأسباب المخصصة' : 'Custom Reasons'}
          <ColumnTooltip text={isArabic ? 'إدارة الأسباب المخصصة للعادات الفاشلة' : 'Manage custom reasons for failed habits'} />
        </h3>
        <button
          onClick={() => setIsAddingNew(true)}
          className="text-[10px] font-bold bg-cyan-500/10 text-cyan-500 px-2 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1"
        >
          <Plus size={10} /> {isArabic ? 'إضافة' : 'Add'}
        </button>
      </div>

      {/* Add New Reason Form */}
      {isAddingNew && (
        <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-cyan-500/30">
          <input
            type="text"
            value={newReasonText}
            onChange={(e) => setNewReasonText(e.target.value)}
            placeholder={isArabic ? 'اسم السبب...' : 'Reason name...'}
            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddNew}
              disabled={!newReasonText.trim()}
              className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1"
            >
              <Check size={14} /> {isArabic ? 'حفظ' : 'Save'}
            </button>
            <button
              onClick={() => { setIsAddingNew(false); setNewReasonText(''); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-gray-400"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Reasons List */}
      <div className="space-y-2">
        {customReasons.map((reason) => {
          const usageCount = getReasonUsageCount(reason.reason_text);
          const isEditing = editingId === reason.id;
          const isDeleting = showDeleteWarning === reason.id;

          return (
            <div key={reason.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
              {isEditing ? (
                // Edit Mode
                <div>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="flex-1 py-1.5 bg-cyan-500 rounded-lg text-xs font-bold text-white">
                      {isArabic ? 'حفظ' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-gray-400">
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : isDeleting ? (
                // Delete Warning
                <div className="text-center py-2">
                  <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold">{isArabic ? 'تحذير' : 'Warning'}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-3">
                    {usageCount > 0 
                      ? (isArabic 
                          ? `${usageCount} سجل سيفقد السبب` 
                          : `${usageCount} logs will lose this reason`)
                      : (isArabic ? 'هل تريد حذف هذا السبب؟' : 'Delete this reason?')}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleDelete(reason.id)} className="px-3 py-1.5 bg-red-500 rounded-lg text-xs font-bold text-white">
                      {isArabic ? 'حذف' : 'Delete'}
                    </button>
                    <button onClick={() => setShowDeleteWarning(null)} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-gray-400">
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                // Normal View
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{reason.reason_text}</h4>
                    <p className="text-[9px] text-gray-600 mt-1">
                      {isArabic ? `${usageCount} استخدام` : `Used ${usageCount} times`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(reason)}
                      className="p-1.5 text-gray-500 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setShowDeleteWarning(reason.id)}
                      className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, setPreferences } = usePreferences();
  const { user, signOut } = useAuth();
  const { habits, handleSaveHabit, handleSeedData } = useData();
  const t = TRANSLATIONS[preferences.language];
  
  const [message, setMessage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showDobModal, setShowDobModal] = useState(false);
  const [dobInput, setDobInput] = useState(preferences.dateOfBirth || '');

  // Lifetime Countdown calculation with more metrics
  const lifetimeStats = useMemo(() => {
    if (!preferences.dateOfBirth) return null;
    
    try {
      const dob = new Date(preferences.dateOfBirth);
      const targetAge = 75;
      const targetDate = addYears(dob, targetAge);
      const now = new Date();
      
      if (targetDate <= now) return null;
      
      // Time calculations
      const totalMs = targetDate.getTime() - now.getTime();
      const secondsLeft = Math.floor(totalMs / 1000);
      const minutesLeft = Math.floor(totalMs / (1000 * 60));
      const hoursLeft = Math.floor(totalMs / (1000 * 60 * 60));
      const daysLeft = Math.floor(totalMs / (1000 * 60 * 60 * 24));
      const weeksLeft = Math.floor(daysLeft / 7);
      const monthsLeft = differenceInMonths(targetDate, now);
      const yearsLeft = differenceInYears(targetDate, now);
      
      // Life progress percentage
      const totalLifeMs = targetDate.getTime() - dob.getTime();
      const livedMs = now.getTime() - dob.getTime();
      const lifeProgress = (livedMs / totalLifeMs) * 100;
      
      // Islamic calculations
      const fridaysLeft = Math.floor(daysLeft / 7);
      const ramadansLeft = yearsLeft;
      const hajjsLeft = yearsLeft;
      const monThuLeft = Math.floor(daysLeft / 7) * 2;
      
      // White days (13th, 14th, 15th of each lunar month) - approximately 3 per month
      const whiteDaysLeft = monthsLeft * 3;
      
      return {
        secondsLeft,
        minutesLeft,
        hoursLeft,
        daysLeft,
        weeksLeft,
        monthsLeft,
        yearsLeft,
        lifeProgress,
        fridaysLeft,
        ramadansLeft,
        hajjsLeft,
        monThuLeft,
        whiteDaysLeft,
      };
    } catch (e) {
      return null;
    }
  }, [preferences.dateOfBirth]);

  // Load API Key from LocalStorage on mount
  useEffect(() => {
    // Check new key first, then legacy key for backwards compatibility
    const storedKey = localStorage.getItem('haseeb_gemini_key') || localStorage.getItem('user_openai_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('haseeb_gemini_key', val);
    // Also keep legacy key for backwards compatibility with geminiService
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

  const handleSaveDob = () => {
    if (!dobInput) return;
    setPreferences({
      ...preferences,
      dateOfBirth: dobInput
    });
    setShowDobModal(false);
  };

  const toggleHabit = (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (id === 'rawatib_master') {
        const rawatibIds = ['fajr_sunnah', 'dhuhr_sunnah_before_1', 'dhuhr_sunnah_before_2', 'dhuhr_sunnah_after', 'maghrib_sunnah', 'isha_sunnah'];
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

  // Helper to get icon for a habit
  const getHabitIcon = (habit: { id: string; icon?: string; emoji?: string }) => {
    // First check if habit has an icon defined
    const iconName = habit.icon || INITIAL_HABITS.find(h => h.id === habit.id)?.icon;
    if (iconName && ICON_MAP[iconName as IconName]) {
      return ICON_MAP[iconName as IconName];
    }
    // Fallback to a default icon
    return ICON_MAP.Activity;
  };

  // Helper to get color for a habit
  const getHabitColor = (habit: { id: string; color?: string }) => {
    const color = habit.color || INITIAL_HABITS.find(h => h.id === habit.id)?.color;
    return color || '#10b981';
  };

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
                <p className="text-xs text-gray-500">{user?.isDemo ? 'Demo Account' : 'Logged In'}</p>
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

       {/* Lifetime Countdown - Moved above language settings */}
       <div className="glass-card rounded-2xl overflow-hidden">
         {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-slate-800">
           <h3 className="font-bold text-white flex items-center gap-2">
             <Hourglass size={18} className="text-amber-500" />
             {preferences.language === 'ar' ? 'العد التنازلي للعمر (حتى ٧٥)' : 'Life Countdown (to 75)'}
           </h3>
           <button 
             onClick={() => { setDobInput(preferences.dateOfBirth || ''); setShowDobModal(true); }}
             className="text-xs text-emerald-500 hover:text-emerald-400 font-medium"
           >
             {preferences.language === 'ar' ? 'تعديل التاريخ' : 'Edit DOB'}
           </button>
         </div>

         {lifetimeStats ? (
           <div className="p-4 space-y-4">
             {/* Life Progress Bar */}
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <span className="text-2xl font-bold text-emerald-400 font-mono">
                   {lifetimeStats.lifeProgress.toFixed(5)}%
                 </span>
                 <span className="text-xs text-gray-400 uppercase tracking-wider">LIFE PROGRESS</span>
               </div>
               <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                 <div 
                   className="h-full rounded-full absolute left-0 top-0"
                   style={{
                     width: `${lifetimeStats.lifeProgress}%`,
                     background: 'linear-gradient(90deg, #0ea5e9, #10b981, #22c55e)',
                   }}
                 />
               </div>
             </div>

             {/* Large Metrics: Seconds & Minutes */}
             <div className="space-y-3">
               <div className="bg-slate-900/80 rounded-xl p-4 text-center border border-slate-800">
                 <p className="text-3xl md:text-4xl font-bold text-rose-400 font-mono">
                   {lifetimeStats.secondsLeft.toLocaleString()}
                 </p>
                 <p className="text-xs text-gray-400 mt-1">
                   {preferences.language === 'ar' ? 'ثانية' : 'seconds'}
                 </p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-4 text-center border border-slate-800">
                 <p className="text-3xl md:text-4xl font-bold text-cyan-400 font-mono">
                   {lifetimeStats.minutesLeft.toLocaleString()}
                 </p>
                 <p className="text-xs text-gray-400 mt-1">
                   {preferences.language === 'ar' ? 'دقيقة' : 'minutes'}
                 </p>
               </div>
             </div>

             {/* Grid of Metrics */}
             <div className="grid grid-cols-3 gap-2">
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-rose-400 font-mono">{lifetimeStats.ramadansLeft}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'رمضان' : 'Ramadan'}</p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-cyan-400 font-mono">{lifetimeStats.daysLeft.toLocaleString()}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'يوم' : 'days'}</p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-amber-400 font-mono">{lifetimeStats.hoursLeft.toLocaleString()}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'ساعة' : 'hours'}</p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-rose-400 font-mono">{lifetimeStats.fridaysLeft.toLocaleString()}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'جمعة' : 'Fridays'}</p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-white font-mono">{lifetimeStats.monThuLeft.toLocaleString()}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'إثنين وخميس' : 'Mon & Thu'}</p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-white font-mono">{lifetimeStats.whiteDaysLeft.toLocaleString()}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'أيام بيض' : 'White Days'}</p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-rose-400 font-mono">{lifetimeStats.yearsLeft}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'سنة' : 'years'}</p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-white font-mono">{lifetimeStats.monthsLeft}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'شهر' : 'months'}</p>
               </div>
               <div className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800">
                 <p className="text-xl font-bold text-white font-mono">{lifetimeStats.hajjsLeft}</p>
                 <p className="text-[10px] text-gray-400">{preferences.language === 'ar' ? 'حج' : 'Hajj'}</p>
               </div>
             </div>
           </div>
         ) : (
           <div className="p-6 text-center">
             <p className="text-sm text-gray-400 mb-4">{t.dobDesc}</p>
             <button 
               onClick={() => setShowDobModal(true)}
               className="py-3 px-6 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-sm font-bold text-amber-500 transition-colors"
             >
               {t.setDob}
             </button>
           </div>
         )}
       </div>

       {/* DOB Modal */}
       {showDobModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 shadow-2xl">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-foreground">{t.dobTitle}</h2>
               <button onClick={() => setShowDobModal(false)} className="text-gray-400 hover:text-white">
                 <X size={20} />
               </button>
             </div>
             
             <p className="text-sm text-gray-400 mb-6">{t.dobDesc}</p>

             <div className="space-y-4">
               <input 
                 type="date" 
                 value={dobInput}
                 onChange={(e) => setDobInput(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none [color-scheme:dark]"
               />

               <div className="flex gap-3">
                 <button onClick={() => setShowDobModal(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-gray-300 font-medium">
                   {t.cancel}
                 </button>
                 <button onClick={handleSaveDob} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold">
                   {t.save}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

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

       {/* AI Settings (BYOK - Gemini) */}
       <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
               <Sparkles size={18} className="text-purple-500" /> 
               {preferences.language === 'ar' ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
          </h3>
            {apiKey && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ✓ {preferences.language === 'ar' ? 'متصل' : 'Connected'}
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-400 mb-3">
            {preferences.language === 'ar' 
              ? 'أضف مفتاح Gemini API للحصول على تحليلات ذكية مخصصة.'
              : 'Add your Gemini API key to unlock personalized AI insights.'}
          </p>
          
          <div className="relative">
          <input 
            type="password" 
            value={apiKey}
            onChange={handleApiKeyChange}
              placeholder="AIza..."
              className={clsx(
                "w-full bg-slate-900 border rounded-xl p-3 text-white text-sm focus:outline-none pr-20",
                apiKey ? "border-emerald-500/50 focus:border-emerald-500" : "border-slate-800 focus:border-purple-500"
              )}
            />
            {apiKey && (
              <button
                onClick={() => { setApiKey(''); localStorage.removeItem('haseeb_gemini_key'); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                {preferences.language === 'ar' ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
          
          <div className="mt-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
            <p className="text-[10px] text-gray-500 mb-2">
              <span className="text-purple-400 font-bold">🔒 {preferences.language === 'ar' ? 'آمن:' : 'Secure:'}</span>{' '}
              {preferences.language === 'ar' 
                ? 'مفتاحك مخزن على جهازك فقط ولا يُرسل إلا مباشرة إلى Google.'
                : 'Your key is stored only on your device and sent directly to Google.'}
            </p>
            <a 
              href="https://aistudio.google.com/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-purple-400 hover:text-purple-300 underline"
            >
              {preferences.language === 'ar' ? '🔗 احصل على مفتاح مجاني من Google AI Studio' : '🔗 Get a free key from Google AI Studio'}
            </a>
          </div>
       </div>

       {/* Habits Settings - All habits with Activity and Reason toggles */}
       <div className="glass-card p-5 rounded-2xl">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Moon size={18} className="text-yellow-500" /> 
              {preferences.language === 'ar' ? 'إعدادات العادات' : 'Habits Settings'}
            </h3>
            <div className="flex gap-2">
                <button onClick={() => toggleAllHabits(true)} className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded-lg border border-green-500/30 flex items-center gap-1">
                  <PlayCircle size={10} /> {t.activateAll}
                </button>
                <button onClick={() => toggleAllHabits(false)} className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded-lg border border-red-500/30 flex items-center gap-1">
                  <StopCircle size={10} /> {t.deactivateAll}
                </button>
            </div>
         </div>
         
         {/* Column Headers */}
         <div className="flex items-center gap-2 mb-2 px-3 text-[9px] text-gray-500 uppercase tracking-wider border-b border-slate-800 pb-2">
           <div className="flex-1">{preferences.language === 'ar' ? 'العادة' : 'Habit'}</div>
           <div className="w-14 text-center flex items-center justify-center">
             {preferences.language === 'ar' ? 'نشط' : 'Active'}
             <ColumnTooltip text={preferences.language === 'ar' ? 'تفعيل/تعطيل العادة من الشاشة الرئيسية' : 'Enable/disable this habit on the home screen'} />
                </div>
           <div className="w-14 text-center flex items-center justify-center">
             <MessageSquare size={8} className="mr-0.5" />
             {preferences.language === 'ar' ? 'سبب' : 'Reason'}
             <ColumnTooltip text={preferences.language === 'ar' ? 'عند الفشل، هل تريد إدخال سبب؟' : 'When failed, prompt for a reason?'} />
                </div>
         </div>
         
         <div className="space-y-1">
           {/* Rawatib Master Toggle */}
           <div className="flex items-center gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
             <div className="flex-1 min-w-0 flex items-center gap-2">
               {(() => {
                 const IconComp = ICON_MAP.Star;
                 return <IconComp size={18} style={{ color: '#38bdf8' }} className="shrink-0" />;
               })()}
               <div>
                 <h4 className="text-sm font-bold text-white">Rawatib</h4>
                 <p className="text-[10px] text-gray-500">{preferences.language === 'ar' ? '٦ سنن مؤكدة' : '6 confirmed Sunnahs'}</p>
       </div>
             </div>
             {/* Activity Toggle */}
             <div className="w-14 flex justify-center">
               <button 
                 onClick={() => toggleHabit('rawatib_master')} 
                 className={clsx("w-9 h-5 rounded-full transition-colors relative", isRawatibActive ? "bg-emerald-500" : "bg-slate-700")}
               >
                 <div className={clsx("w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] shadow-sm transition-all", isRawatibActive ? "right-[3px]" : "left-[3px]")} />
               </button>
             </div>
             {/* Reason Toggle - affects all rawatib */}
             <div className="w-14 flex justify-center">
               <button 
                 onClick={() => {
                   const rawatibIds = ['fajr_sunnah', 'dhuhr_sunnah_before_1', 'dhuhr_sunnah_before_2', 'dhuhr_sunnah_after', 'maghrib_sunnah', 'isha_sunnah'];
                   const allRequireReason = habits.filter(h => rawatibIds.includes(h.id)).every(h => h.requireReason !== false);
                   habits.filter(h => rawatibIds.includes(h.id)).forEach(h => {
                     handleSaveHabit({ ...h, requireReason: !allRequireReason });
                   });
                 }}
                 className={clsx(
                   "w-9 h-5 rounded-full transition-colors relative",
                   habits.filter(h => h.presetId === 'rawatib').every(h => h.requireReason !== false) ? "bg-cyan-500" : "bg-slate-700"
                 )}
               >
                 <div className={clsx(
                   "w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] shadow-sm transition-all",
                   habits.filter(h => h.presetId === 'rawatib').every(h => h.requireReason !== false) ? "right-[3px]" : "left-[3px]"
                 )} />
               </button>
             </div>
           </div>

           {/* All Non-Prayer Habits (excluding rawatib which are handled above) */}
           {habits
             .filter(h => h.type !== HabitType.PRAYER && h.presetId !== 'rawatib')
             .sort((a, b) => a.order - b.order)
             .map(habit => {
               const displayName = preferences.language === 'ar' ? (habit.nameAr || habit.name) : habit.name;
               const IconComp = getHabitIcon(habit);
               const iconColor = getHabitColor(habit);
               
               return (
                 <div 
                   key={habit.id} 
                   className="flex items-center gap-2 p-2.5 hover:bg-slate-900/50 rounded-xl transition-colors"
                 >
                   {/* Habit Name with Icon */}
                   <div className="flex-1 min-w-0 flex items-center gap-2">
                     <IconComp size={18} style={{ color: habit.isActive ? iconColor : '#6b7280' }} className="shrink-0" />
                     <span className={clsx(
                       "text-sm font-medium truncate",
                       habit.isActive ? "text-gray-200" : "text-gray-500"
                     )}>
                       {displayName}
                     </span>
             </div>
                   
                   {/* Activity Toggle */}
                   <div className="w-14 flex justify-center">
                     <button 
                       onClick={() => handleSaveHabit({ ...habit, isActive: !habit.isActive })}
                       className={clsx(
                         "w-9 h-5 rounded-full transition-colors relative",
                         habit.isActive ? "bg-emerald-500" : "bg-slate-700"
                       )}
                     >
                       <div className={clsx(
                         "w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all",
                         habit.isActive ? "right-[3px]" : "left-[3px]"
                       )} />
                     </button>
             </div>
                   
                   {/* Reason Toggle */}
                   <div className="w-14 flex justify-center">
                     <button 
                       onClick={() => handleSaveHabit({ ...habit, requireReason: habit.requireReason === false ? true : false })}
                       className={clsx(
                         "w-9 h-5 rounded-full transition-colors relative",
                         habit.requireReason !== false ? "bg-cyan-500" : "bg-slate-700"
                       )}
                     >
                       <div className={clsx(
                         "w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all",
                         habit.requireReason !== false ? "right-[3px]" : "left-[3px]"
                       )} />
                     </button>
             </div>
           </div>
               );
             })}
         </div>
         
         {habits.filter(h => h.type !== HabitType.PRAYER).length === 0 && (
           <p className="text-xs text-gray-500 text-center py-4">
             {preferences.language === 'ar' ? 'لا توجد عادات حتى الآن' : 'No habits yet'}
           </p>
         )}
       </div>

       {/* Custom Reasons Settings */}
       <CustomReasonsSection />

       {/* Developer Tools - Only for Demo Users */}
       {user?.isDemo && (
       <div className="glass-card p-5 rounded-2xl">
         <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Database size={18} className="text-yellow-500" /> Developer Tools</h3>
         <div className="flex gap-2">
             <button onClick={handleSeed} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold text-gray-300 transition-colors flex items-center justify-center gap-2">
               {t.seedData}
             </button>
                 <button onClick={() => { localStorage.removeItem('haseeb_demo_persona'); window.location.reload(); }} className="flex-1 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-sm font-bold text-yellow-500 transition-colors flex items-center justify-center gap-2">
                    <RotateCcw size={14} /> Reset Demo
                 </button>
         </div>
         {message && <p className="text-green-500 text-xs mt-2 text-center">{message}</p>}
       </div>
       )}

       {/* Home Button */}
       <button 
         onClick={() => navigate('/')}
         className="w-full py-4 bg-primary hover:bg-primary/90 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
       >
         <Home size={24} />
         {t.home}
       </button>
    </div>
  );
};

export default Profile;
