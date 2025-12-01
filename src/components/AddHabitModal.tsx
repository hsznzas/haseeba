import React, { useState, useEffect } from 'react';
import { usePreferences } from '../App';
import { TRANSLATIONS } from '../../constants';
import { HabitType, Habit } from '../../types';
import { useData } from '../context/DataContext';
import { X, Activity } from 'lucide-react';
import { format } from 'date-fns';
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
  const { handleSaveHabit } = useData();
  const t = TRANSLATIONS[preferences.language];
  
  const [name, setName] = useState('');
  const [type, setType] = useState<HabitType>(HabitType.REGULAR);
  const [target, setTarget] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState<string>('Activity');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (habitToEdit) {
        setName(preferences.language === 'ar' ? habitToEdit.nameAr : habitToEdit.name);
        setType(habitToEdit.type);
        setTarget(habitToEdit.dailyTarget || 1);
        setSelectedIcon(habitToEdit.emoji && ICON_MAP[habitToEdit.emoji as IconName] ? habitToEdit.emoji : 'Activity');
      } else {
        setName('');
        setType(HabitType.REGULAR);
        setTarget(1);
        setSelectedIcon('Activity');
      }
      setShowIconPicker(false);
    }
  }, [isOpen, habitToEdit, preferences.language]);

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

    const updatedHabit: Habit = {
      id: habitToEdit ? habitToEdit.id : `custom_${Date.now()}`,
      name: nameEn,
      nameAr: nameAr,
      type,
      dailyTarget: type === HabitType.COUNTER ? target : undefined,
      emoji: selectedIcon,
      isActive: true,
      order: habitToEdit ? habitToEdit.order : 999,
      startDate: habitToEdit?.startDate || format(selectedDate || new Date(), 'yyyy-MM-dd'),
      presetId: habitToEdit?.presetId
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
                onClick={() => setType(HabitType.REGULAR)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${type === HabitType.REGULAR ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t.regular}
              </button>
              <button 
                type="button"
                onClick={() => setType(HabitType.COUNTER)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${type === HabitType.COUNTER ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t.counter}
              </button>
            </div>
          </div>

          {/* Counter Target */}
          {type === HabitType.COUNTER && (
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

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-gray-400 font-medium hover:bg-slate-900 hover:text-white transition-all">
              {t.cancel}
            </button>
            <button type="submit" className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHabitModal;
