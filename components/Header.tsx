
import React from 'react';
import { RotateCcw, Mountain, Gauge, Settings2 } from 'lucide-react';
import { GameStats } from '../types';
import { SeasonIcon, getSeasonName } from './UIComponents';

interface HeaderProps {
  year: number;
  currentTick: number;
  stats: GameStats;
  uiSpeed: number;
  showSettings: boolean;
  onToggleSettings: () => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
  settingsBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export const Header: React.FC<HeaderProps> = ({ 
    year, currentTick, stats, uiSpeed, showSettings, 
    onToggleSettings, onSpeedChange, onReset,
    settingsBtnRef 
}) => {
  
  // Helper to determine slider position (1, 2, 3) from delay (ms)
  // Fast (20ms) -> 3
  // Normal (150ms) -> 2
  // Slow (500ms) -> 1
  const getSliderValue = (ms: number) => {
      if (ms <= 50) return 3;
      if (ms >= 400) return 1;
      return 2;
  };

  return (
    <header className="mb-2 md:mb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2 xl:gap-4">
      <div className="flex flex-row items-baseline gap-3 md:gap-4">
        <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white whitespace-nowrap">
          Bio Sims
        </h1>
        <p className="text-slate-400 text-[10px] md:text-sm flex items-center gap-1 md:gap-2 truncate">
          <Mountain size={14} className="hidden md:block"/> Procedural Land, Species & Seasons
        </p>
      </div>
      
      <div className="flex flex-nowrap items-center justify-end gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full md:w-auto overflow-x-auto no-scrollbar">
        
        {/* Season Display */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-lg border border-slate-700 shrink-0 mr-auto md:mr-0">
           <SeasonIcon season={stats.season} />
           <span className="font-bold text-slate-200 text-xs hidden sm:inline">{getSeasonName(stats.season)}</span>
        </div>

        {/* Controls Group */}
        <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-2 border-r border-slate-700 mr-1 group">
            <Gauge size={16} className={`transition-colors ${uiSpeed <= 50 ? 'text-teal-400 animate-pulse' : 'text-slate-400'}`}/>
            
            {/* 3-Step Speed Slider: Slow (1) | Normal (2) | Fast (3) */}
            <input 
                type="range" 
                min="1" 
                max="3" 
                step="1" 
                value={getSliderValue(uiSpeed)}
                onChange={(e) => {
                    const step = Number(e.target.value);
                    let newDelay = 150; // Default (Normal)
                    
                    if (step === 1) newDelay = 500; // Slow
                    if (step === 3) newDelay = 20;  // Super Fast

                    onSpeedChange(newDelay);
                }} 
                className="w-24 md:w-20 accent-blue-500 cursor-pointer touch-none"
                title="Speed: Slow | Normal | Fast"
            />
            </div>

            <button 
                ref={settingsBtnRef}
                onClick={onToggleSettings} 
                className={`p-2 rounded transition-all ${showSettings ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <Settings2 size={18} />
            </button>
            <button onClick={onReset} className="p-2 rounded text-slate-400 hover:text-white transition-all"><RotateCcw size={18} /></button>
        </div>
        
        {/* Year / Day Display - Visible on Mobile now */}
        <div className="ml-1 md:ml-2 text-[10px] md:text-xs text-slate-400 font-mono pl-2 shrink-0 flex flex-col md:flex-row md:items-center md:gap-3 leading-tight justify-center border-l border-slate-700">
          <span className="whitespace-nowrap">Yr <span className="text-slate-200 font-bold">{year}</span></span>
          <span className="whitespace-nowrap">Day <span className="text-slate-200 font-bold">{currentTick}</span></span>
        </div>
      </div>
    </header>
  );
};
