
import React, { useState } from 'react';
import { SpeciesType, GameConfig, SpawnSettings, SPECIES_LIST, SPECIES_CONFIG } from '../types';

interface SettingsPanelProps {
    spawnConfig: SpawnSettings;
    gameConfig: GameConfig;
    onConfigChange: (field: keyof GameConfig, val: any) => void;
    onSpawnChange: (type: SpeciesType, val: number) => void;
    onSpeciesAttributeChange: (species: SpeciesType, field: string, val: number) => void;
    onApply: () => void;
    isOverLimit: boolean;
    totalSpawnPercent: number;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ spawnConfig, gameConfig, onConfigChange, onSpawnChange, onSpeciesAttributeChange, onApply, isOverLimit, totalSpawnPercent }) => {
    const [activeTab, setActiveTab] = useState<'global' | 'world' | 'species'>('global');
    const [selectedSpecies, setSelectedSpecies] = useState<SpeciesType>(SpeciesType.INSECT);

    return (
        <div className="w-full mb-6 bg-slate-800 rounded-xl border border-slate-600 shadow-2xl animate-in fade-in slide-in-from-top-4 overflow-hidden">
             <div className="flex border-b border-slate-700">
                <button onClick={() => setActiveTab('global')} className={`px-6 py-3 font-bold ${activeTab === 'global' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Global Rules</button>
                <button onClick={() => setActiveTab('world')} className={`px-6 py-3 font-bold ${activeTab === 'world' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>World Gen</button>
                <button onClick={() => setActiveTab('species')} className={`px-6 py-3 font-bold ${activeTab === 'species' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Species Editor</button>
             </div>
             <div className="p-4 md:p-6">
                {activeTab === 'global' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-sm font-bold text-slate-300 mb-1 block">Season Duration</label>
                          <input type="range" min="50" max="1000" step="50" value={gameConfig.seasonDuration} onChange={(e) => onConfigChange('seasonDuration', Number(e.target.value))} className="w-full accent-blue-500" />
                          <div className="text-right text-xs font-mono text-slate-400">{gameConfig.seasonDuration}</div>
                       </div>
                       <div className="flex items-center gap-3">
                          <input type="checkbox" checked={gameConfig.enableAutoRescue} onChange={(e) => onConfigChange('enableAutoRescue', e.target.checked)} className="w-5 h-5 rounded border-slate-600 bg-slate-700 accent-blue-500" />
                          <label className="text-sm font-bold text-slate-300">Enable Auto-Rescue</label>
                       </div>
                    </div>
                )}
                {activeTab === 'world' && (
                    <div className="space-y-4">
                       <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-bold text-slate-300">Population Density</h3>
                          <span className={`text-xs font-mono px-2 py-1 rounded ${isOverLimit ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>Total: {totalSpawnPercent.toFixed(0)}%</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {SPECIES_LIST.map(t => {
                             if(t === SpeciesType.ALIEN) return null;
                             return (
                               <div key={t}>
                                  <div className="flex justify-between text-xs mb-1">
                                     <span style={{ color: SPECIES_CONFIG[t].color }}>{SPECIES_CONFIG[t].name}</span>
                                     <span className="font-mono text-slate-400">{spawnConfig[t]}%</span>
                                  </div>
                                  <input type="range" min="0" max="50" value={spawnConfig[t]} onChange={(e) => onSpawnChange(t, Number(e.target.value))} className="w-full accent-slate-500" />
                               </div>
                             )
                          })}
                       </div>
                    </div>
                )}
                {activeTab === 'species' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-300">Select Species:</label>
                            <select value={selectedSpecies} onChange={(e) => setSelectedSpecies(Number(e.target.value) as SpeciesType)} className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600">
                            {SPECIES_LIST.map(t => (t !== SpeciesType.ALIEN && <option key={t} value={t}>{SPECIES_CONFIG[t].name}</option>))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                             <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">Max HP / Energy</label>
                                <input type="range" min="5" max="200" step="5" value={gameConfig.species[selectedSpecies].maxHp} onChange={(e) => onSpeciesAttributeChange(selectedSpecies, 'maxHp', Number(e.target.value))} className="w-full accent-blue-500" />
                                <div className="text-right text-xs font-mono text-slate-500 mt-1">{gameConfig.species[selectedSpecies].maxHp}</div>
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">Lifespan (Years)</label>
                                <input type="range" min="0.5" max="50" step="0.5" value={gameConfig.species[selectedSpecies].maxAge} onChange={(e) => onSpeciesAttributeChange(selectedSpecies, 'maxAge', Number(e.target.value))} className="w-full accent-blue-500" />
                                <div className="text-right text-xs font-mono text-slate-500 mt-1">{gameConfig.species[selectedSpecies].maxAge} yrs</div>
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">Repro Cost</label>
                                <input type="range" min="0" max="100" value={gameConfig.species[selectedSpecies].reproCost} onChange={(e) => onSpeciesAttributeChange(selectedSpecies, 'reproCost', Number(e.target.value))} className="w-full accent-blue-500" />
                                <div className="text-right text-xs font-mono text-slate-500 mt-1">{gameConfig.species[selectedSpecies].reproCost}</div>
                             </div>
                        </div>
                    </div>
                )}
                <div className="mt-6 flex justify-end">
                    <button onClick={onApply} disabled={isOverLimit} className={`px-6 py-2 rounded font-bold transition-colors ${isOverLimit ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                        {isOverLimit ? 'Invalid Configuration' : 'Apply & Restart'}
                    </button>
                </div>
             </div>
          </div>
    )
}
