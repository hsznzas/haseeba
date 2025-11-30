import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BarChart2, ArrowRightLeft } from "lucide-react";
import { clsx } from "clsx";

interface BottomNavProps {
  children?: React.ReactNode;
}

const BottomNav: React.FC<BottomNavProps> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getNavLink = () => {
    if (currentPath === "/" || currentPath === "/home") {
      return { to: "/analytics", Icon: BarChart2 };
    }
    return { to: "/", Icon: Home };
  };

  const { to, Icon } = getNavLink();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full bg-[#18181b]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl"
      style={{
        paddingBottom: "calc(var(--safe-area-bottom) + 16px)",
        height: "auto",
      }}
    >
      <div className="flex items-stretch h-20 max-w-md mx-auto w-full">
        <Link
          to={to}
          className={clsx(
            "w-32 shrink-0 flex flex-col items-center justify-center gap-0.5",
            "bg-slate-800 hover:bg-slate-700 active:scale-95",
            "transition-all duration-200 border-e border-white/10",
          )}
        >
          <div className="p-0 rounded-xl bg-primary/0 text-primary">
            <Icon size={22} strokeWidth={2} />
          </div>
          <ArrowRightLeft size={15} strokeWidth={3} className="text-white/50" />
        </Link>

        <div className="flex-1 overflow-hidden flex items-center px-2">
          {children}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
