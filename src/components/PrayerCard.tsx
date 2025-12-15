import React, { useState, useEffect } from 'react';
import { Habit, HabitLog, PrayerQuality, LogStatus } from '../../types';
import { usePreferences } from '../App';
import { TRANSLATIONS } from '../../constants';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Sunrise, Sun, CloudSun, Sunset, Moon, Users, Clock, XCircle, RotateCcw, GripVertical, Pause } from 'lucide-react';
import AnimatedFlame from './AnimatedFlame';
import RaisedHandsIcon from './icons/RaisedHandsIcon';
// import { getDailyHadith } from '../utils/hadithRotator'; // Hadith feature disabled

interface PrayerCardProps {
  habit: Habit;
  log?: HabitLog;
  streak: number;
  onUpdate: (val: number, reason?: string) => void;
  onReasonNeeded: (val: number) => void;
  onDelete: () => void;
  onViewDetails?: () => void;
  isSortMode?: boolean;
}

const PrayerCard: React.FC<PrayerCardProps> = ({ habit, log, streak, onUpdate, onReasonNeeded, onDelete, onViewDetails, isSortMode }) => {
  const { preferences } = usePreferences();
  const t = TRANSLATIONS[preferences.language];
  const isArabic = preferences.language === 'ar';
  const isFemale = preferences.gender === 'female';
  const [showSparkle, setShowSparkle] = useState(false);
  const [justClicked, setJustClicked] = useState<number | null>(null);

  const currentLevel = log ? log.value : null;
  const isLogged = currentLevel !== null;
  const isExcused = log?.status === LogStatus.EXCUSED;
  const isGlobalExcusedMode = preferences.isExcused && preferences.gender === 'female';

  // Hadith feature disabled for now
  // const dailyHadith = useMemo(() => getDailyHadith(habit.id), [habit.id]);

  const handleTakbirah = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLogged) return;
    setJustClicked(PrayerQuality.TAKBIRAH);
    onUpdate(PrayerQuality.TAKBIRAH);
    setShowSparkle(true);
    setTimeout(() => setShowSparkle(false), 2000);
  };

  const handleUpdateLevel = (level: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLogged) return;
    
    if (level === PrayerQuality.MISSED || level === PrayerQuality.ON_TIME || level === PrayerQuality.JAMAA) {
      setJustClicked(level);
      onReasonNeeded(level);
    } else {
      setJustClicked(level);
      onUpdate(level);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleTextAreaClick = (_e: React.MouseEvent) => {
    if (isSortMode) return;
    if (onViewDetails) {
      onViewDetails();
    }
  };

  useEffect(() => {
    if (justClicked !== null) {
      const timer = setTimeout(() => setJustClicked(null), 800);
      return () => clearTimeout(timer);
    }
  }, [justClicked]);

  // Male levels: 4 options (Takbirah -> Jamaa -> OnTime -> Missed)
  const maleLevels = [
    {
      val: PrayerQuality.TAKBIRAH,
      label: t.takbirah,
      icon: RaisedHandsIcon,
      base: "text-primary hover:bg-primary/20",
      color: "text-primary"
    },
    { 
      val: PrayerQuality.JAMAA, 
      label: t.inGroup, 
      icon: Users,
      base: "text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/20",
      color: "text-yellow-400"
    },
    { 
      val: PrayerQuality.ON_TIME, 
      label: t.onTime, 
      icon: Clock,
      base: "text-slate-400 hover:text-orange-400 hover:bg-orange-500/20",
      color: "text-orange-400"
    },
    { 
      val: PrayerQuality.MISSED, 
      label: t.missed, 
      icon: XCircle,
      base: "text-slate-400 hover:text-red-400 hover:bg-red-500/20",
      color: "text-red-400"
    },
  ];

  // Female levels: 3 options (Earliest Time -> Within Time -> Missed)
  // Earliest Time maps to value 4 (same as TAKBIRAH for scoring)
  // Within Time maps to value 2 (same as ON_TIME for scoring)
  const femaleLevels = [
    {
      val: PrayerQuality.TAKBIRAH, // Maps to value 4 (best score)
      label: isArabic ? 'أول الوقت' : 'Earliest Time',
      icon: Clock,
      base: "text-primary hover:bg-primary/20",
      color: "text-primary"
    },
    { 
      val: PrayerQuality.ON_TIME, // Maps to value 2
      label: isArabic ? 'في الوقت' : 'Within Time', 
      icon: Clock,
      base: "text-slate-400 hover:text-orange-400 hover:bg-orange-500/20",
      color: "text-orange-400"
    },
    { 
      val: PrayerQuality.MISSED, 
      label: t.missed, 
      icon: XCircle,
      base: "text-slate-400 hover:text-red-400 hover:bg-red-500/20",
      color: "text-red-400"
    },
  ];

  // Select levels based on gender
  const levels = isFemale ? femaleLevels : maleLevels;

  const getStatusIcon = () => {
    // Handle excused state
    if (isExcused) {
      return { Icon: Pause, color: 'text-purple-400', isTakbirah: false, isExcused: true };
    }
    const level = levels.find(l => l.val === currentLevel);
    if (level) {
      return { Icon: level.icon, color: level.color, isTakbirah: level.val === PrayerQuality.TAKBIRAH, isExcused: false };
    }
    return null;
  };

  const statusIcon = (isLogged || isExcused) ? getStatusIcon() : null;

  const getPrayerIcon = (id: string) => {
    switch (id) {
      case 'fajr': return Sunrise;
      case 'dhuhr': return Sun;
      case 'asr': return CloudSun;
      case 'maghrib': return Sunset;
      case 'isha': return Moon;
      default: return Sun;
    }
  };

  const Icon = getPrayerIcon(habit.id);

  return (
    <div className={clsx(
        "glass-card rounded-2xl mb-3 relative overflow-hidden transition-all duration-300",
        "h-16 flex items-stretch pl-4 pr-0 py-0",
        isGlobalExcusedMode && !isExcused
          ? "opacity-50 border-purple-500/30 bg-purple-500/5 pointer-events-none" 
          : isExcused 
            ? "opacity-60 border-purple-500/20 bg-purple-500/5" 
            : !isLogged 
              ? "border-primary/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)]" 
              : "opacity-80 border-white/5"
    )}>
      
      {!isLogged && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />}

      <AnimatePresence>
        {showSparkle && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
             <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: [0, 0.3, 0] }}
                 transition={{ duration: 0.4 }}
                 className="absolute inset-0 bg-emerald-500 z-0"
             />

             {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * 360;
                return (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] z-10"
                        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                        animate={{
                            x: Math.cos(angle * Math.PI / 180) * 120,
                            y: Math.sin(angle * Math.PI / 180) * 120,
                            scale: 0,
                            opacity: 0
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                );
             })}
            
            <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: [0, 1.8, 1.2], rotate: 0, opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-20 relative text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]"
            >
              <RaisedHandsIcon size={64} strokeWidth={2.5} />
            </motion.div>
            
             <motion.div
                 initial={{ y: 20, opacity: 0, scale: 0.5 }}
                 animate={{ y: 0, opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.5 }}
                 transition={{ delay: 0.2, type: "spring" }}
                 className="absolute bottom-4 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-yellow-500/50 shadow-xl z-30"
             >
                <span className="text-lg font-bold text-yellow-400">
                    {preferences.language === 'ar' ? "الله أكبر!" : "Takbir!"}
                </span>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        onClick={handleTextAreaClick}
        className={clsx(
          "flex items-center flex-1 min-w-0 overflow-hidden relative z-10",
          onViewDetails && "cursor-pointer hover:bg-white/5"
        )}
      >
        <div className={clsx(
          "w-10 h-full flex items-center justify-center me-3 shrink-0 transition-colors",
          isGlobalExcusedMode ? "text-purple-400/50" : isLogged ? "text-gray-500" : "text-primary"
        )}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
        
        <div className="flex-1 min-w-0 flex items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className={clsx(
                "font-bold text-base leading-tight truncate", 
                isGlobalExcusedMode ? "text-gray-400" : isLogged ? "text-gray-500" : "text-white"
              )}>
                {preferences.language === 'ar' ? habit.nameAr : habit.name}
              </h3>
              {isLogged && statusIcon && (
                <statusIcon.Icon size={statusIcon.isTakbirah ? 12 : 10} strokeWidth={2.5} className={clsx("shrink-0", statusIcon.color)} />
              )}
            </div>
            
            {/* Hadith text - hidden for now */}
            {/* <div className="w-full overflow-hidden mt-1" dir="ltr">
              <div className="animate-scroll-right flex gap-12">
                <span dir="rtl" className={clsx(
                  "whitespace-nowrap text-[10px] font-arabic",
                  isLogged ? "text-gray-600" : "text-slate-400"
                )}>
                  {dailyHadith.text} <span className="text-primary/60 mx-1">— {dailyHadith.source}</span>
                </span>
              </div>
            </div> */}
          </div>

          {streak > 0 && (
            <div className="relative z-10 flex items-center gap-1 text-[9px] font-semibold text-orange-400 ms-2 shrink-0">
              <AnimatedFlame size={9} streak={streak} /> 
              <motion.span
                key={streak}
                initial={{ scale: 1.5, color: "#fbbf24" }}
                animate={{ scale: 1, color: "#fb923c" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {streak}
              </motion.span>
            </div>
          )}
        </div>
      </div>

      {isSortMode ? (
        <div className="h-full w-14 flex items-center justify-center text-slate-500 cursor-grab active:cursor-grabbing relative z-10">
          <GripVertical size={20} />
        </div>
      ) : isGlobalExcusedMode && !isExcused ? (
        // Global Excused Mode active - show disabled state with purple indicator
        <div className="h-full flex items-center px-3 relative z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Pause size={12} className="text-purple-400/60" />
            <span className="text-[10px] font-medium text-purple-400/60">
              {isArabic ? 'معذورة' : 'Excused'}
            </span>
          </div>
        </div>
      ) : isExcused ? (
        // Excused state - show purple moon indicator with undo option
        <div className="h-full flex items-center gap-2 px-3 relative z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <Pause size={12} className="text-purple-400" />
            <span className="text-[10px] font-bold text-purple-400">
              {isArabic ? 'معذورة' : 'Excused'}
            </span>
          </div>
          <motion.button 
            onClick={handleDeleteClick}
            whileTap={{ scale: 0.9 }}
            className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
          </motion.button>
        </div>
      ) : isLogged ? (
        <motion.button 
          onClick={handleDeleteClick}
          whileTap={{ scale: 0.9 }}
          className="h-full w-14 min-w-[44px] flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ms-auto rounded-e-2xl relative z-10"
        >
          <RotateCcw size={18} />
        </motion.button>
      ) : isFemale ? (
        // Female: 3 buttons (Earliest Time, Within Time, Missed)
        <div className="h-full flex items-stretch flex-none">
          {femaleLevels.map((level, idx) => {
            const LevelIcon = level.icon;
            const isFirst = idx === 0;
            const isLast = idx === femaleLevels.length - 1;
            return (
              <motion.button
                key={level.val}
                onClick={isFirst ? handleTakbirah : handleUpdateLevel(level.val)}
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  "h-full flex-1 w-11 flex items-center justify-center transition-all duration-300 border-s border-white/10 relative z-10 bg-transparent",
                  isLast && "rounded-e-xl",
                  level.base
                )}
                aria-label={level.label}
              >
                <LevelIcon size={18} />
              </motion.button>
            );
          })}
        </div>
      ) : (
        // Male: 4 buttons (Takbirah, Jamaa, OnTime, Missed)
        <div className="h-full flex items-stretch flex-none">
          {/* Takbirah button (best - raised hands) */}
          <motion.button
            onClick={handleTakbirah}
            whileTap={{ scale: 0.9 }}
            className="h-full flex-1 w-11 flex items-center justify-center font-bold transition-all duration-300 border-s border-white/10 relative z-10 text-primary hover:bg-primary/20 bg-transparent"
            aria-label={t.takbirah}
          >
            <RaisedHandsIcon size={18} />
          </motion.button>
          
          {/* Other levels: Jamaa, OnTime, Missed */}
          {maleLevels.slice(1).map((level, idx) => {
            const LevelIcon = level.icon;
            const isLast = idx === maleLevels.slice(1).length - 1;
            return (
              <motion.button
                key={level.val}
                onClick={handleUpdateLevel(level.val)}
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  "h-full flex-1 w-11 flex items-center justify-center transition-all duration-300 border-s border-white/10 relative z-10 bg-transparent",
                  isLast && "rounded-e-xl",
                  level.base
                )}
                aria-label={level.label}
              >
                <LevelIcon size={18} />
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PrayerCard;
