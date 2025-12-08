import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, ArrowLeft, Mail, CheckCircle2, Sparkles, Users, Zap, Share, MoreVertical, Plus, Smartphone, Sunrise, Sun, CloudSun, Sunset, Moon, Clock, XCircle } from "lucide-react";
import { DemoPersona } from "../services/storage";
// 1. Updated Imports to include Scroll hooks
import { motion, AnimatePresence, useScroll, useTransform, MotionValue } from "framer-motion";

type FormMode = "signin" | "signup" | "recovery";

// Animated Hourglass with Flames component for loading
const AnimatedHourglass: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <motion.div
    className="relative inline-flex items-center justify-center"
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-white">
      <path 
        d="M6 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4V2z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="rgba(255, 255, 255, 0.2)"
      />
    </svg>
  </motion.div>
);

// 2. UPDATED COMPONENT: Handles Parallax + Levitation + Wobble
const DustParticle: React.FC<{ 
  x: number; 
  y: number; 
  size: number; 
  blur: number; 
  opacity: number;
  duration: number;
  delay: number;
  wobble: number;
  depth: number; // Needed for parallax speed calculation
  scrollY: MotionValue<number>; // Needed to track scroll
}> = ({ x, y, size, blur, opacity, duration, delay, wobble, depth, scrollY }) => {
  
  // Parallax Logic: Maps scroll position to vertical movement
  // Depth 1 (Close) moves fast (-200px), Depth 0 (Far) moves slow
  const parallaxY = useTransform(scrollY, [0, 1000], [0, -200 * depth]);

  return (
    // OUTER DIV: Handles Scroll Parallax & Position
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        y: parallaxY, // Bind scroll movement
      }}
    >
      {/* INNER DIV: Handles Levitation, Wobble & Appearance */}
      <motion.div
        className="rounded-full bg-white"
        style={{
          width: size,
          height: size,
          filter: `blur(${blur}px)`,
          boxShadow: `0 0 ${size * 2}px rgba(255,255,255,0.4)`
        }}
        animate={{
          y: [0, -200], // Levitation Upwards
          x: [0, wobble, -wobble, 0], // Wobble Left/Right
          opacity: [0, opacity, opacity, 0], // Long life fade
        }}
        transition={{
          duration: duration,
          delay: delay,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.1, 0.8, 1], // Fade in fast, stay visible long, fade out end
          x: {
            duration: duration, 
            repeat: Infinity, 
            ease: "easeInOut", 
            times: [0, 0.25, 0.75, 1] 
          }
        }}
      />
    </motion.div>
  );
};

// Demo prayer data for Section 2 animation
const DEMO_PRAYERS = [
  { id: 'fajr', name: 'Fajr', nameAr: 'الفجر', icon: Sunrise },
  { id: 'dhuhr', name: 'Dhuhr', nameAr: 'الظهر', icon: Sun },
  { id: 'asr', name: 'Asr', nameAr: 'العصر', icon: CloudSun },
  { id: 'maghrib', name: 'Maghrib', nameAr: 'المغرب', icon: Sunset },
  { id: 'isha', name: 'Isha', nameAr: 'العشاء', icon: Moon },
];

