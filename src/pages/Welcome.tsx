import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import party from "party-js";

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
        party.confetti(document.body, {
            count: 60,
            spread: 50,
            size: 1.5
        });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative z-10 max-w-md w-full"
      >
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <CheckCircle2 className="text-emerald-400 w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Account Verified</h1>
        <p className="text-white/40 mb-8 text-lg">
          Bismillah. Your journey of accountability begins now.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/")} 
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
        >
          <span>Start Your Journey</span>
          <ArrowRight size={18} />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Welcome;
