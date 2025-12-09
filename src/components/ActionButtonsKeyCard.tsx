import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, XCircle, Check, Hourglass } from 'lucide-react';
import { usePreferences } from '../App';
import RaisedHandsIcon from './icons/RaisedHandsIcon';
import clsx from 'clsx';

interface ActionButtonsKeyCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActionButtonsKeyCard: React.FC<ActionButtonsKeyCardProps> = ({ isOpen, onClose }) => {
  const { preferences } = usePreferences();
  const isArabic = preferences.language === 'ar';

  const prayerQualityButtons = [
    {
      icon: RaisedHandsIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      titleEn: 'Takbira',
      titleAr: 'تكبيرة الإحرام',
      descEn: 'Caught first takbir in congregation',
      descAr: 'أدركت تكبيرة الإحرام مع الجماعة',
    },
    {
      icon: Users,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      titleEn: 'Jamaa',
      titleAr: 'جماعة',
      descEn: 'Prayed in congregation',
      descAr: 'صليت مع الجماعة',
    },
    {
      icon: Clock,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      titleEn: 'On Time',
      titleAr: 'في الوقت',
      descEn: 'Prayed on time alone',
      descAr: 'صليت في الوقت منفرداً',
    },
    {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      titleEn: 'Missed',
      titleAr: 'فاتت',
      descEn: 'Missed or prayed late',
      descAr: 'فاتت أو صليتها قضاءً',
    },
  ];

  const statsExplanation = [
    {
      symbol: '✓',
      icon: null,
      color: 'text-emerald-500',
      titleEn: 'Done',
      titleAr: 'تم',
      descEn: 'Completed habits',
      descAr: 'العادات المكتملة',
    },
    {
      symbol: '✗',
      icon: null,
      color: 'text-red-400',
      titleEn: 'Failed',
      titleAr: 'فشل',
      descEn: 'Marked as missed',
      descAr: 'تم تحديدها كفائتة',
    },
    {
      symbol: null,
      icon: Hourglass,
      color: 'text-yellow-400',
      titleEn: 'Pending',
      titleAr: 'معلق',
      descEn: 'Not yet logged',
      descAr: 'لم يتم تسجيلها بعد',
    },
  ];

  const calendarStates = [
    {
      type: 'empty',
      titleEn: 'No Activity',
      titleAr: 'لا نشاط',
      descEn: 'No habits logged',
      descAr: 'لم يتم تسجيل أي عادة',
    },
    {
      type: 'partial',
      titleEn: 'Partial',
      titleAr: 'جزئي',
      descEn: 'Some habits logged',
      descAr: 'تم تسجيل بعض العادات',
    },
    {
      type: 'complete',
      titleEn: 'Complete',
      titleAr: 'مكتمل',
      descEn: 'All habits logged',
      descAr: 'تم تسجيل جميع العادات',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
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
            <div className="glass-card rounded-t-3xl rounded-b-none p-6 pb-10 border-t border-x border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto">
              {/* Drag Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-gray-500 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold text-white ${isArabic ? 'text-right flex-1' : 'text-left flex-1'}`}>
                  {isArabic ? 'دليل الأيقونات' : 'Icon Guide'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Section A: Prayer Quality Buttons */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {isArabic ? 'جودة الصلاة' : 'Prayer Quality'}
                </h3>
                <div className="space-y-2">
                  {prayerQualityButtons.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', item.bgColor)}>
                          <IconComponent size={20} className={item.color} />
                        </div>
                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                          <p className="text-sm font-semibold text-white">
                            {isArabic ? item.titleAr : item.titleEn}
                          </p>
                          <p className="text-xs text-gray-400">
                            {isArabic ? item.descAr : item.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section B: Stats Bar Explanation */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {isArabic ? 'شريط الإحصائيات' : 'Stats Bar'}
                </h3>
                <div className="flex gap-2">
                  {statsExplanation.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={idx}
                        className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-center"
                      >
                        {item.symbol ? (
                          <span className={`text-2xl font-bold ${item.color}`}>{item.symbol}</span>
                        ) : IconComponent ? (
                          <IconComponent size={24} className={item.color} />
                        ) : null}
                        <p className="text-xs font-semibold text-white mt-1">
                          {isArabic ? item.titleAr : item.titleEn}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {isArabic ? item.descAr : item.descEn}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section C: Calendar Date States */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {isArabic ? 'حالات التقويم' : 'Calendar States'}
                </h3>
                <div className="flex gap-3 justify-center">
                  {calendarStates.map((state, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      {/* Date Button Preview */}
                      <div
                        className={clsx(
                          'w-12 h-14 rounded-lg flex flex-col items-center justify-center border relative mb-2',
                          state.type === 'empty' && 'bg-card border-slate-700 text-gray-400',
                          state.type === 'partial' && 'bg-card border-slate-700 text-gray-400',
                          state.type === 'complete' && 'bg-card border-slate-700 text-gray-400'
                        )}
                      >
                        <span className="text-[10px] font-medium opacity-80 uppercase">
                          {isArabic ? 'إثن' : 'Mon'}
                        </span>
                        <span className="text-base font-bold leading-none mt-0.5">
                          {15 + idx}
                        </span>
                        
                        {/* Complete indicator */}
                        {state.type === 'complete' && (
                          <div className="absolute top-1 right-1 bg-black rounded-full p-0.5 z-20 shadow-sm">
                            <Check size={10} className="text-emerald-400" strokeWidth={3} />
                          </div>
                        )}
                        
                        {/* Partial indicator */}
                        {state.type === 'partial' && (
                          <div className="absolute bottom-1.5 w-1 h-1 bg-slate-500 rounded-full" />
                        )}
                      </div>
                      
                      <p className="text-xs font-semibold text-white text-center">
                        {isArabic ? state.titleAr : state.titleEn}
                      </p>
                      <p className="text-[10px] text-gray-400 text-center max-w-[70px]">
                        {isArabic ? state.descAr : state.descEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Got it Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-3.5 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all"
              >
                {isArabic ? 'فهمت!' : 'Got it!'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ActionButtonsKeyCard;
