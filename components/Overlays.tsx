
import React, { useState, useEffect } from 'react';
import { Mountain, Zap, Skull, RotateCcw, FileText, AlertTriangle, Clock, Activity, ArrowRight, ChevronRight, ChevronLeft, Leaf, Bug, Swords, Crown, Snowflake, Trophy, Save, Globe, Smartphone } from 'lucide-react';
import { SPECIES_CONFIG } from '../types';
import { supabase, fetchGlobalScores, submitGlobalScore, HighScoreEntry } from '../services/supabaseClient';

const ONBOARDING_STEPS = [
  {
    title: "Welcome to Bio Sims",
    icon: <Mountain size={48} className="text-blue-400" />,
    content: (
      <div className="text-center space-y-4">
        <p className="text-lg text-slate-300">
          You are about to enter a living, breathing ecosystem on your palm.
        </p>
        <p className="text-sm text-slate-400">
          Watch as life struggles to survive across distinct continents, seasonal cycles, and a dynamic food chain.
        </p>
      </div>
    )
  },
  {
    title: "The Circle of Life",
    icon: <Leaf size={48} className="text-green-400" />,
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
           <div className="bg-slate-900/50 p-3 rounded border border-slate-700 flex items-center gap-2">
             <Leaf size={16} className="text-green-400"/> <span>Flora grows from sun</span>
           </div>
           <div className="bg-slate-900/50 p-3 rounded border border-slate-700 flex items-center gap-2">
             <Bug size={16} className="text-yellow-400"/> <span>Swarmers scavenge</span>
           </div>
           <div className="bg-slate-900/50 p-3 rounded border border-slate-700 flex items-center gap-2">
             <Swords size={16} className="text-red-400"/> <span>Hunters hunt prey</span>
           </div>
           <div className="bg-slate-900/50 p-3 rounded border border-slate-700 flex items-center gap-2">
             <Crown size={16} className="text-purple-400"/> <span>Apexes rule the top</span>
           </div>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">Every species has unique behaviors, metabolisms, and lifespans.</p>
      </div>
    )
  },
  {
    title: "Seasons Change",
    icon: <Snowflake size={48} className="text-cyan-300" />,
    content: (
      <div className="text-center space-y-4">
        <p className="text-slate-300">
          The world shifts through Spring, Summer, Autumn, and Winter in 200 days.
        </p>
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-sm text-blue-200">
          <strong>Winter is Dangerous... but Useful.</strong>
          <br/>
          Shallow waters freeze into <span className="text-white font-bold">Ice Bridges</span>, when animals migrate between islands.
        </div>
      </div>
    )
  },
  {
    title: "The Eternal Balancer",
    icon: <Zap size={48} className="text-teal-400" />,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-slate-300">
          You are a watcher, but you have one intervention tool.
        </p>
        <div className="bg-slate-800 border border-slate-600 p-4 rounded-lg text-left">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Zap size={16} className="text-teal-400"/>The Balancer</h4>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                <li>Deployed <strong>once</strong> per simulation.</li>
                <li><strong>Culls</strong> overpopulated species.</li>
                <li><strong>Multiplies</strong> endangered species.</li>
                <li><strong>Resurrects</strong> corpses into plants.</li>
            </ul>
        </div>
      </div>
    )
  },
  {
    title: "Your Mission",
    icon: <Activity size={48} className="text-red-400" />,
    content: (
      <div className="text-center space-y-6">
        <h3 className="text-2xl font-black text-white">PREVENT EXTINCTION</h3>
        <p className="text-slate-400">
          If any species dies out completely, the simulation ends. 
          <br/>
          Use the Balancer wisely.
        </p>
        <p className="text-xs text-slate-500 font-mono">Good Luck, Watcher.</p>
      </div>
    )
  }
];

