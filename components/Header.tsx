import React from 'react';
import { Play, Pause, RotateCcw, Mountain, Gauge, Settings2 } from 'lucide-react';
import { GameStats } from '../types';
import { SeasonIcon, getSeasonName } from './UIComponents';

interface HeaderProps {
  year: number;
  currentTick: number;
  stats: GameStats;
  uiSpeed: number;
  runningState: boolean;
  isGameOver: boolean;
  showSettings: boolean;
  onToggleSettings: () => void;
  onSpeedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  playBtnRef?: React.RefObject<HTMLButtonElement | null>;
  settingsBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export const Header: React.FC<HeaderProps> = ({ 
    year, currentTick, stats, uiSpeed, runningState, isGameOver, showSettings, 
    onToggleSettings, onSpeedChange, onTogglePlay, onReset,
    playBtnRef, settingsBtnRef 
}) => {
  return (
    <header className="mb-2 md:mb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2 xl:gap-4">
      <div className="flex flex-row items-baseline gap-3 md:gap-4">
        <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white whitespace-nowrap">
          Bio Sims
        </h1>
        <p className="text-slate-400 text-[10px] md:text-sm flex items-center gap-1 md:gap-2 truncate">
          <Mountain size={14} className="hidden md:block"/> Procedural Continents & Seasons
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
            <div className="flex items-center gap-2 px-2 border-r border-slate-700 mr-1">
            <Gauge size={16} className="text-slate-400 block"/>
            <input type="range" min="20" max="1000" step="10" value={uiSpeed} onChange={onSpeedChange} className="w-16 md:w-24 accent-blue-500" />
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
        <div className="ml-1 md:ml-2 text-[10px] md:text-xs text-slate-400 font-mono pl-2 border-l border-slate-700 shrink-0 flex flex-col md:flex-row md:items-center md:gap-3 leading-tight justify-center">
          <span className="whitespace-nowrap">Yr <span className="text-slate-200 font-bold">{year}</span></span>
          <span className="whitespace-nowrap">Day <span className="text-slate-200 font-bold">{currentTick}</span></span>
        </div>

        {/* Play Button - Far Right */}
        <button 
            ref={playBtnRef}
            onClick={onTogglePlay} 
            disabled={isGameOver} 
            className={`p-2 md:p-2 rounded-lg transition-all flex items-center justify-center shadow-lg shrink-0 ml-1 ${
                runningState 
                ? 'bg-red-500 text-white border-red-600' 
                : 'bg-green-500 text-white border-green-600 animate-pulse'
            } ${isGameOver ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {runningState ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} />}
        </button>
      </div>
    </header>
  );
};