// Quality levels matching real PrayerCard
const QUALITY_LEVELS = [
  { id: 0, icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  { id: 1, icon: Users, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
  { id: 2, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' },
  { id: 3, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
];

// Demo Prayer Card Component (matches real PrayerCard styling)
const DemoPrayerCard: React.FC<{
  prayer: typeof DEMO_PRAYERS[0];
  isArabic: boolean;
  isLogging: boolean;
  activeButton: number | null;
}> = ({ prayer, isArabic, isLogging, activeButton }) => {
  const Icon = prayer.icon;
  const activeQuality = activeButton !== null ? QUALITY_LEVELS[activeButton] : null;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={isLogging ? {
        opacity: 0,
        y: -60,
        scale: 0.9,
      } : {
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: -80,
        scale: 0.85,
      }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut",
        layout: { duration: 0.3, ease: "easeInOut", type: "tween" }
      }}
      className={`
        relative overflow-hidden rounded-2xl mb-2
        flex items-stretch
        bg-gradient-to-r from-slate-900/90 to-slate-800/60
        border transition-all duration-300
        ${isLogging && activeQuality ? activeQuality.border : 'border-white/10'}
        ${isLogging ? 'shadow-lg shadow-emerald-500/10' : ''}
      `}
    >
      {/* Glow effect when logging */}
      {isLogging && activeQuality && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 ${activeQuality.bg} pointer-events-none`}
        />
      )}
      
      {/* Left side - Icon & Name */}
      <div className="flex items-center px-4 py-3 flex-1 min-w-0">
        <div className={`w-9 h-9 flex items-center justify-center mr-3 transition-colors ${isLogging && activeQuality ? activeQuality.color : 'text-emerald-500/70'}`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <h3 className={`font-bold text-sm truncate ${isLogging && activeQuality ? activeQuality.color : 'text-white/90'}`}>
          {isArabic ? prayer.nameAr : prayer.name}
        </h3>
      </div>
      
      {/* Right side - Quality Buttons */}
      <div className="flex items-center gap-1 px-2 py-2 border-l border-white/5">
        {QUALITY_LEVELS.map((level) => {
          const LevelIcon = level.icon;
          const isActive = activeButton === level.id;
          return (
            <div
              key={level.id}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${isActive 
                  ? `${level.bg} ${level.color} scale-110 ${level.border} border` 
                  : 'text-white/30 bg-white/5'
                }
              `}
            >
              <LevelIcon size={14} />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const Login: React.FC = () => {
  // 3. Initialize Scroll Hook
  const { scrollY } = useScroll();
  
  const { signInWithEmail, signUpWithEmail, startDemo, resetPasswordForEmail } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("ar");
  const [mode, setMode] = useState<FormMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  
  // Demo animation state for Section 2
  const [loggedPrayers, setLoggedPrayers] = useState<string[]>([]);
  const [currentlyLogging, setCurrentlyLogging] = useState<string | null>(null);
  const [activeButtons, setActiveButtons] = useState<Record<string, number>>({});

  const isArabic = language === "ar";
  
  // Auto-animate the prayer demo with random quality selection
  useEffect(() => {
    const unloggedPrayers = DEMO_PRAYERS.filter(p => !loggedPrayers.includes(p.id));
    
    if (unloggedPrayers.length === 0) {
      // All prayers logged, reset after showing completion message
      const resetTimer = setTimeout(() => {
        setLoggedPrayers([]);
        setCurrentlyLogging(null);
        setActiveButtons({});
      }, 2500);
      return () => clearTimeout(resetTimer);
    }
    
    // Start logging the next prayer after a delay
    const logTimer = setTimeout(() => {
      const nextPrayer = unloggedPrayers[0];
      if (nextPrayer) {
        // Pick a random quality level (0-3)
        const randomQuality = Math.floor(Math.random() * 4);
        
        // First highlight the button
        setActiveButtons(prev => ({ ...prev, [nextPrayer.id]: randomQuality }));
        
        // Then start the logging animation
        setTimeout(() => {
          setCurrentlyLogging(nextPrayer.id);
          
          // After animation, mark as logged
          setTimeout(() => {
            setLoggedPrayers(prev => [...prev, nextPrayer.id]);
            setCurrentlyLogging(null);
          }, 500);
        }, 400);
      }
    }, 1500);
    
    return () => clearTimeout(logTimer);
  }, [loggedPrayers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } =
      mode === "signin"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);

    setLoading(false);

    if (authError) {
      setError(authError.message);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await resetPasswordForEmail(email);

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setRecoverySuccess(true);
    }
  };

  const handleDemo = (persona: DemoPersona) => {
    startDemo(persona);
  };

  const switchToRecovery = () => {
    setMode("recovery");
    setError(null);
    setRecoverySuccess(false);
  };

  const switchToLogin = () => {
    setMode("signin");
    setError(null);
    setRecoverySuccess(false);
  };

  const personas = [
    {
      id: "devout" as DemoPersona,
      nameEn: "The Worshiper",
      nameAr: "المجتهد",
      descEn: "95% consistency",
      descAr: "٩٥٪ التزام",
      icon: Sparkles,
      gradient: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/40",
      iconColor: "text-emerald-400",
    },
    {
      id: "intermediate" as DemoPersona,
      nameEn: "Half & Half",
      nameAr: "الوسط",
      descEn: "75% consistency",
      descAr: "٧٥٪ التزام",
      icon: Users,
      gradient: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/40",
      iconColor: "text-amber-400",
    },
    {
      id: "beginner" as DemoPersona,
      nameEn: "The Careless",
      nameAr: "الصايع / الغافل",
      descEn: "30% consistency",
      descAr: "٣٠٪ التزام",
      icon: Zap,
      gradient: "from-slate-500/20 to-slate-600/10",
      border: "border-slate-500/40",
      iconColor: "text-slate-400",
    },
  ];

  // 4. UPDATED DATA: Added 'depth' to the return object
  const dustParticles = Array.from({ length: 150 }, () => {
    const depth = Math.random(); 
    return {
      depth, // <--- Passing this is crucial for parallax calculation
      x: Math.random() * 100,
      y: Math.random() * 100, 
      size: 1 + depth * 2.5, 
      blur: (1 - depth) * 2, 
      opacity: 0.1 + depth * 0.4, 
      duration: 15 - (depth * 9), 
      delay: Math.random() * 5,
      wobble: 10 + (depth * 30) 
    };
  });

  const [installTab, setInstallTab] = useState<'iphone' | 'android'>('iphone');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-y-auto" dir={isArabic ? "rtl" : "ltr"}>
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[150px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* 5. UPDATED RENDER: Passed scrollY prop and cleaned up duplicates */}
        {dustParticles.map((p, i) => (
          <DustParticle 
            key={`dust-${i}`} 
            {...p} 
            scrollY={scrollY} 
          />
        ))}
      </div>

      {/* Top Bar */}
      <header className="w-full px-6 py-5 flex items-center justify-between relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Sparkles className="text-white" size={18} />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">حَسِيب</span>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="flex items-center gap-2 px-4 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all text-sm"
        >
          <Globe size={16} />
          {language === "en" ? "العربية" : "English"}
        </motion.button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 pt-8 pb-16 relative z-10">
        <div className="w-full max-w-md">
          
          {/* Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight leading-tight">
              {isArabic ? (
                <>ابدأ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">رحلتك</span></>
              ) : (
                <>Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Journey</span></>
              )}
            </h1>
            <p className="text-white/40 text-lg leading-relaxed">
              {isArabic 
                ? "تتبع عباداتك • حسّن نفسك • اقترب من الله" 
                : "Track worship • Improve yourself • Get closer to Allah"}
            </p>
          </motion.div>

          {/* Section 1: The Why - Spiritual Anchor */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-16 text-center"
          >
            {/* Opening Text - The Book Metaphor */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mb-10"
            >
              <p className="text-white/60 text-base leading-loose font-regular" style={{ fontFamily: 'Georgia, serif' }}>
                {isArabic ? (
                  <>
                    هناك كتابٌ معلَّقٌ على كتفك،
                    <br />
                    يُزاد فيه كلَّ يومٍ ما كُتِب من غفلةٍ أو يقظة،
                    <br />
                    من تقصيرٍ أو مجاهدة…
                    <br /><br />
                    كتابٌ لم تُقلَّب صفحاته بعد،
                    <br />
                    ولكنك ستقف عليه يومًا لا مفر منه،
                    <br />
                    يوم يُقال لك:
                  </>
                ) : (
                  <>
                    There is a book upon your shoulder,
                    <br />
                    A record that grows each day with moments
                    <br />
                    of heedlessness or awareness, neglect or striving.
                    <br /><br />
                    A book whose pages you have not yet seen…
                    <br />
                    But one day you will stand before it,
                    <br />
                    And it will be said to you:
                  </>
                )}
              </p>
            </motion.div>

            {/* The Verse Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative mx-auto mb-10"
            >
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] backdrop-blur-sm shadow-2xl">
                <img 
                  src="/verse.png" 
                  alt={isArabic ? "آية قرآنية" : "Quranic Verse"}
                  className="relative w-full max-w-[280px] mx-auto rounded-lg"
                />
              </div>
            </motion.div>

            {/* Closing Text - Call to Awakening */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.1 }}
            >
              <p className="text-white/60 text-base leading-loose font-regular" style={{ fontFamily: 'Georgia, serif' }}>
                {isArabic ? (
                  <>
                    فإن لم تُحاسِب نفسك اليوم، فمتى ينفعك الحساب؟
                    <br />
                    قِف مع نفسك وقفة حق…
                    <br /><br /><br />
                    فالطريق إلى النجاة يبدأ من اليقظة،
                    <br />
                    ومن أدرك نفسه اليوم، نجا غدًا.
                  </>
                ) : (
                  <>
                    If you do not hold your soul accountable now,
                    <br />
                    then when will accountability benefit you?
                    <br /><br />
                    Stand with yourself in truth…
                    <br />
                    for the path to salvation begins with awakening.
                    <br />
                    Whoever grasps his soul today will be saved tomorrow.
                  </>
                )}
              </p>
            </motion.div>

            {/* Decorative Divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="mt-12 flex items-center justify-center gap-3"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/50" />
              <Sparkles size={16} className="text-emerald-500/50" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/50" />
            </motion.div>
          </motion.section>

          {/* Section 2: The Plan - Interactive Demo */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-black text-white mb-2">
                {isArabic ? 'الخطة' : 'The Plan'}
              </h2>
              <p className="text-white/50 text-base">
                {isArabic 
                  ? 'سجّل صلواتك، ارتقِ بجودتها' 
                  : 'Log your prayers, elevate your quality'}
              </p>
            </motion.div>

            {/* Interactive Prayer Demo - Fixed Height, Transparent Background */}
            <div className="relative h-[320px] overflow-hidden">
              {/* Prayer Cards */}
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  {DEMO_PRAYERS.filter(p => !loggedPrayers.includes(p.id)).map((prayer) => (
                    <DemoPrayerCard
                      key={prayer.id}
                      prayer={prayer}
                      isArabic={isArabic}
                      isLogging={currentlyLogging === prayer.id}
                      activeButton={activeButtons[prayer.id] ?? null}
                    />
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Completion Message */}
              <AnimatePresence>
                {loggedPrayers.length === 5 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.8 }}
                      className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30"
                    >
                      <Sparkles size={28} className="text-emerald-400" />
                    </motion.div>
                    <p className="text-white/80 font-medium text-lg leading-relaxed">
                      {isArabic ? (
                        <>للصلوات. للرواتب.<br />لكل أعمالك.</>
                      ) : (
                        <>For Prayers. For Rawatib.<br />For all of your work.</>
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Decorative Divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex items-center justify-center gap-3"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/50" />
              <Sparkles size={16} className="text-emerald-500/50" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/50" />
            </motion.div>
          </motion.section>

          {/* Section 3: The Results - Analytics Carousel */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-black text-white mb-2">
                {isArabic ? 'النتائج' : 'The Results'}
              </h2>
              <p className="text-white/50 text-base">
                {isArabic 
                  ? 'تحليلات ورؤى لتتبع تقدمك' 
                  : 'Analytics & insights to track your progress'}
              </p>
            </motion.div>

            {/* Horizontal Carousel */}
            <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4 w-max pb-4">
                
                {/* Card 1: Consolidated Prayer Analytics */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="snap-start w-[280px] shrink-0 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5"
                >
                  {/* Card Explanation - 25% of card */}
                  <div className="mb-4 pb-3 border-b border-white/[0.06]">
                    <h3 className="text-white font-bold text-sm mb-1.5">
                      {isArabic ? 'تحليل الصلوات' : 'Prayer Analytics'}
                    </h3>
                    <p className="text-white/50 text-xs leading-relaxed">
                      {isArabic 
                        ? 'تحليل شامل لجودة صلواتك الخمس اليومية. تتبع نسبة التكبيرة والجماعة والفائتة.'
                        : 'Full breakdown of your 5 daily prayers. Track Takbirah rate, Jamaa, and missed prayers.'}
                    </p>
                  </div>
                  
                  {/* Donut Chart + Stats - Centered Layout */}
                  <div className="flex flex-col items-center">
                    {/* CSS Donut Chart - Larger */}
                    <div className="relative w-28 h-28 mb-4">
                      <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3.5" 
                          strokeDasharray="60 100" strokeLinecap="round" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="3.5" 
                          strokeDasharray="13 100" strokeDashoffset="-60" strokeLinecap="round" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f97316" strokeWidth="3.5" 
                          strokeDasharray="9 100" strokeDashoffset="-73" strokeLinecap="round" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="3.5" 
                          strokeDasharray="6 100" strokeDashoffset="-82" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-amber-400">68%</span>
                        <span className="text-[8px] text-gray-500">{isArabic ? 'تكبيرة' : 'Takbirah'}</span>
                      </div>
                    </div>
                    
                    {/* Quality Breakdown - Horizontal */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-gray-400">{isArabic ? 'تكبيرة' : 'Takbirah'}</span>
                        <span className="font-bold text-emerald-400 ml-auto">68%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
                        <span className="text-gray-400">{isArabic ? 'جماعة' : 'Jamaa'}</span>
                        <span className="font-bold text-yellow-400 ml-auto">15%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                        <span className="text-gray-400">{isArabic ? 'في الوقت' : 'On Time'}</span>
                        <span className="font-bold text-orange-400 ml-auto">10%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-gray-400">{isArabic ? 'فائتة' : 'Missed'}</span>
                        <span className="font-bold text-red-400 ml-auto">7%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Obstacles */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">
                      {isArabic ? 'أهم العوائق' : 'Top Obstacles'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[9px] rounded-full border border-red-500/20">
                        {isArabic ? 'النوم' : 'Sleep'}
                      </span>
                      <span className="px-2 py-1 bg-orange-500/10 text-orange-400 text-[9px] rounded-full border border-orange-500/20">
                        {isArabic ? 'العمل' : 'Work'}
                      </span>
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-[9px] rounded-full border border-yellow-500/20">
                        {isArabic ? 'الكسل' : 'Laziness'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Card 2: Monthly View */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="snap-start w-[280px] shrink-0 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5"
                >
                  {/* Card Explanation - 25% of card */}
                  <div className="mb-4 pb-3 border-b border-white/[0.06]">
                    <h3 className="text-white font-bold text-sm mb-1.5">
                      {isArabic ? 'العرض الشهري' : 'Monthly View'}
                    </h3>
                    <p className="text-white/50 text-xs leading-relaxed">
                      {isArabic 
                        ? 'كل حلقة تمثل يوم كامل. الألوان تدل على جودة كل صلاة من الخمس.'
                        : 'Each ring represents one day. Colors show the quality of each of the 5 prayers.'}
                    </p>
                  </div>
                  
                  {/* Mini Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <div key={i} className="text-[7px] text-gray-500 text-center font-bold mb-1">{d}</div>
                    ))}
                    {/* Empty cells for offset */}
                    {[...Array(3)].map((_, i) => <div key={`empty-${i}`} />)}
                    {/* Day rings - 28 days with varied quality colors */}
                    {[...Array(28)].map((_, i) => {
                      const dayNum = i + 1;
                      // Quality patterns: 0=Takbirah(green), 1=Jamaa(yellow), 2=OnTime(orange), 3=Missed(red), 4=NotLogged(gray)
                      const qualityColors = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#1e293b'];
                      // Simulated data per day - 5 prayers with different qualities
                      const dayPatterns = [
                        [0,0,1,0,0], [0,1,0,1,0], [0,0,0,2,0], [1,0,0,0,1], [0,0,0,0,0],
                        [0,1,1,0,0], [2,0,0,3,0], [0,0,0,0,0], [3,3,4,4,4], [0,0,0,0,0],
                        [0,1,0,0,1], [0,0,2,0,0], [1,1,0,0,0], [0,0,0,1,0], [0,0,0,0,0],
                        [2,0,0,0,2], [0,0,0,0,0], [0,1,0,1,0], [0,0,0,0,0], [0,2,0,0,1],
                        [0,0,0,0,0], [1,0,0,0,0], [0,0,1,0,0], [0,0,0,0,0], [3,0,0,2,0],
                        [0,0,0,0,0], [0,1,0,0,0], [0,0,0,0,0],
                      ];
                      const qualities = dayPatterns[i] || [4,4,4,4,4];
                      return (
                        <div key={dayNum} className="relative w-full aspect-square">
                          <svg viewBox="0 0 40 40" className="w-full h-full rotate-[-90deg]">
                            {qualities.map((q, j) => {
                              const startAngle = j * 72;
                              const endAngle = startAngle + 67;
                              const startRad = (startAngle * Math.PI) / 180;
                              const endRad = (endAngle * Math.PI) / 180;
                              const r = 15, cx = 20, cy = 20;
                              const x1 = cx + r * Math.cos(startRad);
                              const y1 = cy + r * Math.sin(startRad);
                              const x2 = cx + r * Math.cos(endRad);
                              const y2 = cy + r * Math.sin(endRad);
                              return (
                                <path 
                                  key={j} 
                                  d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                                  fill="none" 
                                  stroke={qualityColors[q]} 
                                  strokeWidth={3.5} 
                                  strokeLinecap="round"
                                />
                              );
                            })}
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-gray-500 font-bold">
                            {dayNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Card 3: Growth Table */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="snap-start w-[280px] shrink-0 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5"
                >
                  {/* Card Explanation - 25% of card */}
                  <div className="mb-4 pb-3 border-b border-white/[0.06]">
                    <h3 className="text-white font-bold text-sm mb-1.5">
                      {isArabic ? 'جدول النمو' : 'Growth Table'}
                    </h3>
                    <p className="text-white/50 text-xs leading-relaxed">
                      {isArabic 
                        ? 'تتبع تقدمك أسبوعياً وشهرياً وربع سنوياً وسنوياً. الأرقام الخضراء تعني تحسن.'
                        : 'Track progress weekly, monthly, quarterly & yearly. Green numbers mean improvement.'}
                    </p>
                  </div>
                  
                  {/* Growth Table */}
                  <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-5 bg-white/[0.03] p-2.5 text-[8px] font-bold text-gray-400 uppercase text-center">
                      <div className="text-start">{isArabic ? 'صلاة' : 'Prayer'}</div>
                      <div>WoW</div><div>MoM</div><div>QoQ</div><div>YoY</div>
                    </div>
                    {/* Rows */}
                    {[
                      { name: isArabic ? 'الفجر' : 'Fajr', data: ['+2', '+5', '+12', '+18'] },
                      { name: isArabic ? 'الظهر' : 'Dhuhr', data: ['+1', '+3', '+8', '+15'] },
                      { name: isArabic ? 'العصر' : 'Asr', data: ['-1', '+2', '+6', '+10'] },
                      { name: isArabic ? 'المغرب' : 'Maghrib', data: ['+3', '+4', '+9', '+14'] },
                      { name: isArabic ? 'العشاء' : 'Isha', data: ['0', '+1', '+4', '+8'] },
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-5 border-t border-white/[0.04] p-2.5 text-center items-center">
                        <div className="text-start text-[9px] font-medium text-white/80">{row.name}</div>
                        {row.data.map((val, j) => {
                          const isPos = val.startsWith('+');
                          const isZero = val === '0';
                          return (
                            <div key={j} className={`text-[9px] font-bold ${isZero ? 'text-gray-500' : isPos ? 'text-green-400' : 'text-red-400'}`}>
                              {val}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Card 4: Rawatib View */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="snap-start w-[280px] shrink-0 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5"
                >
                  {/* Card Explanation - 25% of card */}
                  <div className="mb-4 pb-3 border-b border-white/[0.06]">
                    <h3 className="text-white font-bold text-sm mb-1.5">
                      {isArabic ? 'تتبع الرواتب' : 'Rawatib Tracker'}
                    </h3>
                    <p className="text-white/50 text-xs leading-relaxed">
                      {isArabic 
                        ? 'كل بيت يمثل ٦ سنن راتبة. الأزرق يعني جزئي، الأخضر يعني مكتمل.'
                        : 'Each house = 6 Sunnah prayers. Blue means partial, green means complete.'}
                    </p>
                  </div>
                  
                  {/* Mini Rawatib Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <div key={i} className="text-[7px] text-gray-500 text-center font-bold mb-1">{d}</div>
                    ))}
                    {/* Empty cells */}
                    {[...Array(3)].map((_, i) => <div key={`empty-r-${i}`} />)}
                    {/* House shapes - 28 days */}
                    {[...Array(28)].map((_, i) => {
                      const dayNum = i + 1;
                      // Simulated: ~70% completion patterns
                      const completedSegments = [6,4,5,3,6,5,2,6,4,5,1,6,3,4,6,5,4,6,0,5,4,6,3,5,6,4,2,6][i] || 0;
                      const allComplete = completedSegments === 6;
                      const segments = [
                        'M 20,6 L 6,18',   // roof-left
                        'M 20,6 L 34,18',  // roof-right
                        'M 6,18 L 9,34',   // wall-left
                        'M 34,18 L 31,34', // wall-right
                        'M 9,34 L 20,34',  // floor-left
                        'M 20,34 L 31,34', // floor-right
                      ];
                      return (
                        <div key={dayNum} className="relative w-full aspect-square">
                          <svg viewBox="0 0 40 40" className="w-full h-full">
                            {/* Base house */}
                            {segments.map((d, j) => (
                              <path key={`base-${j}`} d={d} fill="none" stroke="#1e293b" strokeWidth={2.5} strokeLinecap="round" />
                            ))}
                            {/* Active segments */}
                            {segments.slice(0, completedSegments).map((d, j) => (
                              <path key={`active-${j}`} d={d} fill="none" stroke={allComplete ? '#22c55e' : '#3b82f6'} strokeWidth={3} strokeLinecap="round" />
                            ))}
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-gray-500 font-bold mt-1">
                            {dayNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
                
              </div>
            </div>

            {/* Scroll hint */}
            <p className="text-center text-white/30 text-[10px] mt-2">
              {isArabic ? '← اسحب لرؤية المزيد →' : '← Swipe to see more →'}
            </p>

            {/* Decorative Divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex items-center justify-center gap-3"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/50" />
              <Sparkles size={16} className="text-emerald-500/50" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/50" />
            </motion.div>
          </motion.section>

          <AnimatePresence mode="wait">
            {mode === "recovery" ? (
              /* Recovery Mode */
              <motion.div
                key="recovery"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <button
                  onClick={switchToLogin}
                  className={`flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm ${isArabic ? 'flex-row-reverse' : ''}`}
                >
                  <ArrowLeft size={16} className={isArabic ? 'rotate-180' : ''} />
                  {isArabic ? "العودة" : "Back"}
                </button>

                <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                      <Mail className="text-emerald-400" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {isArabic ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                    </h2>
                    <p className="text-white/30 text-sm">
                      {isArabic
                        ? "أدخل بريدك الإلكتروني"
                        : "Enter your email address"}
                    </p>
                  </div>

                  {recoverySuccess ? (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-4"
                    >
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="text-emerald-400" size={28} />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {isArabic ? "تحقق من بريدك!" : "Check Your Email!"}
                      </h3>
                      <p className="text-white/30 text-sm mb-4">{email}</p>
                      <button
                        onClick={switchToLogin}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                      >
                        {isArabic ? "العودة" : "Return to Login"}
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleRecovery} className="space-y-4">
                      <input
                        type="email"
                        placeholder={isArabic ? "البريد الإلكتروني" : "Email"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-base ${isArabic ? 'text-right' : 'text-left'}`}
                        required
                        dir={isArabic ? "rtl" : "ltr"}
                      />
                      {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
                          {error}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading && <AnimatedHourglass size={18} />}
                        {isArabic ? "إرسال" : "Send Link"}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Sign In / Sign Up Mode */
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Auth Card */}
                <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                  {/* Tab Switcher */}
                  <div className="flex bg-white/[0.03] rounded-xl p-1 mb-6 border border-white/[0.04]">
                    <button
                      onClick={() => setMode("signin")}
                      className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                        mode === "signin"
                          ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30"
                          : "text-white/30 hover:text-white/50"
                      }`}
                    >
                      {isArabic ? "تسجيل الدخول" : "Sign In"}
                    </button>
                    <button
                      onClick={() => setMode("signup")}
                      className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                        mode === "signup"
                          ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30"
                          : "text-white/30 hover:text-white/50"
                      }`}
                    >
                      {isArabic ? "حساب جديد" : "Sign Up"}
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="email"
                      placeholder={isArabic ? "البريد الإلكتروني" : "Email"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-base ${isArabic ? 'text-right' : 'text-left'}`}
                      required
                      dir={isArabic ? "rtl" : "ltr"}
                    />
                    <input
                      type="password"
                      placeholder={isArabic ? "كلمة المرور" : "Password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-base ${isArabic ? 'text-right' : 'text-left'}`}
                      required
                      dir={isArabic ? "rtl" : "ltr"}
                    />

                    {mode === "signin" && (
                      <div className={isArabic ? "text-left" : "text-right"}>
                        <button
                          type="button"
                          onClick={switchToRecovery}
                          className="text-white/30 hover:text-emerald-400 text-sm transition-colors"
                        >
                          {isArabic ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                        </button>
                      </div>
                    )}

                    {error && (
                      <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <AnimatedHourglass size={18} />}
                      {mode === "signin"
                        ? isArabic ? "دخول" : "Sign In"
                        : isArabic ? "إنشاء حساب" : "Create Account"}
                    </button>
                  </form>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-slate-950 text-white/20 text-xs uppercase tracking-widest font-medium">
                      {isArabic ? "أو جرب" : "Or Try"}
                    </span>
                  </div>
                </div>

                {/* Demo Personas */}
                <div className="space-y-3">
                  {personas.map((persona, index) => {
                    const Icon = persona.icon;
                    return (
                      <motion.button
                        key={persona.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        onClick={() => handleDemo(persona.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-4 px-5 bg-gradient-to-r ${persona.gradient} border ${persona.border} rounded-xl transition-all flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''} backdrop-blur-sm`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${persona.iconColor}`}>
                          <Icon size={20} />
                        </div>
                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                          <div className="font-bold text-white text-base">
                            {isArabic ? persona.nameAr : persona.nameEn}
                          </div>
                          <div className="text-white/40 text-sm">
                            {isArabic ? persona.descAr : persona.descEn}
                          </div>
                        </div>
                        <div className="text-white/20">
                          <ArrowLeft size={18} className={isArabic ? '' : 'rotate-180'} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Install to Home Screen Instructions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8"
                >
                  <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.04] rounded-xl p-4">
                    {/* Header */}
                    <div className={`flex items-center gap-2 mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <Smartphone size={14} className="text-white/40" />
                      <span className="text-white/40 text-xs font-medium">
                        {isArabic ? 'أضف إلى الشاشة الرئيسية' : 'Add to Home Screen'}
                      </span>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-white/[0.03] rounded-lg p-0.5 mb-3 border border-white/[0.04]">
                      <button
                        onClick={() => setInstallTab('iphone')}
                        className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                          installTab === 'iphone'
                            ? 'bg-white/[0.08] text-white'
                            : 'text-white/30 hover:text-white/50'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        iPhone
                      </button>
                      <button
                        onClick={() => setInstallTab('android')}
                        className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                          installTab === 'android'
                            ? 'bg-white/[0.08] text-white'
                            : 'text-white/30 hover:text-white/50'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                          <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
                        </svg>
                        Android
                      </button>
                    </div>

                    {/* Instructions */}
                    <AnimatePresence mode="wait">
                      {installTab === 'iphone' ? (
                        <motion.div
                          key="iphone"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-2"
                        >
                          <div className={`flex items-center gap-2.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] text-white/50 font-bold shrink-0">1</div>
                            <div className={`flex items-center gap-1.5 text-white/50 text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                              <span>{isArabic ? 'اضغط على' : 'Tap'}</span>
                              <Share size={12} className="text-emerald-400" />
                              <span>{isArabic ? 'في Safari' : 'in Safari'}</span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] text-white/50 font-bold shrink-0">2</div>
                            <div className={`flex items-center gap-1.5 text-white/50 text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                              <span>{isArabic ? 'اختر' : 'Select'}</span>
                              <Plus size={12} className="text-emerald-400" />
                              <span>{isArabic ? '"إضافة إلى الشاشة"' : '"Add to Home Screen"'}</span>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="android"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-2"
                        >
                          <div className={`flex items-center gap-2.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] text-white/50 font-bold shrink-0">1</div>
                            <div className={`flex items-center gap-1.5 text-white/50 text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                              <span>{isArabic ? 'اضغط على' : 'Tap'}</span>
                              <MoreVertical size={12} className="text-emerald-400" />
                              <span>{isArabic ? 'في Chrome' : 'in Chrome'}</span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] text-white/50 font-bold shrink-0">2</div>
                            <div className={`flex items-center gap-1.5 text-white/50 text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                              <span>{isArabic ? 'اختر' : 'Select'}</span>
                              <Smartphone size={12} className="text-emerald-400" />
                              <span>{isArabic ? '"تثبيت التطبيق"' : '"Install App"'}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center relative z-10">
        <p className="text-white/15 text-xs font-medium tracking-wide">
          {isArabic ? "صُنع بـ 💙 للآخــرة" : "Built with 💙 for the Ummah"}
        </p>
      </footer>
    </div>
  );
};

export default Login;