export const LandingPage = ({ onStart }: { onStart: () => void }) => {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < ONBOARDING_STEPS.length - 1) setStep(step + 1);
    else onStart();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
        
        <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
            <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${((step + 1) / ONBOARDING_STEPS.length) * 100}%` }}
            ></div>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in slide-in-from-right-4 duration-300" key={step}>
            <div className="mb-6 p-4 bg-slate-800 rounded-full shadow-lg ring-1 ring-slate-700">
                {ONBOARDING_STEPS[step].icon}
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">{ONBOARDING_STEPS[step].title}</h2>
            <div className="w-full">
                {ONBOARDING_STEPS[step].content}
            </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
            <button 
                onClick={prevStep} 
                disabled={step === 0}
                className={`p-2 rounded-full transition-colors ${step === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <ChevronLeft size={24} />
            </button>

            <div className="flex gap-1.5">
                {ONBOARDING_STEPS.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'}`}></div>
                ))}
            </div>

            <button 
                onClick={nextStep}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                    step === ONBOARDING_STEPS.length - 1 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
            >
                {step === ONBOARDING_STEPS.length - 1 ? (
                    <>Initialize <ArrowRight size={16}/></>
                ) : (
                    <>Next <ChevronRight size={16}/></>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};

// --- LOCAL STORAGE LOGIC ---
const STORAGE_KEY = 'eco_sim_highscores';
const getLocalHighscores = (): HighScoreEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) { return []; }
};
const saveLocalHighscore = (entry: HighScoreEntry) => {
  try {
    const current = getLocalHighscores();
    const updated = [...current, entry].sort((a, b) => b.score - a.score).slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) { return []; }
};

