import React, { useState } from 'react';
import { Habit, HabitLog, HabitType, LogStatus } from '../../types';
import { usePreferences } from '../App';
import { useToast } from '../context/ToastContext';
import { TRANSLATIONS } from '../../constants';
import PrayerCard from './PrayerCard';
import { Check, X, Minus, Plus, RotateCcw, Flame, BookOpen, Sun, Moon, Star, Heart, List, Utensils, BedDouble, Book, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
// party-js disabled - causes build issues
// import party from 'party-js';
const party = { 
  confetti: (_el: Element, _opts?: unknown) => {}, 
  sparkles: (_el: Element, _opts?: unknown) => {},
  Color: { fromHex: (_hex: string) => ({}) }
};
import { ICON_MAP } from '../utils/iconMap';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  streak: number;
  onUpdate: (val: number, status?: LogStatus, reason?: string) => void;
  onReasonNeeded: (val: number, status: LogStatus) => void;
  onDeleteLog: () => void;
  onEdit?: (habit: Habit) => void;
  isSortMode?: boolean;
}

const successVariant = {
  scale: [1, 1.05, 1],
  backgroundColor: ["rgba(255,255,255,0)", "rgba(16,185,129,0.2)", "rgba(255,255,255,0)"]
};

const failVariant = {
  x: [0, -10, 10, -10, 10, 0],
  backgroundColor: ["rgba(255,255,255,0)", "rgba(239,68,68,0.2)", "rgba(255,255,255,0)"]
};

const checkSpinVariant = {
  rotate: [0, 360],
  scale: [1, 1.5, 1]
};

const failWobbleVariant = {
  rotate: [0, -20, 20, -20, 20, 0]
};

const streakFireVariant = {
  y: [0, -10, 0],
  scale: [1, 1.5, 1]
};

const forcePartyVisible = () => {
  const container = document.getElementById('party-js-container');
  if (container) {
    container.style.zIndex = '999999';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
  }
};

