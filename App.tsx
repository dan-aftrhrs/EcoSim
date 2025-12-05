
import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { useGameEngine } from './hooks/useGameEngine';
import { StatCard, SpeciesAction } from './components/UIComponents';
import { LandingPage, GameOverModal } from './components/Overlays';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { InfoPanel } from './components/InfoPanel';
import { SpeciesType, SpawnSettings, GameConfig, SPECIES_LIST } from './types';
import { TutorialOverlay, TutorialStep, DistributionGraphic, BalancerGraphic } from './components/TutorialOverlay';
import { Play, Pause } from 'lucide-react';

function App() {
  const { width, height, speciesRef, terrainRef, ageRef, energyRef, generation, start, stop, reset, continueSimulation, spawnAlien, alienDeployed, isRunning, stats, setSpeed, updateSpawnSettings, updateGameConfig, currentSettings, currentConfig, extinctionEvent, gameOver, newsFeed } = useGameEngine();
  const [runningState, setRunningState] = useState(false);
  const [uiSpeed, setUiSpeed] = useState(150);
  const [showSettings, setShowSettings] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [deployMode, setDeployMode] = useState(false);
  
  // Highlight State
  const [highlightSpecies, setHighlightSpecies] = useState<SpeciesType | null>(null);
  const [lockedSpecies, setLockedSpecies] = useState<SpeciesType | null>(null);

  const [spawnConfig, setSpawnConfig] = useState<SpawnSettings>(currentSettings);
  const [gameConfig, setGameConfig] = useState<GameConfig>(currentConfig);
  const prevExtinctionRef = useRef(0);
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Refs for Tutorial Highlighting
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const alienCardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setRunningState(isRunning.current); }, [generation, isRunning]);
  useEffect(() => { if (extinctionEvent > prevExtinctionRef.current) prevExtinctionRef.current = extinctionEvent; }, [extinctionEvent]);

  // Check for tutorial on start
  const handleStart = () => {
      setHasStarted(true);
      setShowTutorial(true);
  };

  const finishTutorial = () => {
      setShowTutorial(false);
  };

  const handleSpawnChange = (type: SpeciesType, val: number) => setSpawnConfig(prev => ({ ...prev, [type]: val }));
  const handleConfigChange = (field: keyof GameConfig, val: any) => setGameConfig(prev => ({ ...prev, [field]: val }));
  const handleSpeciesAttributeChange = (species: SpeciesType, field: string, val: number) => setGameConfig(prev => ({ ...prev, species: { ...prev.species, [species]: { ...prev.species[species], [field]: val } } }));
  const applySettings = () => { updateSpawnSettings(spawnConfig); updateGameConfig(gameConfig); reset(); setShowSettings(false); prevExtinctionRef.current = 0; };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (deployMode && !alienDeployed) {
       const canvas = e.currentTarget.querySelector('canvas');
       if (!canvas) return;
       const rect = canvas.getBoundingClientRect();
       const scaleX = width / rect.width; 
       const scaleY = height / rect.height;
       const gridX = Math.floor((e.clientX - rect.left) * scaleX);
       const gridY = Math.floor((e.clientY - rect.top) * scaleY);
       if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) { spawnAlien(gridX, gridY); setDeployMode(false); }
    } else {
        // Clear locked highlight on canvas click (unless in deploy mode)
        if (lockedSpecies !== null) {
            setLockedSpecies(null);
            setHighlightSpecies(null);
        }
    }
  };

  const handleSpeciesAction = (type: SpeciesType | null, action: SpeciesAction) => {
      if (action === 'hover' && type !== null) {
          if (!lockedSpecies) setHighlightSpecies(type);
      }
      else if (action === 'leave') {
          if (!lockedSpecies) setHighlightSpecies(null);
      }
      else if (action === 'click' && type !== null) {
          if (lockedSpecies === type) {
              setLockedSpecies(null);
              // Do not clear highlight immediately as mouse is still likely hovering
          } else {
              setLockedSpecies(type);
              setHighlightSpecies(type);
          }
      }
  };

  const togglePlay = () => { 
      if(isRunning.current) stop(); 
      else start(); 
      setRunningState(isRunning.current); 
  };

  const maxPop = React.useMemo(() => Math.max(100, ...(Object.values(stats.population) as number[])), [stats]);
  const ticksPerYear = currentConfig.seasonDuration * 4;
  const year = Math.floor(generation / ticksPerYear) + 1;
  const currentTick = generation % ticksPerYear;
  const totalSpawnPercent = SPECIES_LIST.reduce((acc, type) => type !== SpeciesType.ALIEN ? acc + (spawnConfig[type] || 0) : acc, 0);

  // Tutorial Steps Definition
  const tutorialSteps: TutorialStep[] = [
      {
          targetRef: playButtonRef as React.RefObject<HTMLElement>,
          text: "When you are ready, press the Green Play Button to begin the simulation life cycle.",
          position: 'top'
      },
      {
          targetRef: alienCardRef as React.RefObject<HTMLElement>,
          text: "This is your intervention tool. Click this card to switch to 'Deploy Mode', then click on the map to spawn the Balancer.",
          position: 'top'
      },
      {
          targetRef: alienCardRef as React.RefObject<HTMLElement>,
          text: "The Balancer acts as a Cosmic Gardener. It walks over water and herds, weeding out overpopulation and planting seeds for endangered species.",
          customContent: <BalancerGraphic />,
          position: 'top'
      },
      {
          targetRef: statsRef as React.RefObject<HTMLElement>,
          text: "Hover over any species card to highlight their population on the map. Click to lock the highlight view.",
          position: 'top'
      },
      {
          targetRef: statsRef as React.RefObject<HTMLElement>,
          text: "Life starts with this default biomass distribution. Plants are abundant, while Apex predators are rare.",
          customContent: <DistributionGraphic />,
          position: 'top'
      },
      {
          targetRef: settingsButtonRef as React.RefObject<HTMLElement>,
          text: "Want to experiment? Open the Settings menu to tweak spawn rates, growth speeds, and species traits.",
          position: 'bottom'
      }
  ];

  if (!hasStarted) return <LandingPage onStart={handleStart} />;

  return (
    <div className="min-h-[100dvh] w-full bg-slate-900 text-slate-100 font-sans flex flex-col overflow-x-hidden print:bg-white print:text-black relative">
      {gameOver.isOver && <GameOverModal cause={gameOver.cause} year={year} tick={currentTick} totalTicks={generation} alienDeployed={alienDeployed} onReset={() => { reset(); prevExtinctionRef.current=0; setDeployMode(false); }} onContinue={continueSimulation} />}
      
      {showTutorial && <TutorialOverlay steps={tutorialSteps} onComplete={finishTutorial} onSkip={finishTutorial} />}

      <div className="max-w-[1400px] mx-auto print:hidden p-2 md:p-4 pb-8 w-full">
        <Header 
            year={year} 
            currentTick={currentTick} 
            stats={stats} 
            uiSpeed={uiSpeed} 
            showSettings={showSettings} 
            onToggleSettings={() => setShowSettings(!showSettings)} 
            onSpeedChange={(newSpeed) => { setUiSpeed(newSpeed); setSpeed(newSpeed); }} 
            onReset={() => { reset(); prevExtinctionRef.current=0; setDeployMode(false); }}
            settingsBtnRef={settingsButtonRef}
        />

        {showSettings && <SettingsPanel spawnConfig={spawnConfig} gameConfig={gameConfig} onConfigChange={handleConfigChange} onSpawnChange={handleSpawnChange} onSpeciesAttributeChange={handleSpeciesAttributeChange} onApply={applySettings} isOverLimit={totalSpawnPercent > 100} totalSpawnPercent={totalSpawnPercent} />}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-full">
          <div className="flex flex-col gap-4 min-w-0">
            <div className={`relative overflow-hidden rounded-lg shadow-2xl bg-black border border-slate-700 touch-none mx-auto ${deployMode ? 'cursor-crosshair ring-2 ring-teal-400' : ''}`} style={{ maxWidth: '100%' }} onClick={handleCanvasClick}>
                 <div className="w-full flex justify-center bg-slate-950">
                    <GameCanvas width={width} height={height} speciesRef={speciesRef} terrainRef={terrainRef} ageRef={ageRef} energyRef={energyRef} generation={generation} season={stats.season} highlightSpecies={highlightSpecies} />
                 </div>
            </div>
            <StatCard 
                stats={stats} 
                maxPop={maxPop} 
                onSpeciesAction={handleSpeciesAction}
                currentHighlight={highlightSpecies}
                lockedHighlight={lockedSpecies}
                alienDeployed={alienDeployed} 
                deployMode={deployMode} 
                toggleDeployMode={() => setDeployMode(!deployMode)} 
                alienRef={alienCardRef}
                containerRef={statsRef}
            />
          </div>
          <InfoPanel currentConfig={currentConfig} onSpeciesAction={handleSpeciesAction} newsFeed={newsFeed} />
        </div>

        {/* Full Width Play Button */}
        <div className="w-full mt-4">
            <button
                ref={playButtonRef}
                onClick={togglePlay}
                disabled={gameOver.isOver}
                className={`
                w-full h-14 md:h-16 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99]
                ${runningState 
                    ? 'bg-slate-800 border border-red-500/50 text-red-400 hover:bg-slate-700 ring-1 ring-red-500/20' 
                    : 'bg-green-600 hover:bg-green-500 text-white border border-green-400/50 shadow-green-500/20'}
                ${gameOver.isOver ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                `}
            >
                {runningState ? (
                    <>
                        <Pause fill="currentColor" size={24} />
                        <span className="font-black text-sm md:text-lg tracking-wider">PAUSE SIMULATION</span>
                    </>
                ) : (
                    <>
                        <Play fill="currentColor" size={24} />
                        <span className="font-black text-sm md:text-lg tracking-wider">START SIMULATION</span>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}
export default App;
