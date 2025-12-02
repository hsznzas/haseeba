import React from 'react';
import { Habit, HabitLog, HabitType, LogStatus } from '../../types';
import { usePreferences } from '../App';
import PrayerCard from './PrayerCard';
import { Check, X, Minus, RotateCcw, Plus, CheckCircle2, Activity } from 'lucide-react';
import AnimatedFlame from './AnimatedFlame';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { ICON_MAP, IconName } from '../utils/iconMap';
import party from 'party-js';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  streak: number;
  onUpdate: (val: number, status?: LogStatus) => void;
  onDeleteLog: () => void;
  onEdit?: (habit: Habit) => void;
  onReasonNeeded?: (val: number, status: LogStatus) => void;
  isSortMode?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, log, streak, onUpdate, onDeleteLog, onEdit, onReasonNeeded }) => {
  const { preferences } = usePreferences();

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

  if (habit.type === HabitType.PRAYER) {
    return (
      <PrayerCard 
        habit={habit} 
        log={log} 
        streak={streak}
        onUpdate={(val) => onUpdate(val, LogStatus.DONE)}
        onDelete={onDeleteLog}
        onReasonNeeded={(val) => onReasonNeeded?.(val, LogStatus.DONE)} 
      />
    );
  }

  const isDone = log?.status === LogStatus.DONE;
  const isFailed = log?.status === LogStatus.FAIL;
  const isLogged = !!log;

  // Resolve Icon Component safely - check icon first, then emoji as fallback
  const iconName = habit.icon || habit.emoji;
  const IconComponent = (iconName && ICON_MAP[iconName as IconName] ? ICON_MAP[iconName as IconName] : Activity) as React.ElementType;
  const iconColor = habit.color || undefined;

  // Handlers
  const handleDoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    forcePartyVisible();
    try {
      party.confetti(e.currentTarget as HTMLElement, { 
        count: party.variation.range(30, 50),
        spread: party.variation.range(20, 40),
        size: party.variation.range(0.8, 1.2),
      });
    } catch (err) {
      console.log('Party.js confetti error:', err);
    }
    onUpdate(1, LogStatus.DONE);
  };

  const handleFailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    forcePartyVisible();
    try {
      party.sparkles(e.currentTarget as HTMLElement, { 
        count: party.variation.range(20, 35),
        speed: party.variation.range(200, 400),
        size: party.variation.range(0.6, 1.0),
        color: party.Color.fromHex("#ef4444"),
      });
    } catch (err) {
      console.log('Party.js sparkles error:', err);
    }
    // Only ask for reason if requireReason is true (default) and onReasonNeeded is provided
    if (onReasonNeeded && habit.requireReason !== false) {
        onReasonNeeded(0, LogStatus.FAIL);
    } else {
        onUpdate(0, LogStatus.FAIL);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteLog();
  };

  // Animation Variants
  const successVariant = { scale: [1, 1.02, 1], borderColor: ["rgba(255,255,255,0.05)", "rgba(14, 165, 233, 0.5)", "rgba(255,255,255,0.05)"] };
  const failVariant = { x: [0, -5, 5, -5, 5, 0], borderColor: ["rgba(255,255,255,0.05)", "rgba(239,68,68,0.5)", "rgba(255,255,255,0.05)"] };
  
  const displayTitle = (preferences.language === 'ar' ? (habit.nameAr || habit.name) : (habit.name || habit.nameAr)) || "Untitled";
  const titleSizeClass = displayTitle.length > 30 ? "text-[10px] leading-tight" : displayTitle.length > 20 ? "text-xs" : "text-sm";

  // --- COUNTER HABIT LOGIC ---
  if (habit.type === HabitType.COUNTER) {
      const count = log?.value || 0;
      const target = habit.dailyTarget || 1;
      const progress = Math.min(count / target, 1);
      const circumference = 2 * Math.PI * 18; // radius 18
      const strokeDashoffset = circumference - progress * circumference;
      const isTargetMet = count >= target;

      const handleIncrement = (e: React.MouseEvent) => {
          e.stopPropagation();
          onUpdate(count + 1, count + 1 >= target ? LogStatus.DONE : undefined);
      };

      const handleDecrement = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (count > 0) onUpdate(count - 1, undefined);
      };
      
      const handlePartialSubmit = (e: React.MouseEvent) => {
          e.stopPropagation();
          const status = count >= target ? LogStatus.DONE : LogStatus.FAIL;
          onUpdate(count, status);
      };

      return (
        <motion.div 
            className={clsx(
                "h-auto min-h-[5rem] bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 mb-3 relative overflow-hidden transition-all",
                onEdit && "cursor-pointer hover:bg-white/10"
            )}
            onClick={() => onEdit && onEdit(habit)}
            animate={isTargetMet ? successVariant : {}}
        >
            <div className="flex items-center justify-between">
                 {/* Circular Progress + Icon */}
                 <div className="relative w-14 h-14 flex items-center justify-center shrink-0 mr-4">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-800" />
                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" 
                            className={clsx("transition-all duration-500", isTargetMet ? "text-emerald-500" : "text-primary")}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <IconComponent size={20} className={clsx(isTargetMet ? "text-emerald-500" : "")} style={!isTargetMet && iconColor ? { color: iconColor } : undefined} />
                 </div>

                 <div className="flex-1 min-w-0 mr-4">
                    <h3 className={clsx("font-bold text-white truncate", titleSizeClass)}>{displayTitle}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 font-mono">{count} / {target}</span>
                        {streak > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-orange-500 font-bold relative z-20">
                                <AnimatedFlame size={10} streak={streak} /> {streak}
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Counter Controls */}
                 <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-white/5">
                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={handleDecrement}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                        >
                            <Minus size={16} />
                        </motion.button>
                        <div className="w-px h-4 bg-white/10" />
                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={handleIncrement}
                            className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-md transition-colors"
                        >
                            <Plus size={16} />
                        </motion.button>
                    </div>
                    
                    {/* Save / Check Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePartialSubmit}
                        className={clsx(
                            "w-full py-1.5 rounded-lg flex items-center justify-center text-xs font-bold gap-1 border transition-all",
                            isTargetMet 
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500" 
                                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-primary/50 hover:text-primary"
                        )}
                    >
                        {isTargetMet ? <CheckCircle2 size={14} /> : "Check"}
                    </motion.button>
                 </div>
            </div>
        </motion.div>
      );
  }

  // Status icon to show after title when logged
  const getStatusIcon = () => {
    if (!isLogged) return null;
    if (isDone) return <Check size={12} className="text-emerald-500 shrink-0" />;
    if (isFailed) return <X size={12} className="text-red-500 shrink-0" />;
    return null;
  };

  // --- REGULAR HABIT UI ---
  return (
    <motion.div 
        className={clsx(
            "h-14 bg-white/5 backdrop-blur-md border border-white/5 rounded-xl flex items-center pl-3 pr-0 py-0 relative overflow-hidden transition-all",
            onEdit && "cursor-pointer hover:bg-white/10"
        )}
        animate={isDone ? successVariant : isFailed ? failVariant : {}}
        onClick={() => onEdit && onEdit(habit)}
    >
      
      {/* Icon Container */}
      <div className="w-10 h-full flex items-center justify-center shrink-0 mr-3 border-r border-white/5">
        <IconComponent size={20} className={clsx(isLogged ? "text-gray-500" : "")} style={!isLogged && iconColor ? { color: iconColor } : undefined} />
      </div>

      {/* Text & Streak */}
      <div className="flex-1 min-w-0 flex flex-col justify-center mr-2">
        <div className="flex items-center gap-1.5">
            <h3 className={clsx("font-bold leading-tight truncate", titleSizeClass, isLogged ? "text-gray-500" : "text-white")}>
            {displayTitle}
            </h3>
            {/* Status indicator icon after title */}
            {getStatusIcon()}
            {streak > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] text-orange-500 font-bold relative z-20">
                    <AnimatedFlame size={10} streak={streak} /> {streak}
                </div>
            )}
        </div>
      </div>

      {/* Action Buttons (2-Column Grid: Done & Fail) */}
      {isLogged ? (
        <div className="h-full w-16 flex items-center justify-center bg-slate-900/50 border-l border-white/5 ml-auto rounded-e-xl">
             <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleDeleteClick}
                className="w-full h-full flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
            >
                <RotateCcw size={18} />
            </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-2 h-full w-28 ml-auto">
             {/* GREEN Check-in button */}
             <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDoneClick}
                className="flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-l border-white/10 transition-colors"
            >
                <Check size={20} />
            </motion.button>

            {/* RED Fail button */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleFailClick}
                className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border-l border-white/10 transition-colors rounded-e-xl"
            >
                <X size={20} />
            </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default HabitCard;
