
import React, { useState } from 'react';
import { Info, Radio } from 'lucide-react';
import { SPECIES_LIST, GameConfig, SpeciesType, SPECIES_CONFIG, NewsItem, NewsType } from '../types';
import { SpeciesProfile, SpeciesIcon, SpeciesDetails } from './UIComponents';

interface InfoPanelProps {
    currentConfig: GameConfig;
    setHighlightSpecies: (t: SpeciesType | null) => void;
    newsFeed?: NewsItem[];
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ currentConfig, setHighlightSpecies, newsFeed }) => {
    const [selectedMobileSpecies, setSelectedMobileSpecies] = useState<SpeciesType>(SpeciesType.PLANT);
    const logs = newsFeed || [];

    const getNewsColor = (type: NewsType) => {
        switch(type) {
            case 'restore': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'; // Green: Restore
            case 'extinction': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'; // Red: Near Extinction
            case 'overpop': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'; // Orange: Overpopulation
            case 'cull': return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'; // Purple: Culling
            case 'tip': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'; // Blue: Tips
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="flex flex-row lg:flex-col gap-2 lg:gap-4 h-64 lg:h-full w-full print:hidden">
            {/* SPECIES INTEL SECTION */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col overflow-hidden w-1/2 lg:w-full flex-1">
                 <div className="p-2 lg:p-3 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
                    <h3 className="text-xs md:text-sm font-bold flex items-center gap-2 text-slate-100">
                        <Info size={14} className="text-blue-400" /> <span className="hidden md:inline">Species</span> Intel
                    </h3>
                 </div>
                 
                 {/* MOBILE VIEW: Selectable Icons + Detail View */}
                 <div className="flex flex-col h-full lg:hidden overflow-hidden">
                    {/* Icon Selection Strip */}
                    <div className="flex overflow-x-auto p-1 bg-slate-900/50 border-b border-slate-700 gap-1 no-scrollbar shrink-0">
                        {SPECIES_LIST.map(type => (
                            <button
                                key={type}
                                onClick={() => { setSelectedMobileSpecies(type); setHighlightSpecies(type); }}
                                className={`p-1.5 rounded flex items-center justify-center transition-colors ${selectedMobileSpecies === type ? 'bg-slate-700 ring-1 ring-blue-500' : 'hover:bg-slate-800'}`}
                            >
                                <SpeciesIcon type={type} />
                            </button>
                        ))}
                    </div>
                    {/* Detail View for Selected */}
                    <div className="p-2 overflow-y-auto custom-scrollbar flex-1 bg-slate-900/20">
                         <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-bold" style={{ color: SPECIES_CONFIG[selectedMobileSpecies].color }}>
                                 {SPECIES_CONFIG[selectedMobileSpecies].name}
                             </span>
                         </div>
                         <SpeciesDetails type={selectedMobileSpecies} config={currentConfig.species[selectedMobileSpecies]} />
                    </div>
                 </div>

                 {/* DESKTOP VIEW: Vertical Accordion List */}
                 <div className="hidden lg:block overflow-y-auto custom-scrollbar p-2 space-y-2 flex-1">
                     {SPECIES_LIST.map(type => (
                       <SpeciesProfile key={type} type={type} config={currentConfig.species[type]} setHighlight={setHighlightSpecies} />
                     ))}
                 </div>
            </div>

            {/* NEWS FEED SECTION */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col overflow-hidden w-1/2 lg:w-full lg:flex-none lg:h-auto lg:max-h-[40%]">
                <div className="p-2 lg:p-3 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
                    <h3 className="text-xs md:text-sm font-bold flex items-center gap-2 text-white truncate">
                        <Radio size={14} className="text-red-400 animate-pulse" /> News Feed
                    </h3>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-2 flex-1 bg-slate-900/30">
                    {logs.length > 0 ? (
                        <div className="space-y-1 font-mono text-[9px] md:text-xs">
                           {logs.map((log) => (
                              <div key={log.id} className="text-slate-300 border-b border-slate-800/50 pb-1 mb-1 last:mb-0 last:border-0 last:pb-0 break-words leading-tight flex items-start gap-2">
                                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${getNewsColor(log.type)}`}></div>
                                  <span className={log.type === 'tip' ? 'text-blue-300 italic' : ''}>{log.text}</span>
                              </div>
                           ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[10px] md:text-xs text-center p-2 italic">
                            <Radio size={16} className="mb-1 opacity-20"/>
                            Awaiting events...
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
