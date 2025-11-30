import React, { useState, useEffect } from 'react';
import { usePreferences } from '../App';
import { useData } from '../context/DataContext';
import { TRANSLATIONS } from '../../constants';
import { HabitType, Habit } from '../../types';
import { X, Minus, Plus, Loader2 } from 'lucide-react';
import { ICON_MAP, AVAILABLE_ICONS } from '../utils/iconMap';
import { suggestIcon } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  habitToEdit?: Habit | null;
}

const AddHabitModal: React.FC<Props> = ({ isOpen, onClose, onAdded, habitToEdit }) => {
  const { preferences } = usePreferences();
  const { habits, handleSaveHabit, handleDeleteHabit } = useData();
  const t = TRANSLATIONS[preferences.language];
  
  const [name, setName] = useState('');
  const [type, setType] = useState<HabitType>(HabitType.REGULAR);
  const [target, setTarget] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState('Activity');
  const [isLoadingIcon, setIsLoadingIcon] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (habitToEdit) {
        setName(preferences.language === 'ar' ? habitToEdit.nameAr : habitToEdit.name);
        setType(habitToEdit.type);
        setTarget(habitToEdit.dailyTarget || 1);
        setSelectedIcon(habitToEdit.icon || 'Activity');
      } else {
        setName('');
        setType(HabitType.REGULAR);
        setTarget(1);
        setSelectedIcon('Activity');
      }
    }
  }, [isOpen, habitToEdit, preferences.language]);

  const handleNameBlur = async () => {
    if (!name.trim() || habitToEdit) return;
    
    setIsLoadingIcon(true);
    try {
      const suggestedIcon = await suggestIcon(name);
      setSelectedIcon(suggestedIcon);
      console.log(`✨ AI suggested icon: ${suggestedIcon} for habit: ${name}`);
    } catch (error) {
      console.error('Failed to get icon suggestion:', error);
    } finally {
      setIsLoadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    console.log('➕ AddHabitModal: Submitting', name, 'in language:', preferences.language);
    
    let updatedHabit: Habit;

    if (habitToEdit) {
      const isArabic = preferences.language === 'ar';
      
      updatedHabit = {
        ...habitToEdit,
        name: isArabic ? (habitToEdit.name || name) : name,
        nameAr: isArabic ? name : (habitToEdit.nameAr || name),
        type,
        dailyTarget: type === HabitType.COUNTER ? target : undefined,
        icon: selectedIcon,
        emoji: type === HabitType.COUNTER && !habitToEdit.emoji ? '🔢' : (habitToEdit.emoji || '✨')
      };
      console.log('➕ Editing habit with Smart Mirror preservation applied');
    } else {
      updatedHabit = {
        id: `custom_${Date.now()}`,
        name: name,
        nameAr: name,
        type,
        dailyTarget: type === HabitType.COUNTER ? target : undefined,
        isActive: true,
        order: habits.length + 100,
        icon: selectedIcon,
        emoji: type === HabitType.COUNTER ? '🔢' : '✨',
        startDate: format(new Date(), 'yyyy-MM-dd')
      };
      console.log('➕ Creating habit with mirror fallback applied:', {
        currentLang: preferences.language,
        name: updatedHabit.name,
        nameAr: updatedHabit.nameAr,
        icon: selectedIcon,
        startDate: updatedHabit.startDate
      });
    }

    console.log('➕ AddHabitModal: Calling handleSaveHabit with', updatedHabit.id);
    await handleSaveHabit(updatedHabit);
    console.log('✅ AddHabitModal: Habit saved successfully');
    onAdded();
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!habitToEdit) return;
    
    const confirmDelete = window.confirm(
      preferences.language === 'en' 
        ? `Are you sure you want to delete "${preferences.language === 'ar' ? habitToEdit.nameAr : habitToEdit.name}"? This will also delete all associated logs.`
        : `هل أنت متأكد من حذف "${preferences.language === 'ar' ? habitToEdit.nameAr : habitToEdit.name}"؟ سيتم حذف جميع السجلات المرتبطة أيضاً.`
    );
    
    if (!confirmDelete) return;
    
    console.log('🗑️ AddHabitModal: Deleting habit', habitToEdit.id);
    await handleDeleteHabit(habitToEdit.id);
    console.log('✅ AddHabitModal: Habit deleted successfully');
    onAdded();
    onClose();
  };

  if (!isOpen) return null;

  const langName = preferences.language === 'en' ? 'English' : 'العربية';
  const title = habitToEdit ? t.editHabit : t.createHabit;
  const submitText = habitToEdit ? t.update : t.create;

  const SelectedIconComponent = ICON_MAP[selectedIcon] || ICON_MAP['Activity'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="backdrop-blur-xl bg-white/25 dark:bg-black/25 border border-white/30 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-white/10 dark:to-white/5 border-b border-white/20 dark:border-white/10 px-6 py-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Habit Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.habitName} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  className="w-full bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder={t.enterInCurrentLang + " " + langName}
                  required
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                  {preferences.language === 'en' 
                    ? "AI will suggest an icon when you finish typing" 
                    : "سيقترح الذكاء الاصطناعي أيقونة عند الانتهاء من الكتابة"}
                </p>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {preferences.language === 'en' ? 'Icon' : 'الأيقونة'}
                </label>
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 flex items-center justify-center hover:bg-white/70 dark:hover:bg-black/40 transition-all"
                    >
                      {isLoadingIcon ? (
                        <Loader2 size={28} className="text-primary animate-spin" />
                      ) : (
                        <SelectedIconComponent size={28} className="text-primary" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                    {isLoadingIcon ? (
                      <span className="text-primary">AI is suggesting...</span>
                    ) : (
                      <span>Tap to change icon</span>
                    )}
                  </div>
                </div>

                {/* Icon Picker Grid */}
                {showIconPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar"
                  >
                    <div className="grid grid-cols-8 gap-2">
                      {AVAILABLE_ICONS.map((iconName) => {
                        const IconComponent = ICON_MAP[iconName];
                        if (!IconComponent) return null;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              setSelectedIcon(iconName);
                              setShowIconPicker(false);
                            }}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                              selectedIcon === iconName
                                ? 'bg-primary text-white shadow-lg scale-110'
                                : 'bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/40 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <IconComponent size={20} />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Habit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.habitType}
                </label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setType(HabitType.REGULAR)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      type === HabitType.REGULAR 
                        ? 'bg-primary text-white shadow-lg scale-105' 
                        : 'bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-black/40'
                    }`}
                  >
                    {t.regular}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType(HabitType.COUNTER)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      type === HabitType.COUNTER 
                        ? 'bg-primary text-white shadow-lg scale-105' 
                        : 'bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-black/40'
                    }`}
                  >
                    {t.counter}
                  </button>
                </div>
              </div>

              {/* Daily Target (Counter Only) */}
              {type === HabitType.COUNTER && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.target}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setTarget(Math.max(1, target - 1))}
                      className="w-14 h-14 rounded-xl bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-black/40 active:scale-95 transition-all"
                    >
                      <Minus size={24} strokeWidth={3} />
                    </button>
                    <div className="flex-1 text-center">
                      <div className="text-5xl font-bold text-slate-900 dark:text-white">{target}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {preferences.language === 'en' ? 'per day' : 'في اليوم'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTarget(target + 1)}
                      className="w-14 h-14 rounded-xl bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-black/40 active:scale-95 transition-all"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {habitToEdit && (
                  <button 
                    type="button" 
                    onClick={handleDelete} 
                    className="px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 border border-red-500/30 hover:border-red-500 font-medium transition-all active:scale-95"
                    title={preferences.language === 'en' ? 'Delete Habit' : 'حذف العادة'}
                  >
                    🗑️
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 py-3 rounded-xl bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 hover:bg-white/70 dark:hover:bg-black/40 text-gray-700 dark:text-gray-300 font-medium transition-all active:scale-95"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                  {submitText}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddHabitModal;
