import React, { useState, useEffect } from 'react';
import { usePreferences } from '../App';
import { TRANSLATIONS } from '../../constants';
import { HabitType, Habit } from '../../types';
import { useData } from '../context/DataContext';
import { X, Activity, Trash2, Info, Calendar, ChevronDown } from 'lucide-react';
import { format, isAfter, startOfDay } from 'date-fns';
import { suggestIcon } from '../services/geminiService';
import { ICON_MAP, IconName, AVAILABLE_ICONS } from '../utils/iconMap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  habitToEdit?: Habit | null;
  selectedDate?: Date;
}

const AddHabitModal: React.FC<Props> = ({ isOpen, onClose, onAdded, habitToEdit, selectedDate }) => {
  const { preferences } = usePreferences();
  const { handleSaveHabit, handleDeleteHabit } = useData();
  const t = TRANSLATIONS[preferences.language];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<HabitType>(HabitType.REGULAR);
  const [target, setTarget] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState<string>('Activity');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [affectsScore, setAffectsScore] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isTwiceDaily, setIsTwiceDaily] = useState(false);
  
  // Backdated start date
  const [useCustomStartDate, setUseCustomStartDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (isOpen) {
      if (habitToEdit) {
        setName(preferences.language === 'ar' ? habitToEdit.nameAr : habitToEdit.name);
        setType(habitToEdit.type);
        setTarget(habitToEdit.dailyTarget || 1);
        setSelectedIcon(habitToEdit.emoji && ICON_MAP[habitToEdit.emoji as IconName] ? habitToEdit.emoji : 'Activity');
        setAffectsScore(habitToEdit.affectsScore !== undefined ? habitToEdit.affectsScore : true);
        // Check if this is a twice-daily habit (COUNTER with target 2)
        setIsTwiceDaily(habitToEdit.type === HabitType.COUNTER && habitToEdit.dailyTarget === 2);
        // For editing, show the existing start date if different from today
        if (habitToEdit.startDate && habitToEdit.startDate !== format(new Date(), 'yyyy-MM-dd')) {
          setUseCustomStartDate(true);
          setCustomStartDate(habitToEdit.startDate);
        } else {
          setUseCustomStartDate(false);
          setCustomStartDate(format(new Date(), 'yyyy-MM-dd'));
        }
      } else {
        setName('');
        setType(HabitType.REGULAR);
        setTarget(1);
        setSelectedIcon('Activity');
        setAffectsScore(true);
        setIsTwiceDaily(false);
        setUseCustomStartDate(false);
        setCustomStartDate(format(new Date(), 'yyyy-MM-dd'));
      }
      setShowIconPicker(false);
      setShowDeleteConfirm(false);
      setShowInfoModal(false);
    }
  }, [isOpen, habitToEdit, preferences.language]);

  const handleDelete = async () => {
    if (!habitToEdit) return;
    try {
      await handleDeleteHabit(habitToEdit.id);
      onClose();
      onAdded(); // Refresh the list
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const handleNameBlur = async () => {
    if (name.trim() && !habitToEdit) {
        try {
            const suggestion = await suggestIcon(name);
            if ((AVAILABLE_ICONS as string[]).includes(suggestion)) {
                setSelectedIcon(suggestion);
            }
        } catch (e) {
            console.error("Icon suggestion failed", e);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Smart Mirror Logic
    const currentLang = preferences.language;
    const nameEn = currentLang === 'en' ? name : (habitToEdit?.name || name);
    const nameAr = currentLang === 'ar' ? name : (habitToEdit?.nameAr || name);

    // Determine start date:
    // - If editing, allow changing start date via custom date picker
    // - If creating new, use custom date picker if enabled, otherwise today
    let habitStartDate: string;
    if (useCustomStartDate) {
      habitStartDate = customStartDate;
    } else if (habitToEdit?.startDate) {
      habitStartDate = habitToEdit.startDate;
    } else {
      habitStartDate = format(new Date(), 'yyyy-MM-dd');
    }
    
    console.log('📅 Creating/editing habit with startDate:', habitStartDate, 'useCustomStartDate:', useCustomStartDate);

    const updatedHabit: Habit = {
      id: habitToEdit ? habitToEdit.id : `custom_${Date.now()}`,
      name: nameEn,
      nameAr: nameAr,
      type,
      dailyTarget: type === HabitType.COUNTER ? target : undefined,
      emoji: selectedIcon,
      isActive: true,
      order: habitToEdit ? habitToEdit.order : 999,
      startDate: habitStartDate,
      presetId: habitToEdit?.presetId,
      affectsScore: affectsScore || undefined
    };

    await handleSaveHabit(updatedHabit);
    onAdded();
    onClose();
  };

  if (!isOpen) return null;

  const langName = preferences.language === 'en' ? 'English' : 'العربية';
  const title = habitToEdit ? t.editHabit : t.createHabit;
  const submitText = habitToEdit ? t.update : t.create;
  
  // Safe Icon Lookup
  const SelectedIconComponent = (ICON_MAP[selectedIcon as IconName] || Activity) as React.ElementType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <SelectedIconComponent size={20} />
            </div>
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                {t.habitName}
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-all"
              placeholder={t.enterInCurrentLang + " " + langName}
              required
            />
          </div>

          {/* Icon Picker Toggle */}
          <div>
             <button 
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="text-xs text-primary hover:text-primary/80 underline"
             >
                {showIconPicker ? "Hide Icons" : "Change Icon"}
             </button>
             
             {showIconPicker && (
                <div className="grid grid-cols-6 gap-2 mt-2 p-2 bg-slate-950 rounded-xl border border-slate-800 max-h-32 overflow-y-auto custom-scrollbar">
                    {AVAILABLE_ICONS.map(iconKey => {
                        const Icon = ICON_MAP[iconKey as IconName] as React.ElementType;
                        return (
                            <button
                                key={iconKey}
                                type="button"
                                onClick={() => setSelectedIcon(iconKey)}
                                className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedIcon === iconKey ? 'bg-primary text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <Icon size={18} />
                            </button>
                        )
                    })}
                </div>
             )}
          </div>

          {/* Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">{t.habitType}</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button 
                type="button"
                onClick={() => {
                  setType(HabitType.REGULAR);
                  if (isTwiceDaily) setIsTwiceDaily(false);
                }}
                disabled={isTwiceDaily}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${type === HabitType.REGULAR && !isTwiceDaily ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'} ${isTwiceDaily ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t.regular}
              </button>
              <button 
                type="button"
                onClick={() => setType(HabitType.COUNTER)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${type === HabitType.COUNTER || isTwiceDaily ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t.counter}
              </button>
            </div>
          </div>

          {/* Twice Daily Mode Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {preferences.language === 'ar' ? 'وضع مرتين يومياً' : 'Twice Daily Mode'}
                </label>
                <span className="text-[10px] text-gray-500">
                  {preferences.language === 'ar' ? 'مثال: صباحاً ومساءً' : 'e.g., Morning & Evening'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = !isTwiceDaily;
                  setIsTwiceDaily(newVal);
                  if (newVal) {
                    setType(HabitType.COUNTER);
                    setTarget(2);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isTwiceDaily ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isTwiceDaily ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {isTwiceDaily && (
              <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-in fade-in">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                  </div>
                  <span className="text-[10px] text-amber-400">
                    {preferences.language === 'ar' ? 'صباحاً' : 'AM'}
                  </span>
                </div>
                <span className="text-gray-600">→</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-400">
                    {preferences.language === 'ar' ? 'مساءً' : 'PM'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Counter Target - Hidden when Twice Daily Mode is ON */}
          {type === HabitType.COUNTER && !isTwiceDaily && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">{t.target}</label>
               <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <button 
                    type="button"
                    onClick={() => setTarget(Math.max(1, target - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-lg text-white hover:bg-slate-800 transition-colors text-xl font-bold"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-mono text-2xl font-bold text-white">
                    {target}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setTarget(target + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-lg text-white hover:bg-slate-800 transition-colors text-xl font-bold"
                  >
                    +
                  </button>
               </div>
            </div>
          )}

          {/* Affects Global Score Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {preferences.language === 'ar' ? 'يؤثر على النتيجة الإجمالية' : 'Affects Global Score'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="p-1 text-gray-500 hover:text-primary transition-colors"
                >
                  <Info size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Check if this is a 5 Key Prayer (5KP)
                  const fiveKeyPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
                  const is5KP = habitToEdit && fiveKeyPrayers.includes(habitToEdit.id);
                  if (!is5KP) {
                    setAffectsScore(!affectsScore);
                  }
                }}
                disabled={!!(habitToEdit && ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(habitToEdit.id))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  affectsScore ? 'bg-primary' : 'bg-slate-700'
                } ${
                  habitToEdit && ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(habitToEdit.id)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    affectsScore ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {habitToEdit && ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(habitToEdit.id) && (
              <p className="text-[10px] text-gray-500 italic ml-1">
                {preferences.language === 'ar' 
                  ? 'الصلوات الخمس يجب أن تؤثر على النتيجة' 
                  : '5 Key Prayers must affect score'}
              </p>
            )}
          </div>

          {/* Start Date - Backdated Habit Support */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {preferences.language === 'ar' ? 'تاريخ بدء مخصص' : 'Custom Start Date'}
                </label>
                <span className="text-[10px] text-gray-500">
                  {preferences.language === 'ar' ? 'البدء من تاريخ في الماضي' : 'Start tracking from a past date'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = !useCustomStartDate;
                  setUseCustomStartDate(newVal);
                  if (!newVal) {
                    setCustomStartDate(format(new Date(), 'yyyy-MM-dd'));
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useCustomStartDate ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useCustomStartDate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {useCustomStartDate && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <input
                    type="date"
                    value={customStartDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const today = format(new Date(), 'yyyy-MM-dd');
                      // Prevent future dates
                      if (selectedDate <= today) {
                        setCustomStartDate(selectedDate);
                      }
                    }}
                    className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-3 text-white focus:border-cyan-500 focus:outline-none transition-all pr-10 appearance-none cursor-pointer"
                  />
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-cyan-400/70 flex items-center gap-1.5">
                  <Calendar size={12} />
                  {preferences.language === 'ar' 
                    ? `التتبع يبدأ من: ${customStartDate}` 
                    : `Tracking starts from: ${customStartDate}`}
                </p>
              </div>
            )}
          </div>

          {/* Delete Habit (only for existing custom habits) */}
          {habitToEdit && !habitToEdit.presetId && (
            <div className="pt-4 border-t border-slate-800">
              {showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-400 text-center">
                    {preferences.language === 'ar' ? 'هل أنت متأكد؟ سيتم حذف جميع السجلات.' : 'Are you sure? All logs will be deleted.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 rounded-lg bg-slate-800 text-gray-400 text-sm font-medium hover:bg-slate-700 transition-all"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-500 text-sm font-bold hover:bg-red-500/30 transition-all"
                    >
                      {preferences.language === 'ar' ? 'نعم، احذف' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                >
                  <Trash2 size={16} />
                  {preferences.language === 'ar' ? 'حذف هذه العادة' : 'Delete this habit'}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-gray-400 font-medium hover:bg-slate-900 hover:text-white transition-all">
              {t.cancel}
            </button>
            <button type="submit" className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
              {submitText}
            </button>
          </div>
        </form>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-xs shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Info size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">
                  {preferences.language === 'ar' ? 'عادات المكافأة' : 'Bonus Habits'}
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {preferences.language === 'ar'
                ? 'عند التعطيل، تصبح هذه العادة "عادة مكافأة". ستظهر في قائمتك، لكن عدم إكمالها لن يخفض نتيجتك اليومية أو يكسر سلاسلك. استخدم هذا للأهداف الاختيارية التي تريد تتبعها دون ضغط.'
                : 'When disabled, this habit becomes a "Bonus Habit". It will appear in your list, but missing it will not lower your daily score or break your streaks. Use this for optional goals you want to track without pressure.'}
            </p>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              {preferences.language === 'ar' ? 'فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddHabitModal;
