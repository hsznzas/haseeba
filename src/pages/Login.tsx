import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, ArrowLeft, Mail, CheckCircle2, Sparkles, Users, Zap } from "lucide-react";
import { DemoPersona } from "../services/storage";
import { motion, AnimatePresence } from "framer-motion";

type FormMode = "signin" | "signup" | "recovery";

// Animated Hourglass with Flames component for loading
const AnimatedHourglass: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <motion.div
    className="relative inline-flex items-center justify-center"
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-blue-400">
      <path 
        d="M6 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4V2z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="rgba(59, 130, 246, 0.2)"
      />
    </svg>
    <motion.div
      className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full blur-[2px]"
      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 0.5, repeat: Infinity }}
    />
  </motion.div>
);

// Floating particles for background
const FloatingParticle: React.FC<{ delay: number; duration: number; x: number }> = ({ delay, duration, x }) => (
  <motion.div
    className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
    initial={{ y: "100vh", x: `${x}vw`, opacity: 0 }}
    animate={{ 
      y: "-10vh", 
      opacity: [0, 1, 1, 0],
    }}
    transition={{ 
      duration, 
      delay, 
      repeat: Infinity, 
      ease: "linear" 
    }}
  />
);

const Login: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, startDemo, resetPasswordForEmail } = useAuth();
  // Arabic as default
  const [language, setLanguage] = useState<"en" | "ar">("ar");
  const [mode, setMode] = useState<FormMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const isArabic = language === "ar";

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

  // Persona configs with relatable names
  const personas = [
    {
      id: "devout" as DemoPersona,
      nameEn: "The Worshiper",
      nameAr: "العابد",
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
      nameAr: "نصف ونصف",
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
      nameAr: "الغافل",
      descEn: "30% consistency",
      descAr: "٣٠٪ التزام",
      icon: Zap,
      gradient: "from-slate-500/20 to-slate-600/10",
      border: "border-slate-500/40",
      iconColor: "text-slate-400",
    },
  ];

  // Generate particles
  const particles = Array.from({ length: 20 }, () => ({
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 12,
    x: Math.random() * 100,
  }));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden" dir={isArabic ? "rtl" : "ltr"}>
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]" />
        
        {/* Floating particles */}
        {particles.map((p, i) => (
          <FloatingParticle key={i} {...p} />
        ))}
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Top Bar */}
      <header className="w-full px-6 py-5 flex items-center justify-between relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16 relative z-10">
        <div className="w-full max-w-sm">
          
          {/* Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight leading-tight">
              {isArabic ? (
                <>ابدأ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">رحلتك</span></>
              ) : (
                <>Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Journey</span></>
              )}
            </h1>
            <p className="text-white/40 text-lg leading-relaxed">
              {isArabic 
                ? "تتبع عباداتك • حسّن نفسك • اقترب من الله" 
                : "Track worship • Improve yourself • Get closer to Allah"}
            </p>
          </motion.div>

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
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                      <Mail className="text-blue-400" size={24} />
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
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
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
                        className={`w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-base ${isArabic ? 'text-right' : 'text-left'}`}
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
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
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
                  <div className="flex bg-white/[0.03] rounded-xl p-1 mb-6">
                    <button
                      onClick={() => setMode("signin")}
                      className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                        mode === "signin"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                          : "text-white/30 hover:text-white/50"
                      }`}
                    >
                      {isArabic ? "تسجيل الدخول" : "Sign In"}
                    </button>
                    <button
                      onClick={() => setMode("signup")}
                      className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                        mode === "signup"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
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
                      className={`w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-base ${isArabic ? 'text-right' : 'text-left'}`}
                      required
                      dir={isArabic ? "rtl" : "ltr"}
                    />
                    <input
                      type="password"
                      placeholder={isArabic ? "كلمة المرور" : "Password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-base ${isArabic ? 'text-right' : 'text-left'}`}
                      required
                      dir={isArabic ? "rtl" : "ltr"}
                    />

                    {mode === "signin" && (
                      <div className={isArabic ? "text-left" : "text-right"}>
                        <button
                          type="button"
                          onClick={switchToRecovery}
                          className="text-white/30 hover:text-blue-400 text-sm transition-colors"
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
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center relative z-10">
        <p className="text-white/15 text-xs font-medium tracking-wide">
          {isArabic ? "صُنع بـ 💙 للأمة" : "Built with 💙 for the Ummah"}
        </p>
      </footer>
    </div>
  );
};

export default Login;
