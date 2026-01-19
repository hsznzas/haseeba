import React from 'react';
import { Habit, HabitLog, HabitType, LogStatus } from '../../types';
import { usePreferences } from '../App';
import PrayerCard from './PrayerCard';
import { Check, X, Minus, RotateCcw, Plus, CheckCircle2, Activity, Pause, Sun, Moon } from 'lucide-react';
import AnimatedFlame from './AnimatedFlame';
import { getStreakOpacity, shouldShowStreak } from '../utils/streak';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { ICON_MAP, IconName } from '../utils/iconMap';
import party from 'party-js';

// Two-digit encoding helpers for Twice-Daily Habits
// value = (MorningState * 10) + EveningState
// State Key: 0 = Pending, 1 = Done, 2 = Fail
const decodeTwiceDaily = (value: number) => {
  const amState = Math.floor(value / 10); // 0=pending, 1=done, 2=fail
  const pmState = value % 10;             // 0=pending, 1=done, 2=fail
  return { amState, pmState };
};

// Split-Doughnut SVG Component for Twice-Daily Habits
const SplitDoughnutIndicator: React.FC<{ value: number; size?: number }> = ({ value, size = 44 }) => {
  const strokeWidth = 4;
  const radius = (size / 2) - strokeWidth;
  const cx = size / 2;
  const cy = size / 2;
  
  const { amState, pmState } = decodeTwiceDaily(value);
  
  // Colors based on state: 0=gray, 1=green, 2=red
  const getColor = (state: number) => {
    if (state === 1) return '#10b981'; // emerald-500 (Done)
    if (state === 2) return '#ef4444'; // red-500 (Fail)
    return '#334155'; // slate-700 (Pending/Empty)
  };
  
  const amColor = getColor(amState);
  const pmColor = getColor(pmState);
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Base ring (empty) */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={radius} 
        fill="none" 
        stroke="#1e293b"
        strokeWidth={strokeWidth}
      />
      
      {/* Left half (AM) - 0° to 180° */}
      <path
        d={`M ${cx} ${cy - radius} A ${radius} ${radius} 0 0 0 ${cx} ${cy + radius}`}
        fill="none"
        stroke={amColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Right half (PM) - 180° to 360° */}
      <path
        d={`M ${cx} ${cy - radius} A ${radius} ${radius} 0 0 1 ${cx} ${cy + radius}`}
        fill="none"
        stroke={pmColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  streak: number;
  onUpdate: (val: number, status?: LogStatus) => void;
  onDeleteLog: () => void;
  onViewDetails?: () => void;
  onReasonNeeded?: (val: number, status: LogStatus) => void;
  isSortMode?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, log, streak, onUpdate, onDeleteLog, onViewDetails, onReasonNeeded, isSortMode }) => {
  const { preferences } = usePreferences();
  
  // Rawatib excused mode detection
  const isRawatib = habit.presetId === 'rawatib';
  const isGlobalExcusedMode = preferences.isExcused && preferences.gender === 'female';
  const isRawatibExcused = isRawatib && isGlobalExcusedMode;

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
        onViewDetails={onViewDetails}
        isSortMode={isSortMode}
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

  // --- TWICE-DAILY HABIT LOGIC (COUNTER with target === 2) ---
  // Uses two-digit encoding: value = (MorningState * 10) + EveningState
  // State Key: 0 = Pending, 1 = Done, 2 = Fail
  const isTwiceDaily = habit.type === HabitType.COUNTER && habit.dailyTarget === 2;
  
  if (isTwiceDaily) {
      const value = log?.value || 0;
      const { amState, pmState } = decodeTwiceDaily(value);
      
      // Determine current phase
      const isMorningPhase = value === 0; // Nothing logged yet
      const isEveningPhase = value >= 10 && pmState === 0; // AM logged, PM pending
      const isCompleted = pmState !== 0; // Both sessions logged
      
      // Determine overall status for styling
      const isPerfectDay = amState === 1 && pmState === 1; // Both done (value = 11)
      const hasAnyFail = amState === 2 || pmState === 2;
      
      // Get phase info for display
      const getPhaseInfo = () => {
        if (isMorningPhase) return { 
          label: preferences.language === 'ar' ? 'صباحاً' : 'Morning', 
          color: 'text-amber-400',
          icon: Sun
        };
        if (isEveningPhase) {
          const amStatus = amState === 1 
            ? (preferences.language === 'ar' ? '✓ صباح' : '✓ AM')
            : (preferences.language === 'ar' ? '✗ صباح' : '✗ AM');
          return { 
            label: preferences.language === 'ar' ? 'مساءً' : 'Evening', 
            sublabel: amStatus,
            color: 'text-blue-400',
            icon: Moon
          };
        }
        // Completed
        if (isPerfectDay) return { 
          label: preferences.language === 'ar' ? 'مكتمل' : 'Completed', 
          color: 'text-emerald-400',
          icon: CheckCircle2
        };
        return { 
          label: preferences.language === 'ar' ? 'مكتمل' : 'Completed', 
          color: hasAnyFail ? 'text-orange-400' : 'text-emerald-400',
          icon: CheckCircle2
        };
      };
      
      const phaseInfo = getPhaseInfo();
      const PhaseIcon = phaseInfo.icon;
      
      // Morning handlers: value = 0 -> 10 (done) or 20 (fail)
      const handleMorningDone = (e: React.MouseEvent) => {
        e.stopPropagation();
        forcePartyVisible();
        try {
          party.sparkles(e.currentTarget as HTMLElement, { 
            count: party.variation.range(15, 25),
            speed: party.variation.range(150, 300),
            size: party.variation.range(0.5, 0.8),
            color: party.Color.fromHex("#10b981"),
          });
        } catch (err) {
          console.log('Party.js error:', err);
        }
        onUpdate(10, undefined); // AM Done, PM Pending
      };
      
      const handleMorningFail = (e: React.MouseEvent) => {
        e.stopPropagation();
        forcePartyVisible();
        try {
          party.sparkles(e.currentTarget as HTMLElement, { 
            count: party.variation.range(10, 20),
            speed: party.variation.range(200, 400),
            size: party.variation.range(0.4, 0.7),
            color: party.Color.fromHex("#ef4444"),
          });
        } catch (err) {
          console.log('Party.js error:', err);
        }
        onUpdate(20, undefined); // AM Failed, PM Pending
      };
      
      // Evening handlers: current + 1 (done) or current + 2 (fail)
      const handleEveningDone = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newValue = value + 1;
        const newAmState = Math.floor(newValue / 10);
        const isPerfect = newAmState === 1; // AM was done + PM done = perfect
        forcePartyVisible();
        try {
          if (isPerfect) {
            party.confetti(e.currentTarget as HTMLElement, { 
              count: party.variation.range(40, 60),
              spread: party.variation.range(25, 50),
              size: party.variation.range(0.8, 1.2),
            });
          } else {
            party.sparkles(e.currentTarget as HTMLElement, { 
              count: party.variation.range(15, 25),
              speed: party.variation.range(150, 300),
              size: party.variation.range(0.5, 0.8),
              color: party.Color.fromHex("#10b981"),
            });
          }
        } catch (err) {
          console.log('Party.js error:', err);
        }
        // Determine final status: DONE if both sessions done, otherwise FAIL
        const finalStatus = (newAmState === 1) ? LogStatus.DONE : LogStatus.FAIL;
        onUpdate(newValue, finalStatus);
      };
      
      const handleEveningFail = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newValue = value + 2;
        forcePartyVisible();
        try {
          party.sparkles(e.currentTarget as HTMLElement, { 
            count: party.variation.range(10, 20),
            speed: party.variation.range(200, 400),
            size: party.variation.range(0.4, 0.7),
            color: party.Color.fromHex("#ef4444"),
          });
        } catch (err) {
          console.log('Party.js error:', err);
        }
        onUpdate(newValue, LogStatus.FAIL); // At least one session failed
      };
      
      // Undo handler: resets entire day to 0
      const handleUndo = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteLog();
      };

      // Border color based on completion status
      const getBorderStyle = () => {
        if (!isCompleted) return "border-white/5";
        if (isPerfectDay) return "border-emerald-500/30 bg-emerald-500/5";
        if (hasAnyFail) return "border-orange-500/30 bg-orange-500/5";
        return "border-emerald-500/30 bg-emerald-500/5";
      };

      return (
        <motion.div 
          className={clsx(
            "h-[4.5rem] bg-white/5 backdrop-blur-md border rounded-xl flex items-center px-3 relative overflow-hidden transition-all",
            getBorderStyle(),
            onViewDetails && "cursor-pointer hover:bg-white/10"
          )}
          onClick={() => onViewDetails && onViewDetails()}
          animate={isPerfectDay ? successVariant : hasAnyFail && isCompleted ? failVariant : {}}
        >
          {/* Split Doughnut Indicator */}
          <div className="shrink-0 mr-3">
            <SplitDoughnutIndicator value={value} size={44} />
          </div>

          {/* Title & Phase Label */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={clsx(
                "font-bold truncate", 
                titleSizeClass, 
                isPerfectDay ? "text-emerald-400" : isCompleted && hasAnyFail ? "text-orange-400" : "text-white"
              )}>
                {displayTitle}
              </h3>
              {shouldShowStreak(streak) && (
                <div
                  className="flex items-center gap-0.5 text-[10px] text-orange-500 font-bold relative z-20 transition-opacity"
                  style={{ opacity: getStreakOpacity(streak) }}
                >
                  <AnimatedFlame size={10} streak={streak} /> {streak}
                </div>
              )}
            </div>
            <div className={clsx("flex items-center gap-1.5 text-xs mt-0.5", phaseInfo.color)}>
              <PhaseIcon size={12} />
              <span className="font-medium">{phaseInfo.label}</span>
              {'sublabel' in phaseInfo && (
                <span className={clsx("text-[10px] px-1.5 py-0.5 rounded", amState === 1 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                  {phaseInfo.sublabel}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 ml-2">
            {isCompleted ? (
              // Phase 3: Completed - Show Undo
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleUndo}
                className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <RotateCcw size={18} />
              </motion.button>
            ) : (
              // Phase 1 or 2: Show Pass/Fail buttons
              <div className="flex gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={isMorningPhase ? handleMorningDone : handleEveningDone}
                  className="w-10 h-10 flex items-center justify-center bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-lg border border-emerald-500/30 transition-colors"
                >
                  <Check size={18} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={isMorningPhase ? handleMorningFail : handleEveningFail}
                  className="w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg border border-red-500/30 transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      );
  }

  // --- REGULAR COUNTER HABIT LOGIC ---
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
            onViewDetails && "cursor-pointer hover:bg-white/10"
        )}
        onClick={() => onViewDetails && onViewDetails()}
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
                        {shouldShowStreak(streak) && (
                            <div
                              className="flex items-center gap-0.5 text-[10px] text-orange-500 font-bold relative z-20 transition-opacity"
                              style={{ opacity: getStreakOpacity(streak) }}
                            >
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
            "h-14 bg-white/5 backdrop-blur-md border rounded-xl flex items-center pl-3 pr-0 py-0 relative overflow-hidden transition-all",
            isRawatibExcused 
              ? "opacity-50 border-purple-500/30 bg-purple-500/5 pointer-events-none"
              : "border-white/5",
            onViewDetails && !isRawatibExcused && "cursor-pointer hover:bg-white/10"
        )}
        animate={isDone ? successVariant : isFailed ? failVariant : {}}
        onClick={() => onViewDetails && !isRawatibExcused && onViewDetails()}
    >
      
      {/* Icon Container */}
      <div className="w-10 h-full flex items-center justify-center shrink-0 mr-3 border-r border-white/5">
        <IconComponent size={20} className={clsx(isRawatibExcused ? "text-purple-400/50" : isLogged ? "text-gray-500" : "")} style={!isLogged && !isRawatibExcused && iconColor ? { color: iconColor } : undefined} />
      </div>

      {/* Text & Streak */}
      <div className="flex-1 min-w-0 flex flex-col justify-center mr-2">
        <div className="flex items-center gap-1.5">
            <h3 className={clsx("font-bold leading-tight truncate", titleSizeClass, isRawatibExcused ? "text-gray-400" : isLogged ? "text-gray-500" : "text-white")}>
            {displayTitle}
            </h3>
            {/* Status indicator icon after title */}
            {getStatusIcon()}
            {shouldShowStreak(streak) && (
                <div
                  className="flex items-center gap-0.5 text-[10px] text-orange-500 font-bold relative z-20 transition-opacity"
                  style={{ opacity: getStreakOpacity(streak) }}
                >
                    <AnimatedFlame size={10} streak={streak} /> {streak}
                </div>
            )}
        </div>
      </div>

      {/* Action Buttons (2-Column Grid: Done & Fail) */}
      {isRawatibExcused ? (
        <div className="h-full flex items-center px-3 ml-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Pause size={12} className="text-purple-400/60" />
            <span className="text-[10px] font-medium text-purple-400/60">
              {preferences.language === 'ar' ? 'معذورة' : 'Excused'}
            </span>
          </div>
        </div>
      ) : isLogged ? (
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