const HabitCard: React.FC<HabitCardProps> = ({ habit, log, streak, onUpdate, onReasonNeeded, onDeleteLog, onEdit, isSortMode }) => {
  const { preferences } = usePreferences();
  const { showToast } = useToast();
  const t = TRANSLATIONS[preferences.language];
  
  const [triggerCheckSpin, setTriggerCheckSpin] = useState(false);
  const [triggerFailWobble, setTriggerFailWobble] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [triggerFail, setTriggerFail] = useState(false);
  
  const isRawatib = habit.id.includes('sunnah');
  const isArabic = preferences.language === 'ar';
  const displayTitle = (isArabic ? habit.nameAr : habit.name) 
    || habit.name 
    || habit.nameAr 
    || "⚠️ Missing Name";
  
  const isMissingName = !habit.name && !habit.nameAr;

  const getTitleSizeClass = (title: string) => {
    const len = title.length;
    if (len > 30) return "text-[10px] leading-tight";
    if (len > 20) return "text-xs";
    if (len > 15) return "text-sm";
    return "text-sm";
  };

  if (habit.type === HabitType.PRAYER) {
    return (
      <PrayerCard 
        habit={habit} 
        log={log} 
        streak={streak}
        onUpdate={(val, reason) => onUpdate(val, LogStatus.DONE, reason)}
        onReasonNeeded={onReasonNeeded}
        onDelete={onDeleteLog}
        onEdit={onEdit}
        isSortMode={isSortMode}
      />
    );
  }

  const isDone = log?.status === LogStatus.DONE;
  const isSkipped = log?.status === LogStatus.SKIP;
  const isFailed = log?.status === LogStatus.FAIL;
  const isLogged = !!log;

  const getHabitIcon = (habit: Habit) => {
    const size = 24;
    const props = { size, strokeWidth: 1.5 };
    
    if (habit.icon && ICON_MAP[habit.icon]) {
      const IconComponent = ICON_MAP[habit.icon];
      return <IconComponent {...props} className="text-primary" />;
    }
    
    if (habit.type === HabitType.COUNTER) return <List {...props} className="text-primary" />;

    const id = habit.id.toLowerCase();
    if (id.includes('quran') || id.includes('mulk')) return <BookOpen {...props} className="text-emerald-500" />;
    if (id.includes('morning')) return <Sun {...props} className="text-amber-500" />;
    if (id.includes('evening')) return <Moon {...props} className="text-indigo-500" />;
    if (id.includes('witr')) return <Star {...props} className="text-purple-500" />;
    if (id.includes('qiyam')) return <Moon {...props} className="text-slate-500" />;
    if (id.includes('sunnah')) return <Heart {...props} className="text-rose-500" />;
    if (id.includes('fasting')) return <Utensils {...props} className="text-orange-500" />;
    if (id.includes('sleep')) return <BedDouble {...props} className="text-blue-500" />;
    if (id.includes('dhuha')) return <Sun {...props} className="text-yellow-500" />;

    return <Book {...props} className="text-slate-400" />;
  };

  const handleDoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLogged) return;
    
    forcePartyVisible();
    party.confetti(e.currentTarget, { count: 400, spread: 30, size: 1 });

    setTriggerCheckSpin(true);
    setTimeout(() => setTriggerCheckSpin(false), 400);
    
    setTriggerSuccess(true);
    setTimeout(() => setTriggerSuccess(false), 400);
    
    showToast('✓ ' + displayTitle, 'success');
    onUpdate(1, LogStatus.DONE);
  };

  const handleSkipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLogged) {
      onUpdate(0, LogStatus.SKIP);
    }
  };

  const handleFailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLogged) return;
    
    if (isRawatib) {
      setTriggerFailWobble(true);
      setTimeout(() => setTriggerFailWobble(false), 400);
      setTriggerFail(true);
      setTimeout(() => setTriggerFail(false), 400);
      onReasonNeeded(0, LogStatus.FAIL);
    } else {
      forcePartyVisible();
      party.sparkles(e.currentTarget, { count: 300, speed: 300, size: 1, color: party.Color.fromHex("#ef4444") });
      setTriggerFailWobble(true);
      setTimeout(() => setTriggerFailWobble(false), 400);
      setTriggerFail(true);
      setTimeout(() => setTriggerFail(false), 400);
      onUpdate(0, LogStatus.FAIL);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteLog();
  };

  const handleTextAreaClick = (e: React.MouseEvent) => {
    if (isSortMode) return;
    if (onEdit) {
      onEdit(habit);
    }
  };

  if (habit.type === HabitType.REGULAR) {
    const getStatusIcon = () => {
      if (isDone) return { Icon: Check, color: 'text-emerald-500' };
      if (isSkipped) return { Icon: Minus, color: 'text-slate-400' };
      if (isFailed) return { Icon: X, color: 'text-red-400' };
      return null;
    };

    const statusIcon = getStatusIcon();

    return (
      <motion.div 
        className={clsx(
          "relative bg-white dark:bg-[#18181b]/60 dark:backdrop-blur-md rounded-2xl mb-3 border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden",
          "h-14 flex items-stretch pl-3 pr-0 py-0"
        )}
        animate={triggerSuccess ? successVariant : triggerFail ? failVariant : {}}
        transition={{ duration: 0.4 }}
      >
        <div 
          onClick={handleTextAreaClick}
          className={clsx(
            "flex items-center flex-1 min-w-0 overflow-hidden",
            onEdit && "cursor-pointer hover:bg-white/5"
          )}
        >
          <div className={clsx(
            "w-10 h-full flex items-center justify-center me-3 shrink-0 transition-opacity",
            isLogged && "opacity-40"
          )}>
            {getHabitIcon(habit)}
          </div>
          
          <div className="flex-1 min-w-0 overflow-hidden flex items-center">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={clsx(
                  "font-semibold leading-none truncate",
                  getTitleSizeClass(displayTitle),
                  isMissingName && "text-red-500 dark:text-red-400",
                  !isMissingName && !isLogged && "text-slate-800 dark:text-white",
                  isLogged && !isMissingName && "text-gray-500"
                )}>
                  {displayTitle}
                </h3>
                {isLogged && statusIcon && (
                  <statusIcon.Icon 
                    size={10} 
                    strokeWidth={2.5}
                    className={clsx("shrink-0", statusIcon.color)} 
                  />
                )}
              </div>
              {streak > 0 && (
                <div className="relative z-20 flex items-center gap-1 mt-1 text-[9px] text-orange-500 font-semibold">
                  <motion.div
                    key={`flame-${streak}`}
                    animate={streakFireVariant}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Flame size={9} className="fill-orange-500 animate-flame" />
                  </motion.div>
                  <motion.span
                    key={streak}
                    initial={{ scale: 1.5, color: "#fbbf24" }}
                    animate={{ scale: 1, color: "#ea580c" }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {streak}
                  </motion.span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isSortMode ? (
          <div className="h-full w-14 flex items-center justify-center text-slate-500 cursor-grab active:cursor-grabbing">
            <GripVertical size={20} />
          </div>
        ) : isLogged ? (
          <motion.button 
            onClick={handleDeleteClick} 
            whileTap={{ scale: 0.9 }}
            className="h-full w-14 min-w-[44px] flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ms-auto rounded-e-2xl"
          >
            <RotateCcw size={18} />
          </motion.button>
        ) : (
          <div className="flex h-full items-stretch flex-none">
            <motion.button
              onClick={handleFailClick}
              whileTap={{ scale: 0.9 }}
              animate={triggerFailWobble ? failWobbleVariant : {}}
              className="h-full flex-1 w-12 flex items-center justify-center transition-all border-s border-white/10 rounded-s-xl text-red-500 hover:bg-red-500 hover:text-white"
            >
              <X size={18} />
            </motion.button>

            <motion.button
              onClick={handleSkipClick}
              whileTap={{ scale: 0.9 }}
              className="h-full flex-1 w-12 flex items-center justify-center transition-all border-s border-white/10 text-slate-400 hover:bg-slate-600 hover:text-white"
            >
              <Minus size={18} />
            </motion.button>

            <motion.button
              onClick={handleDoneClick}
              whileTap={{ scale: 0.9 }}
              className="h-full flex-1 w-12 flex items-center justify-center transition-all border-s border-white/10 rounded-e-xl text-emerald-500 hover:bg-emerald-500 hover:text-white"
            >
              <motion.div
                animate={triggerCheckSpin ? checkSpinVariant : {}}
                transition={triggerCheckSpin ? { duration: 0.4 } : {}}
                style={{ display: 'flex' }}
              >
                <Check size={20} strokeWidth={2.5} />
              </motion.div>
            </motion.button>
          </div>
        )}
      </motion.div>
    );
  }

  const savedCount = log?.value || 0;
  const target = habit.dailyTarget || 1;
  const isLocked = log?.status === LogStatus.DONE || log?.status === LogStatus.SKIP || log?.status === LogStatus.FAIL;
  
  const [tempCount, setTempCount] = useState(savedCount);
  
  React.useEffect(() => {
    setTempCount(savedCount);
  }, [savedCount]);

  const progress = Math.min((tempCount / target) * 100, 100);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      setTempCount(prev => prev + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked && tempCount > 0) {
      setTempCount(prev => prev - 1);
    }
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    forcePartyVisible();
    
    if (tempCount >= target) {
      const btn = e.currentTarget as HTMLElement;
      party.sparkles(btn, { 
        count: 150, 
        speed: 400, 
        size: 1.5, 
        color: party.Color.fromHex("#10b981") 
      });
      party.confetti(btn, { 
        count: 300, 
        spread: 70, 
        size: 1, 
        color: party.Color.fromHex("#34d399") 
      });
      
      setTriggerSuccess(true);
      setTimeout(() => setTriggerSuccess(false), 400);
      
      onUpdate(tempCount, LogStatus.DONE);
    } else {
      setTriggerFail(true);
      setTimeout(() => setTriggerFail(false), 400);
      
      onUpdate(tempCount, LogStatus.FAIL);
    }
  };

  const size = 140;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const CounterIcon = habit.icon && ICON_MAP[habit.icon] ? ICON_MAP[habit.icon] : List;

  return (
    <motion.div 
      className={clsx(
        "relative bg-white dark:bg-[#18181b]/60 dark:backdrop-blur-md rounded-xl py-4 px-5 mb-3 border border-slate-200 dark:border-white/5 shadow-sm"
      )}
      animate={triggerSuccess ? successVariant : {}}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div 
          onClick={handleTextAreaClick}
          className={clsx(
            "flex-1 min-w-0",
            onEdit && "cursor-pointer hover:opacity-80"
          )}
        >
          <h3 className={clsx(
            "font-semibold text-lg leading-none",
            isMissingName && "text-red-500 dark:text-red-400",
            !isMissingName && "text-slate-800 dark:text-white"
          )}>
            {displayTitle}
          </h3>
          {streak > 0 && (
            <div className="relative z-10 flex items-center gap-1 mt-2 text-xs text-orange-500 font-medium">
              <motion.div
                key={`flame-${streak}`}
                animate={streakFireVariant}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Flame size={12} className="fill-orange-500 animate-flame" />
              </motion.div>
              <motion.span
                key={streak}
                initial={{ scale: 1.5, color: "#fbbf24" }}
                animate={{ scale: 1, color: "#ea580c" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {streak}
              </motion.span>
            </div>
          )}
        </div>
        {isLocked && (
          <motion.button 
            onClick={handleDeleteClick} 
            whileTap={{ scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors bg-transparent rounded-lg shrink-0"
          >
            <RotateCcw size={14} />
          </motion.button>
        )}
      </div>

      <div className="flex items-center justify-center gap-6">
        <motion.button 
          onClick={handleDecrement}
          disabled={isLocked || tempCount === 0}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={clsx(
            "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all backdrop-blur-md",
            isLocked || tempCount === 0
              ? "bg-slate-800/50 text-gray-600 cursor-not-allowed"
              : "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95"
          )}
        >
          <Minus size={24} strokeWidth={3} />
        </motion.button>

        <div className="relative flex items-center justify-center">
          <svg 
            width={size} 
            height={size} 
            className="transform -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-200 dark:text-slate-700"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CounterIcon size={28} className="text-primary mb-1" />
            <motion.div
              key={tempCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="text-3xl font-bold text-slate-900 dark:text-white"
            >
              {tempCount}
            </motion.div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              / {target}
            </div>
          </div>
        </div>

        <motion.button 
          onClick={handleIncrement}
          disabled={isLocked}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={clsx(
            "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all backdrop-blur-md",
            isLocked
              ? "bg-slate-800/50 text-gray-600 cursor-not-allowed"
              : "bg-primary/90 text-white hover:bg-primary hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          )}
        >
          <Plus size={24} strokeWidth={3} />
        </motion.button>
      </div>

      {!isLocked && tempCount !== savedCount && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex justify-center"
        >
          <motion.button
            onClick={handleSubmit}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={clsx(
              "flex items-center gap-2 transition-all backdrop-blur-md",
              tempCount >= target
                ? "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 px-8 py-3 rounded-2xl font-bold"
                : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500 rounded-full px-6 py-2 text-xs font-bold tracking-wide"
            )}
          >
            <Check size={tempCount >= target ? 20 : 16} strokeWidth={3} />
            {tempCount >= target ? t.submit : t.saveProgress || 'Save Progress'}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HabitCard;
