import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import hadithDB from '../data/hadiths.json';
import { Hadith } from '../utils/hadithRotator';

const HadithDisplay: React.FC = () => {
  const [hadith, setHadith] = useState<Hadith | null>(null);

  useEffect(() => {
    // Collect all hadiths from all categories
    const allHadiths: Hadith[] = [];
    const categories = Object.keys(hadithDB) as Array<keyof typeof hadithDB>;
    
    categories.forEach((category) => {
      const categoryHadiths = hadithDB[category] as Hadith[];
      if (Array.isArray(categoryHadiths)) {
        allHadiths.push(...categoryHadiths);
      }
    });

    // Pick a random hadith
    if (allHadiths.length > 0) {
      const randomIndex = Math.floor(Math.random() * allHadiths.length);
      const selectedHadith = allHadiths[randomIndex];
      if (selectedHadith) {
        setHadith(selectedHadith);
      }
    }
  }, []);

  if (!hadith) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="py-8 px-6 text-center"
    >
      {/* Hadith Text */}
      <p 
        className="font-arabic text-lg leading-relaxed text-slate-700 dark:text-slate-200 max-w-2xl mx-auto"
        dir="rtl"
      >
        {hadith.text}
      </p>
      
      {/* Source Attribution */}
      <p className="mt-4 text-sm text-slate-400 dark:text-slate-500 font-light tracking-wide">
        — {hadith.source}
      </p>
    </motion.div>
  );
};

export default HadithDisplay;
