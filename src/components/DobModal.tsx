import React, { useState } from 'react';
import { usePreferences } from '../App';
import { TRANSLATIONS } from '../../constants';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DobModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { preferences, setPreferences } = usePreferences();
  const t = TRANSLATIONS[preferences.language];
  
  const [dob, setDob] = useState(preferences.dateOfBirth || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) return;
    
    setPreferences({
        ...preferences,
        dateOfBirth: dob
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">{t.dobTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X />
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-6">
            {t.dobDesc}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="date" 
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none [color-scheme:dark]"
              required
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800 text-gray-300 font-medium">
              {t.cancel}
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold">
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DobModal;