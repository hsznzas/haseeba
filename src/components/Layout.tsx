import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePreferences } from '../App';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { preferences } = usePreferences();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = preferences.language;
  }, [preferences.language]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className={clsx(
      "h-screen text-foreground flex flex-col font-sans relative overflow-hidden bg-background",
      preferences.language === 'ar' && "font-arabic"
    )}>
      <div className="fixed top-[-20%] left-[20%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <main ref={mainRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-24">
        {children}
      </main>
    </div>
  );
};

export default Layout;