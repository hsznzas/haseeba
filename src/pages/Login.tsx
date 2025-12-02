import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, ArrowLeft, Mail, CheckCircle2, Sparkles, Users, Zap } from "lucide-react";
import { DemoPersona } from "../services/storage";
import { motion, AnimatePresence } from "framer-motion";

type FormMode = "signin" | "signup" | "recovery";

// Animated Hourglass with Flames component
const AnimatedHourglass: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <motion.div
    className="relative inline-flex items-center justify-center"
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-emerald-500">
      <path 
        d="M6 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4V2z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="rgba(16, 185, 129, 0.2)"
      />
      {/* Sand particles */}
      <motion.circle
        cx="12"
        cy="8"
        r="1"
        fill="currentColor"
        animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </svg>
    {/* Flame effects */}
    <motion.div
      className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full blur-[2px]"
      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 0.5, repeat: Infinity }}
    />
    <motion.div
      className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-orange-400 rounded-full blur-[1px]"
      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
      transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
    />
  </motion.div>
);

const Login: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, startDemo, resetPasswordForEmail } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("en");
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

  // Persona configs with new relatable names
  const personas = [
    {
      id: "devout" as DemoPersona,
      nameEn: "The Worshiper",
      nameAr: "العابد",
      descEn: "95% success rate",
      descAr: "نسبة نجاح ٩٥٪",
      icon: Sparkles,
      gradient: "from-emerald-500/20 to-emerald-600/20",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
    },
    {
      id: "intermediate" as DemoPersona,
      nameEn: "Half & Half",
      nameAr: "نصف ونصف",
      descEn: "75% success rate",
      descAr: "نسبة نجاح ٧٥٪",
      icon: Users,
      gradient: "from-amber-500/20 to-orange-500/20",
      border: "border-amber-500/30",
      text: "text-amber-400",
    },
    {
      id: "beginner" as DemoPersona,
      nameEn: "The Careless",
      nameAr: "الغافل",
      descEn: "30% success rate",
      descAr: "نسبة نجاح ٣٠٪",
      icon: Zap,
      gradient: "from-slate-500/20 to-slate-600/20",
      border: "border-slate-500/30",
      text: "text-slate-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" dir={isArabic ? "rtl" : "ltr"}>
      {/* Top Bar - Clean Apple style */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={24} />
          <span className="text-white font-semibold text-lg">Haseeb</span>
        </div>
        <button
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="flex items-center gap-2 px-3 py-1.5 text-white/60 hover:text-white transition-colors text-sm"
        >
          <Globe size={16} />
          {language === "en" ? "العربية" : "English"}
        </button>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">
          
          {/* Hero Section */}
          <div className={`text-center mb-10 ${isArabic ? 'text-right' : 'text-left'}`} style={{ textAlign: 'center' }}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white mb-3 tracking-tight"
            >
              {isArabic ? "ابدأ رحلتك" : "Start Your Journey"}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/50 text-base"
            >
              {isArabic 
                ? "تتبع عباداتك. حسّن نفسك. اقترب من الله." 
                : "Track your worship. Improve yourself. Get closer to Allah."}
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {mode === "recovery" ? (
              /* Recovery Mode */
              <motion.div
                key="recovery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <button
                  onClick={switchToLogin}
                  className={`flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm ${isArabic ? 'flex-row-reverse' : ''}`}
                >
                  <ArrowLeft size={16} className={isArabic ? 'rotate-180' : ''} />
                  {isArabic ? "العودة لتسجيل الدخول" : "Back to Login"}
                </button>

                <div className="text-center">
                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Mail className="text-emerald-500" size={24} />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {isArabic ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                  </h2>
                  <p className="text-white/40 text-sm">
                    {isArabic
                      ? "أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين"
                      : "Enter your email to receive a reset link"}
                  </p>
                </div>

                {recoverySuccess ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-6"
                  >
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="text-emerald-500" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {isArabic ? "تحقق من بريدك!" : "Check Your Email!"}
                    </h3>
                    <p className="text-white/40 text-sm mb-4">
                      {isArabic
                        ? `أرسلنا رابط إعادة التعيين إلى ${email}`
                        : `We've sent a reset link to ${email}`}
                    </p>
                    <button
                      onClick={switchToLogin}
                      className="text-emerald-500 hover:text-emerald-400 text-sm font-medium"
                    >
                      {isArabic ? "العودة لتسجيل الدخول" : "Return to Login"}
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRecovery} className="space-y-4">
                    <input
                      type="email"
                      placeholder={isArabic ? "البريد الإلكتروني" : "Email"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all ${isArabic ? 'text-right' : 'text-left'}`}
                      required
                      dir={isArabic ? "rtl" : "ltr"}
                    />
                    {error && (
                      <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <AnimatedHourglass size={18} />}
                      {isArabic ? "إرسال رابط التعيين" : "Send Reset Link"}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              /* Sign In / Sign Up Mode */
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Tab Switcher */}
                <div className="flex bg-white/5 rounded-xl p-1">
                  <button
                    onClick={() => setMode("signin")}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      mode === "signin"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {isArabic ? "تسجيل الدخول" : "Sign In"}
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      mode === "signup"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {isArabic ? "إنشاء حساب" : "Sign Up"}
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    placeholder={isArabic ? "البريد الإلكتروني" : "Email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all ${isArabic ? 'text-right' : 'text-left'}`}
                    required
                    dir={isArabic ? "rtl" : "ltr"}
                  />
                  <input
                    type="password"
                    placeholder={isArabic ? "كلمة المرور" : "Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all ${isArabic ? 'text-right' : 'text-left'}`}
                    required
                    dir={isArabic ? "rtl" : "ltr"}
                  />

                  {mode === "signin" && (
                    <div className={isArabic ? "text-left" : "text-right"}>
                      <button
                        type="button"
                        onClick={switchToRecovery}
                        className="text-white/40 hover:text-white/60 text-sm transition-colors"
                      >
                        {isArabic ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <AnimatedHourglass size={18} />}
                    {mode === "signin"
                      ? isArabic ? "تسجيل الدخول" : "Sign In"
                      : isArabic ? "إنشاء حساب" : "Sign Up"}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-slate-950 text-white/30 text-xs uppercase tracking-wider">
                      {isArabic ? "أو جرب التطبيق" : "Or try the app"}
                    </span>
                  </div>
                </div>

                {/* Demo Personas */}
                <div className="space-y-2">
                  {personas.map((persona) => {
                    const Icon = persona.icon;
                    return (
                      <motion.button
                        key={persona.id}
                        onClick={() => handleDemo(persona.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full py-3 px-4 bg-gradient-to-r ${persona.gradient} border ${persona.border} rounded-xl transition-all flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${persona.text}`}>
                          <Icon size={18} />
                        </div>
                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                          <div className={`font-medium text-white text-sm`}>
                            {isArabic ? persona.nameAr : persona.nameEn}
                          </div>
                          <div className="text-white/40 text-xs">
                            {isArabic ? persona.descAr : persona.descEn}
                          </div>
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
      <footer className="py-6 text-center">
        <p className="text-white/20 text-xs">
          {isArabic ? "صُنع بـ 💚 للأمة" : "Built with 💚 for the Ummah"}
        </p>
      </footer>
    </div>
  );
};

export default Login;
