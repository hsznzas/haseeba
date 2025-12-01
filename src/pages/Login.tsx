import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, Loader2, Sparkles, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { DemoPersona } from "../services/storage";
import { motion, AnimatePresence } from "framer-motion";

type FormMode = "signin" | "signup" | "recovery";

const Login: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, startDemo, resetPasswordForEmail } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [mode, setMode] = useState<FormMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
        >
          <Globe size={16} />
          <span className="text-sm font-medium">
            {language === "en" ? "العربية" : "English"}
          </span>
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="text-emerald-400" size={32} />
              <h1 className="text-4xl font-bold text-white">Haseeb</h1>
            </div>
            <p className="text-emerald-200 text-sm">
              {language === "en"
                ? "Islamic Habit Tracker"
                : "متتبع العادات الإسلامية"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode === "recovery" ? (
              // Recovery Mode UI
              <motion.div
                key="recovery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Back Button */}
                <button
                  onClick={switchToLogin}
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-4"
                >
                  <ArrowLeft size={16} />
                  {language === "en" ? "Back to Login" : "العودة لتسجيل الدخول"}
                </button>

                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="text-emerald-400" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {language === "en" ? "Reset Password" : "إعادة تعيين كلمة المرور"}
                  </h2>
                  <p className="text-white/60 text-sm">
                    {language === "en"
                      ? "Enter your email to receive a reset link"
                      : "أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين"}
                  </p>
                </div>

                {recoverySuccess ? (
                  // Success Message
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-4"
                  >
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="text-emerald-400" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {language === "en" ? "Check Your Email!" : "تحقق من بريدك الإلكتروني!"}
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                      {language === "en"
                        ? `We've sent a password reset link to ${email}`
                        : `لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى ${email}`}
                    </p>
                    <button
                      onClick={switchToLogin}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                    >
                      {language === "en" ? "Return to Login" : "العودة لتسجيل الدخول"}
                    </button>
                  </motion.div>
                ) : (
                  // Recovery Form
                  <form onSubmit={handleRecovery} className="space-y-3">
                    <input
                      type="email"
                      placeholder={language === "en" ? "Email" : "البريد الإلكتروني"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />

                    {error && (
                      <div className="text-red-300 text-sm bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-2">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="animate-spin" size={16} />}
                      {language === "en" ? "Send Reset Link" : "إرسال رابط إعادة التعيين"}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              // Sign In / Sign Up Mode UI
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMode("signin")}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                      mode === "signin"
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {language === "en" ? "Sign In" : "تسجيل الدخول"}
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                      mode === "signup"
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {language === "en" ? "Sign Up" : "إنشاء حساب"}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    placeholder={language === "en" ? "Email" : "البريد الإلكتروني"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder={language === "en" ? "Password" : "كلمة المرور"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />

                  {/* Forgot Password Link */}
                  {mode === "signin" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={switchToRecovery}
                        className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                      >
                        {language === "en" ? "Forgot Password?" : "نسيت كلمة المرور؟"}
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="text-red-300 text-sm bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-2">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="animate-spin" size={16} />}
                    {mode === "signin"
                      ? language === "en"
                        ? "Sign In"
                        : "تسجيل الدخول"
                      : language === "en"
                      ? "Sign Up"
                      : "إنشاء حساب"}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/10 text-white/70">
                      {language === "en" ? "Or try demo" : "أو جرب العرض التوضيحي"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleDemo("beginner")}
                    className="w-full py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-100 rounded-xl font-medium transition-all"
                  >
                    {language === "en" ? "Demo: Beginner" : "تجريبي: مبتدئ"}
                  </button>
                  <button
                    onClick={() => handleDemo("intermediate")}
                    className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-100 rounded-xl font-medium transition-all"
                  >
                    {language === "en" ? "Demo: Intermediate" : "تجريبي: متوسط"}
                  </button>
                  <button
                    onClick={() => handleDemo("advanced")}
                    className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-100 rounded-xl font-medium transition-all"
                  >
                    {language === "en" ? "Demo: Advanced" : "تجريبي: متقدم"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-white/50 text-xs mt-4">
          {language === "en"
            ? "Built with 💚 for the Ummah"
            : "صُنع بـ 💚 للأمة"}
        </p>
      </div>
    </div>
  );
};

export default Login;
