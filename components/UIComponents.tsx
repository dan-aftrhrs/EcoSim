
import React, { useState } from 'react';
import { Leaf, Bug, Rat, Swords, Crown, Zap, CloudRain, Sun, CloudSun, Snowflake, ScrollText, Heart } from 'lucide-react';
import { SpeciesType, Season, SPECIES_CONFIG, SPECIES_LORE, GameStats, SpeciesAttributes, SPECIES_LIST } from '../types';

// --- ICONS ---
export const SpeciesIcon = ({ type }: { type: SpeciesType }) => {
  const color = SPECIES_CONFIG[type].color;
  switch (type) {
    case SpeciesType.PLANT: return <Leaf size={16} color={color} fill={color} />;
    case SpeciesType.INSECT: return <Bug size={16} color={color} fill={color} />;
    case SpeciesType.HERBIVORE: return <Rat size={16} color={color} fill={color} />;
    case SpeciesType.PREDATOR: return <Swords size={16} color={color} fill={color} />;
    case SpeciesType.APEX: return <Crown size={16} color={color} fill={color} />;
    case SpeciesType.ALIEN: return <Zap size={16} color={color} fill={color} />;
    default: return null;
  }
};

export const SeasonIcon = ({ season }: { season: Season }) => {
  switch (season) {
    case Season.SPRING: return <CloudRain className="text-green-400" size={24} />;
    case Season.SUMMER: return <Sun className="text-yellow-400" size={24} />;
    case Season.AUTUMN: return <CloudSun className="text-orange-400" size={24} />;
    case Season.WINTER: return <Snowflake className="text-blue-300" size={24} />;
  }
};

export const getSeasonName = (season: Season) => {
  switch (season) {
    case Season.SPRING: return "Spring";
    case Season.SUMMER: return "Summer";
    case Season.AUTUMN: return "Autumn";
    case Season.WINTER: return "Winter";
  }
};

// --- STAT CARD ---
interface StatCardProps {
  stats: GameStats;
  maxPop: number;
  setHighlight: (t: SpeciesType | null) => void;
  alienDeployed: boolean;
  deployMode: boolean;
  toggleDeployMode: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ stats, maxPop, setHighlight, alienDeployed, deployMode, toggleDeployMode }) => {
  return (
    <div className="w-full">
        {/* Grid layout: 3 columns on mobile, 6 on desktop. No scrolling needed. */}
        <div className="grid grid-cols-3 gap-1 md:gap-4 md:grid-cols-6">
        {SPECIES_LIST.map((t: SpeciesType) => {
            const count = stats.population[t];
            const percent = maxPop > 0 ? (count / maxPop) * 100 : 0;
            
            if (t === SpeciesType.ALIEN) {
                return (
                    <div 
                        key={t} 
                        className={`p-1 md:p-2 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden group transition-all cursor-pointer h-14 md:h-auto
                            ${deployMode ? 'bg-teal-900/30 border-teal-400 animate-pulse' : 'bg-slate-800 border-slate-700 hover:border-teal-400/50'}
                        `}
                        onClick={() => !alienDeployed && toggleDeployMode()}
                        onMouseEnter={() => setHighlight(t)}
                        onMouseLeave={() => setHighlight(null)}
                    >
                        <div className="flex items-center gap-1 mb-0.5 md:mb-1 font-bold text-[9px] md:text-sm text-slate-300">
                            <SpeciesIcon type={t} />
                            <span className="truncate">{SPECIES_CONFIG[t].name}</span>
                        </div>
                        
                        {alienDeployed ? (
                            <div className="text-[10px] md:text-xl font-mono text-teal-400 font-bold">ACTIVE</div>
                        ) : (
                            <div className={`text-[9px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap transition-colors ${deployMode ? 'bg-teal-400 text-teal-950' : 'bg-slate-700 text-slate-400'}`}>
                                {deployMode ? 'PLACE' : 'DEPLOY'}
                            </div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 w-full h-0.5 md:h-1 bg-slate-900">
                             {alienDeployed && <div className="h-full bg-teal-400 w-full shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>}
                        </div>
                    </div>
                );
            }

            return (
            <div 
                key={t} 
                className="bg-slate-800 p-1 md:p-2 rounded-lg border border-slate-700 flex flex-col items-center relative overflow-hidden group hover:border-slate-500 transition-colors cursor-pointer h-14 md:h-auto"
                onMouseEnter={() => setHighlight(t)}
                onMouseLeave={() => setHighlight(null)}
            >
                {count < 10 && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"></div>}
                <div className="flex items-center gap-1 mb-0.5 md:mb-1 font-bold text-[9px] md:text-sm text-slate-300 w-full justify-center">
                    <SpeciesIcon type={t} />
                    <span className="truncate">{SPECIES_CONFIG[t].name}</span>
                </div>
                <div className={`text-xs md:text-xl font-mono font-bold ${count < 10 ? 'text-red-400' : 'text-white'}`}>{count}</div>
                <div className="w-full bg-slate-900 h-0.5 md:h-1 mt-auto rounded-full overflow-hidden">
                    <div 
                        className="h-full transition-all duration-300" 
                        style={{ width: `${Math.min(percent * 5, 100)}%`, backgroundColor: SPECIES_CONFIG[t].color }} 
                    />
                </div>
            </div>
            )
        })}
        </div>
    </div>
  )
}

// --- REUSABLE DETAILS CONTENT ---
export const SpeciesDetails: React.FC<{ type: SpeciesType, config: SpeciesAttributes }> = ({ type, config }) => {
  const lore = SPECIES_LORE[type];
  
  return (
    <div className="text-xs text-slate-400 space-y-2 animate-in slide-in-from-top-1">
       <div className="pt-1">
          <strong className="text-slate-300 flex items-center gap-1 mb-0.5 text-[10px] md:text-xs"><ScrollText size={10}/> Traits</strong>
          <p className="leading-tight text-[10px] md:text-xs text-slate-400">{lore.special}</p>
       </div>
       
       <div>
          <strong className="text-slate-300 flex items-center gap-1 mb-0.5 text-[10px] md:text-xs"><Heart size={10}/> Diet</strong>
          <p className="leading-tight text-[10px] md:text-xs text-slate-400">{lore.diet}</p>
       </div>
    </div>
  );
};

// --- SPECIES PROFILE (Desktop Accordion) ---
export const SpeciesProfile: React.FC<{ type: SpeciesType, config: SpeciesAttributes, setHighlight: (t: SpeciesType | null) => void }> = ({ type, config, setHighlight }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden transition-all hover:border-slate-600"
      onMouseEnter={() => setExpanded(true)} 
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded(!expanded)}
    >
      <div 
        className="w-full flex items-center justify-between p-3 text-left cursor-pointer"
        onMouseEnter={() => setHighlight(type)}
        onMouseLeave={() => setHighlight(null)}
      >
        <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
          <SpeciesIcon type={type} /> 
          <span style={{ color: SPECIES_CONFIG[type].color }}>{SPECIES_CONFIG[type].name}</span>
        </div>
        <div className="text-[10px] text-slate-500">{expanded ? '▼' : '▶'}</div>
      </div>
      
      {expanded && (
        <div className="p-3 pt-0 border-t border-slate-700/50">
           <SpeciesDetails type={type} config={config} />
        </div>
      )}
    </div>
  );
};