export const GameOverModal = ({ cause, year, tick, totalTicks, alienDeployed, onReset, onContinue }: any) => {
    const [playerName, setPlayerName] = useState('');
    const [scores, setScores] = useState<HighScoreEntry[]>([]);
    const [isHighScore, setIsHighScore] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const isGlobal = !!supabase; // Check if Supabase is connected

    useEffect(() => {
        const loadScores = async () => {
            setLoading(true);
            let currentScores: HighScoreEntry[] = [];
            
            try {
                if (isGlobal) {
                    currentScores = await fetchGlobalScores();
                } else {
                    currentScores = getLocalHighscores();
                }
            } catch (e) {
                console.error("Failed to load scores", e);
                currentScores = [];
            }
            
            // Ensure currentScores is an array
            const safeScores = currentScores || [];
            setScores(safeScores);
            setLoading(false);

            // Check Qualification
            if (!submitted) {
                 const limit = isGlobal ? 10 : 5;
                 // If leaderboard is not full, any score qualifies
                 if (safeScores.length < limit) {
                     setIsHighScore(true);
                 } else {
                     // Otherwise must beat the lowest score
                     const minScore = safeScores[safeScores.length - 1]?.score || 0;
                     if (totalTicks > minScore) {
                         setIsHighScore(true);
                     }
                 }
            }
        };
        loadScores();
    }, [isGlobal, submitted, totalTicks]);

    const handleSubmitScore = async () => {
        if (!playerName.trim()) return;
        setLoading(true);
        setErrorMsg(null);

        const entry: HighScoreEntry = {
            name: playerName.trim().slice(0, 12),
            score: totalTicks,
            year: year
        };

        if (isGlobal) {
            const result = await submitGlobalScore(entry);
            if (!result.success) {
                // Show inline error instead of alert
                setErrorMsg(result.error || "Unknown error");
                setLoading(false);
                return;
            }
        } else {
            saveLocalHighscore(entry);
        }
        
        setSubmitted(true);
        setIsHighScore(false);
        // Reload scores
        try {
            if (isGlobal) {
                 const updated = await fetchGlobalScores();
                 setScores(updated || []);
            } else {
                 setScores(getLocalHighscores());
            }
        } catch(e) {
             console.error("Error refreshing scores", e);
        }
        setLoading(false);
    };

    return (
       <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm print:hidden animate-in fade-in duration-300 p-4">
        <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col items-center text-center max-w-lg w-full m-4 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <Skull className="text-red-500 w-12 h-12 md:w-16 md:h-16 mb-2 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight">SIMULATION TERMINATED</h2>
          <div className="h-1 w-20 bg-red-500 rounded-full mb-4 md:mb-6"></div>
          
          {/* STATS CARD */}
          <div className="bg-slate-950 p-4 rounded-xl w-full mb-4 text-left border border-slate-800 relative overflow-hidden group shrink-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-teal-400"></div>
              
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-2">
                  <div>
                      <h3 className="text-sm md:text-lg font-bold text-slate-200 flex items-center gap-2">
                          <FileText size={18} className="text-blue-400"/> Final Report
                      </h3>
                  </div>
                  <div className="px-2 py-1 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-[10px] md:text-xs font-bold uppercase">
                      Failure
                  </div>
              </div>

              <div className="space-y-2 font-mono text-xs md:text-sm text-slate-300">
                  <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                      <span className="text-slate-500 flex items-center gap-2"><AlertTriangle size={14}/> Cause</span>
                      <span className="font-bold text-red-400 truncate max-w-[150px] md:max-w-none text-right">{cause}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                      <span className="text-slate-500 flex items-center gap-2"><Clock size={14}/> Duration</span>
                      <span>Year <span className="text-white">{year}</span>, Tick <span className="text-white">{tick}</span></span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                      <span className="text-slate-500 flex items-center gap-2"><Activity size={14}/> Total Score</span>
                      <span className="text-white font-bold">{totalTicks}</span>
                  </div>
              </div>
          </div>

          {/* HIGHSCORE BOARD */}
          <div className="w-full bg-slate-800/50 rounded-xl border border-slate-700 p-4 mb-4 shrink-0">
              <div className="flex justify-between items-center mb-3">
                   <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                       <Trophy size={16} /> 
                       {isGlobal ? "GLOBAL LEADERBOARD" : "LOCAL RANKING"}
                   </h3>
                   <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                       {isGlobal ? <Globe size={10} /> : <Smartphone size={10} />}
                       {isGlobal ? "Online" : "Offline"}
                   </span>
              </div>
              
              {isHighScore && !submitted ? (
                  <div className="mb-4 bg-teal-900/20 border border-teal-500/30 p-3 rounded-lg animate-pulse">
                      <p className="text-teal-200 text-xs font-bold mb-2">NEW RECORD! ENTER IDENTIFIER:</p>
                      <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={playerName} 
                            onChange={(e) => setPlayerName(e.target.value)}
                            maxLength={12}
                            placeholder="NAME"
                            disabled={loading}
                            className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-white text-sm w-full focus:outline-none focus:border-teal-400 font-mono uppercase"
                          />
                          <button 
                            onClick={handleSubmitScore}
                            disabled={!playerName || loading}
                            className="bg-teal-500 hover:bg-teal-400 text-slate-900 p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {loading ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
                          </button>
                      </div>
                      {errorMsg && (
                          <div className="mt-2 text-[10px] text-red-300 bg-red-900/40 p-1 rounded border border-red-500/30">
                              {errorMsg.includes("policy") ? "Error: Database blocked the update (RLS Policy)." : errorMsg}
                          </div>
                      )}
                  </div>
              ) : null}

              <div className="space-y-1">
                  {loading && <div className="text-xs text-slate-500 italic py-4">Connecting to network...</div>}
                  {!loading && (scores || []).length === 0 && <p className="text-xs text-slate-500 italic py-2">No records found.</p>}
                  {!loading && (scores || []).map((s, i) => (
                      <div key={i} className={`flex justify-between items-center p-2 rounded text-xs ${s.score === totalTicks && submitted && s.name === playerName ? 'bg-teal-500/20 border border-teal-500/50' : 'bg-slate-900/40'}`}>
                          <div className="flex items-center gap-3">
                              <span className={`font-mono font-bold w-4 ${i===0 ? 'text-yellow-400' : 'text-slate-500'}`}>#{i+1}</span>
                              <span className="text-slate-200 font-bold font-mono uppercase">{s.name}</span>
                          </div>
                          <div className="flex gap-4 text-slate-400 font-mono">
                              <span>Yr {s.year}</span>
                              <span className="text-white font-bold">{s.score}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="flex gap-3 w-full shrink-0">
            <button onClick={onReset} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-red-500/20 text-sm">
              <RotateCcw size={18} /> REBOOT SYSTEM
            </button>
          </div>
          
          <button onClick={onContinue} className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline shrink-0">
             Continue Observing (Ignore Warning)
          </button>
        </div>
      </div>
    );
}
