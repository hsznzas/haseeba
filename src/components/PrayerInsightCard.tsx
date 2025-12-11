import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw, Loader2, Lightbulb, TrendingUp } from 'lucide-react';
import { HabitLog } from '../../types';
import { generatePrayerInsight, getCachedPrayerInsight, PrayerInsight } from '../services/aiEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface PrayerInsightCardProps {
  prayerId: string;
  prayerName: string;
  logs: HabitLog[];
  language: 'en' | 'ar';
}

const PrayerInsightCard: React.FC<PrayerInsightCardProps> = ({
  prayerId,
  prayerName,
  logs,
  language
}) => {
  const [insight, setInsight] = useState<PrayerInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isArabic = language === 'ar';

  useEffect(() => {
    // Load cached insight on mount
    const cached = getCachedPrayerInsight(prayerId);
    if (cached) {
      setInsight(cached);
    }
  }, [prayerId]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const newInsight = await generatePrayerInsight(prayerId, prayerName, logs, language);
      setInsight(newInsight);
    } catch (error) {
      console.error('Error generating insight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-950/80 to-slate-900/90 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden shadow-lg shadow-blue-500/5">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-blue-500/20 bg-blue-500/10">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-blue-400" />
          <span className="text-sm font-bold text-blue-300">
            {isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <RefreshCw size={10} />
          )}
          {isArabic ? 'توليد' : 'Generate'}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-400" />
              <p className="text-xs text-gray-400">
                {isArabic ? 'جاري التحليل...' : 'Analyzing...'}
              </p>
            </div>
          </motion.div>
        ) : insight ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 space-y-4"
          >
            {/* Patterns */}
            {insight.patterns.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-purple-400" />
                  <h4 className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">
                    {isArabic ? 'الأنماط المكتشفة' : 'Patterns Discovered'}
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {insight.patterns.map((pattern, idx) => (
                    <li key={idx} className="text-xs text-white/80 flex items-start gap-2">
                      <span className="text-purple-400 shrink-0">•</span>
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advice */}
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb size={12} className="text-yellow-400" />
                <h4 className="text-[10px] text-yellow-400 uppercase tracking-wider font-semibold">
                  {isArabic ? 'نصيحة' : 'Advice'}
                </h4>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">{insight.advice}</p>
            </div>

            {/* Encouragement */}
            <div className="text-center pt-2 border-t border-blue-500/20">
              <p className="text-xs text-blue-300/80 italic">{insight.encouragement}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 text-center"
          >
            <Brain size={32} className="text-blue-400/30 mx-auto mb-2" />
            <p className="text-sm text-white/70 mb-3">
              {isArabic 
                ? 'اضغط على "توليد" للحصول على رؤى مخصصة'
                : 'Click "Generate" to get personalized insights'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrayerInsightCard;
