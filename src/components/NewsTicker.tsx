import React, { useEffect, useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { LATEST_UPDATE } from '../../constants';

const NewsTicker: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !textRef.current) return;
      setShouldScroll(textRef.current.scrollWidth > containerRef.current.clientWidth);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  return (
    <div className="px-4">
      <div className="bg-slate-900/50 backdrop-blur-sm border-y border-white/5 rounded-lg">
        <div className="flex items-center gap-2 px-3 py-2">
          <Megaphone size={14} className="text-emerald-400 shrink-0" />
          <div ref={containerRef} className="flex-1 overflow-hidden">
            <div
              ref={textRef}
              className="whitespace-nowrap text-xs font-mono text-emerald-400 pr-6"
              style={{
                animation: shouldScroll
                  ? 'news-marquee 18s linear infinite'
                  : 'news-fade 0.6s ease-out',
              }}
            >
              {LATEST_UPDATE}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes news-marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes news-fade {
          0% { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
