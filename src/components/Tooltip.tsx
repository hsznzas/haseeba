import React from 'react';
import { Info } from 'lucide-react';

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative flex items-center">
    <Info size={12} className="text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-xs text-white text-center rounded-lg border border-slate-700 shadow-xl z-50">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  </div>
);

export default Tooltip;
