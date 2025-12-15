import React, { useState, useEffect } from 'react';
import { Habit, HabitType } from '../../types';
import { useData } from '../context/DataContext';
import { Lock, Trash2, Archive, Save, Info, X, Target } from 'lucide-react';
import { ICON_MAP, IconName, AVAILABLE_ICONS } from '../utils/iconMap';
import { Activity } from 'lucide-react';
import { format } from 'date-fns';

interface HabitSettingsSectionProps {
  habit: Habit;
  language: 'en' | 'ar';
  onClose?: () => void;
}

const HabitSettingsSection: React.FC<HabitSettingsSectionProps> = ({
  habit,
  language,
  onClose
}) => {
  const { handleSaveHabit, handleDeleteHabit } = useData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const isArabic = language === 'ar';
  const isPreset = !!habit.presetId;
  const canFullyEdit = !isPreset;
  const is5KP = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(habit.id);
  
  // Form state
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('Activity');
  const [dailyTarget, setDailyTarget] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [affectsScore, setAffectsScore] = useState(true);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAffectsScoreInfo, setShowAffectsScoreInfo] = useState(false);

  useEffect(() => {
    setName(isArabic ? habit.nameAr : habit.name);
    setSelectedIcon(habit.icon || habit.emoji || 'Activity');
    setDailyTarget(habit.dailyTarget || 1);
    setIsActive(habit.isActive);
    setAffectsScore(habit.affectsScore !== undefined ? habit.affectsScore : true);
  }, [habit, isArabic]);

  const handleSave = async () => {
    const updatedHabit: Habit = {
      ...habit,
      ...(canFullyEdit && {
        name: isArabic ? habit.name : name,
        nameAr: isArabic ? name : habit.nameAr,
        icon: selectedIcon,
        dailyTarget: habit.type === HabitType.COUNTER ? dailyTarget : undefined,
      }),
      isActive,
      affectsScore,
      updatedAt: new Date().toISOString(),
    };

    await handleSaveHabit(updatedHabit);
    setIsEditing(false);
    onClose?.();
  };

  const handleDelete = async () => {
    if (!canFullyEdit) return;
    await handleDeleteHabit(habit.id);
    onClose?.();
  };

  const SelectedIconComponent = (ICON_MAP[selectedIcon as IconName] || Activity) as React.ElementType;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
          {isArabic ? 'الإعدادات' : 'Settings'}
        </h2>
        {isPreset && (
          <div className="flex items-center gap-1 text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
            <Lock size={10} />
            <span>{isArabic ? 'محدود' : 'Limited'}</span>
          </div>
        )}
      </div>

      {/* Habit Info (Read-only for presets) */}
      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
            {isArabic ? 'الاسم' : 'Name'}
          </label>
          {canFullyEdit && isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:outline-none"
            />
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
              {isPreset && <Lock size={12} className="text-gray-500 shrink-0" />}
              <span className="text-white text-sm">{name}</span>
            </div>
          )}
        </div>

        {/* Icon (Only editable for custom habits) */}
        {canFullyEdit && (
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
              {isArabic ? 'الأيقونة' : 'Icon'}
            </label>
            {isEditing ? (
              <>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <SelectedIconComponent size={20} className="text-primary" />
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    {showIconPicker ? (isArabic ? 'إخفاء' : 'Hide') : (isArabic ? 'تغيير' : 'Change')}
                  </button>
                </div>
                
                {showIconPicker && (
                  <div className="grid grid-cols-6 gap-2 mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800 max-h-32 overflow-y-auto">
                    {AVAILABLE_ICONS.map(iconKey => {
                      const Icon = ICON_MAP[iconKey as IconName] as React.ElementType;
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(iconKey);
                            setShowIconPicker(false);
                          }}
                          className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                            selectedIcon === iconKey 
                              ? 'bg-primary text-white' 
                              : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon size={18} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
                <SelectedIconComponent size={20} className="text-primary" />
              </div>
            )}
          </div>
        )}

        {/* Daily Target (For counter habits only) */}
        {habit.type === HabitType.COUNTER && canFullyEdit && (
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
              {isArabic ? 'الهدف اليومي' : 'Daily Target'}
            </label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:outline-none"
              />
            ) : (
              <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
                <span className="text-white text-sm">{dailyTarget}</span>
              </div>
            )}
          </div>
        )}

        {/* Archive Toggle (Available for all habits) */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
            {isArabic ? 'الحالة' : 'Status'}
          </label>
          <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isActive ? 'bg-primary' : 'bg-slate-700'
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
            <span className="text-sm text-white">
              {isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'مؤرشف' : 'Archived')}
            </span>
          </div>
        </div>

        {/* Affects Global Score Toggle */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {isArabic ? 'يؤثر على النتيجة الإجمالية' : 'Affects Global Score'}
            </label>
            <button
              onClick={() => setShowAffectsScoreInfo(true)}
              className="text-gray-500 hover:text-primary transition-colors"
            >
              <Info size={12} />
            </button>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
            <button
              onClick={() => {
                if (!is5KP) {
                  setAffectsScore(!affectsScore);
                  // Save immediately
                  handleSaveHabit({ ...habit, affectsScore: !affectsScore });
                }
              }}
              disabled={is5KP}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                affectsScore ? 'bg-purple-500' : 'bg-slate-700'
              } ${is5KP ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                affectsScore ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
            <span className="text-sm text-white">
              {affectsScore ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا (مكافأة)' : 'No (Bonus)')}
            </span>
            {is5KP && (
              <span className="text-[10px] text-yellow-500 ml-auto">
                {isArabic ? '🔒 مقفل' : '🔒 Locked'}
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-3 border-t border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">{isArabic ? 'النوع' : 'Type'}:</span>
            <span className="text-gray-400">
              {habit.type === HabitType.PRAYER 
                ? (isArabic ? 'صلاة' : 'Prayer')
                : habit.type === HabitType.COUNTER
                ? (isArabic ? 'عداد' : 'Counter')
                : (isArabic ? 'عادة' : 'Regular')
              }
            </span>
          </div>
          {habit.startDate && (
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">{isArabic ? 'تاريخ البدء' : 'Start Date'}:</span>
              <span className="text-gray-400">{format(new Date(habit.startDate), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {canFullyEdit && (
          <>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <Save size={16} />
                  {isArabic ? 'حفظ' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 text-white font-medium text-sm hover:bg-slate-700 transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 text-white font-medium text-sm hover:bg-slate-700 transition-colors"
                >
                  {isArabic ? 'تعديل' : 'Edit'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </>
        )}
        {isPreset && !isEditing && (
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Archive size={16} />
            {isArabic ? 'حفظ الحالة' : 'Save Status'}
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-sm w-full rounded-xl p-6 border border-red-500/30">
            <h3 className="text-lg font-bold text-white mb-2">
              {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {isArabic 
                ? 'هل أنت متأكد من حذف هذه العادة؟ سيتم حذف جميع السجلات المرتبطة بها.'
                : 'Are you sure you want to delete this habit? All associated logs will be deleted.'
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors"
              >
                {isArabic ? 'حذف' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-white font-medium text-sm hover:bg-slate-700 transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affects Score Info Modal */}
      {showAffectsScoreInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowAffectsScoreInfo(false)}
        >
          <div 
            className="bg-slate-900 border border-purple-500/30 rounded-xl p-5 max-w-xs shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                <Target size={16} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">
                  {isArabic ? 'عادات المكافأة' : 'Bonus Habits'}
                </h3>
              </div>
              <button
                onClick={() => setShowAffectsScoreInfo(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              {isArabic
                ? 'عند التعطيل، تصبح هذه العادة "عادة مكافأة". ستظهر في قائمتك، لكن عدم إكمالها لن يخفض نتيجتك اليومية أو يكسر سلاسلك. استخدم هذا للأهداف الاختيارية التي تريد تتبعها دون ضغط.'
                : 'When disabled, this habit becomes a "Bonus Habit". It will appear in your list, but missing it will not lower your daily score or break your streaks. Use this for optional goals you want to track without pressure.'}
            </p>
            <p className="text-xs text-yellow-400 leading-relaxed mb-4 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
              {isArabic
                ? '⚠️ الصلوات الخمس يجب أن تؤثر على النتيجة ولا يمكن تغييرها.'
                : '⚠️ The 5 Key Prayers must affect the score and cannot be changed.'}
            </p>
            <button
              onClick={() => setShowAffectsScoreInfo(false)}
              className="w-full py-2 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              {isArabic ? 'فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitSettingsSection;
