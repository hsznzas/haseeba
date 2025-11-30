import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Briefcase, Utensils, Plane, Thermometer, HelpCircle, Armchair, Users, Bed } from 'lucide-react';
import { usePreferences } from '../App';
import { TRANSLATIONS } from '../../constants';
import { useData } from '../context/DataContext';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

// Default reasons with Lucide icons (moved outside component for stability)
const DEFAULT_REASONS = [
  { id: 'sleep', labelEn: 'Sleep', labelAr: 'نوم', icon: Bed },
  { id: 'work', labelEn: 'Work/Money', labelAr: 'عمل/مال', icon: Briefcase },
  { id: 'family', labelEn: 'Family', labelAr: 'عائلة', icon: Users },
  { id: 'food', labelEn: 'Food', labelAr: 'طعام', icon: Utensils },
  { id: 'travel', labelEn: 'Travel', labelAr: 'سفر', icon: Plane },
  { id: 'sick', labelEn: 'Sick', labelAr: 'مرض', icon: Thermometer },
  { id: 'laziness', labelEn: 'Laziness', labelAr: 'كسل', icon: Armchair },
  { id: 'other', labelEn: 'Other', labelAr: 'آخر', icon: HelpCircle },
];

const ReasonModal: React.FC<ReasonModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { preferences } = usePreferences();
  const { customReasons, handleAddCustomReason } = useData();
  const t = TRANSLATIONS[preferences.language];
  const isArabic = preferences.language === 'ar';
  
  const [isCustom, setIsCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine default reasons with custom reasons using useMemo
  const reasons = useMemo(() => {
    return [
      ...DEFAULT_REASONS,
      ...customReasons.map(r => ({
        id: `custom_${r}`,
        labelEn: r,
        labelAr: r,
        icon: HelpCircle
      }))
    ];
  }, [customReasons]);

  useEffect(() => {
    if (isCustom && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCustom]);

  useEffect(() => {
    if (!isOpen) {
      setIsCustom(false);
      setCustomText('');
      setSaveAsPreset(false);
    }
  }, [isOpen]);

  const handleReasonClick = (reasonId: string, label: string) => {
    if (reasonId === 'other') {
      setIsCustom(true);
    } else {
      onConfirm(label);
    }
  };

  const handleSaveCustom = async () => {
    if (customText.trim()) {
      if (saveAsPreset) {
        await handleAddCustomReason(customText.trim());
      }
      onConfirm(customText.trim());
    }
  };

  const handleBack = () => {
    setIsCustom(false);
    setCustomText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with fade animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Bottom Sheet with slide-up animation */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-[9999] max-w-2xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card rounded-t-3xl rounded-b-none p-6 pb-10 shadow-2xl border-t border-x border-white/10 min-h-[50vh]">
              {/* Drag Handle (iOS style) */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-gray-500 rounded-full" />
              </div>

              {!isCustom ? (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-semibold text-white ${isArabic ? 'text-right flex-1' : 'text-left flex-1'}`}>
                      {isArabic ? 'ما السبب؟' : 'What was the reason?'}
                    </h2>
                    <button
                      onClick={onClose}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Reason Options Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {reasons.map((reason) => {
                      const IconComponent = reason.icon;
                      return (
                        <motion.button
                          key={reason.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReasonClick(reason.id, isArabic ? reason.labelAr : reason.labelEn)}
                          className="glass-button p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-all flex flex-col items-center gap-3 group active:bg-white/10"
                        >
                          <IconComponent size={32} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                          <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                            {isArabic ? reason.labelAr : reason.labelEn}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Helper Text */}
                  <p className={`text-xs text-gray-400 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {isArabic 
                      ? 'اختر السبب لتتبع أسباب التراجع الروحي'
                      : 'Select a reason to track spiritual dips'}
                  </p>
                </>
              ) : (
                <>
                  {/* Custom Reason Input View */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={handleBack}
                      className="text-emerald-500 text-base font-medium hover:text-emerald-400 transition-colors"
                    >
                      {isArabic ? 'رجوع' : 'Back'}
                    </button>
                    <h2 className="text-xl font-semibold text-white">
                      {isArabic ? 'سبب آخر' : 'Custom Reason'}
                    </h2>
                    <button
                      onClick={onClose}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Large Input Field */}
                  <div className="mb-6">
                    <input
                      ref={inputRef}
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customText.trim()) {
                          handleSaveCustom();
                        }
                      }}
                      placeholder={isArabic ? 'اكتب السبب هنا...' : 'Type your reason here...'}
                      className={`w-full px-5 py-4 bg-black/30 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all text-lg ${isArabic ? 'text-right' : 'text-left'}`}
                      dir={isArabic ? 'rtl' : 'ltr'}
                    />
                  </div>

                  {/* Save as Preset Checkbox */}
                  <label className={`flex items-center gap-3 mb-6 cursor-pointer group ${isArabic ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={saveAsPreset}
                        onChange={(e) => setSaveAsPreset(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-emerald-500 transition-all" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {isArabic ? 'حفظ كخيار افتراضي؟' : 'Save as preset?'}
                    </span>
                  </label>

                  {/* Save Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveCustom}
                    disabled={!customText.trim()}
                    className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                      customText.trim()
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Save size={20} />
                    {isArabic ? 'حفظ' : 'Save'}
                  </motion.button>

                  {/* Helper Text */}
                  <p className={`mt-4 text-xs text-gray-400 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {isArabic 
                      ? 'هذا السبب سيساعدك على فهم أسباب التراجع'
                      : 'This reason will help you understand patterns'}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReasonModal;
