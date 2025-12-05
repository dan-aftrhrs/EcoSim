
import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeciesType, GameStats, SpawnSettings, Season, GameModifiers, GameConfig, DEFAULT_GAME_CONFIG, SPECIES_CONFIG, NewsItem, NewsType } from '../types';
import { calculateStats } from '../utils/simulation';
import { initializeWorldData, updateWorld } from '../utils/gameLogic';

const WIDTH = 200;
const HEIGHT = 120;

const DEFAULT_SPAWN_SETTINGS: SpawnSettings = {
  [SpeciesType.NONE]: 0,
  [SpeciesType.PLANT]: 70,
  [SpeciesType.INSECT]: 15,
  [SpeciesType.HERBIVORE]: 10,
  [SpeciesType.PREDATOR]: 4,
  [SpeciesType.APEX]: 1,
  [SpeciesType.CORPSE]: 0,
  [SpeciesType.ALIEN]: 0,
};

const DEFAULT_MODIFIERS: GameModifiers = {
  energyBurnRate: 0.1, 
  plantGrowthRate: 1.0,
  reproCostMultiplier: 1.0,
  rescueCount: 0,
};

const TRIVIA_LIST = [
    "Tip: Plants grow faster near water.",
    "Trivia: Apex predators can cross mountain ranges.",
    "Tip: Winter freezes shallow water, creating bridges.",
    "Trivia: Corpses decay into nutrients for plants.",
    "Tip: High biodiversity prevents total extinction.",
    "Trivia: The Balancer consumes cosmic energy.",
    "Tip: Insects can cross water in Winter.",
    "Trivia: Plants have a 50% regen rate from nearby corpses.",
    "Tip: Herbivores thrive in grasslands.",
    "Trivia: Predators hunt in packs to take down larger prey.",
    "Tip: Autumn is the best season for Apex hunting.",
    "Trivia: The Alien Balancer is immortal.",
    "Tip: Watch the population density to avoid starvation.",
    "Trivia: Life always finds a way... usually.",
    "Tip: Use the Balancer to save endangered species.",
    "Trivia: Swarmers are the first to scavenge carrion."
];

export const useGameEngine = () => {
  const [generation, setGeneration] = useState(0);
  const [stats, setStats] = useState<GameStats>({
    generation: 0,
    population: { [SpeciesType.NONE]: 0, [SpeciesType.PLANT]: 0, [SpeciesType.INSECT]: 0, [SpeciesType.HERBIVORE]: 0, [SpeciesType.PREDATOR]: 0, [SpeciesType.APEX]: 0, [SpeciesType.CORPSE]: 0, [SpeciesType.ALIEN]: 0 },
    season: Season.SPRING,
    modifiers: { ...DEFAULT_MODIFIERS }
  });
  const [extinctionEvent, setExtinctionEvent] = useState<number>(0);
  const [gameOver, setGameOver] = useState<{ isOver: boolean; cause: string }>({ isOver: false, cause: '' });
  const [alienDeployed, setAlienDeployed] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);

  const speedRef = useRef(150); 
  const lastTickRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const isRunning = useRef(false);
  const seasonTickRef = useRef(0);
  const generationRef = useRef(0);
  const hasStartedRef = useRef(false);
  
  // Refs for tracking news events to prevent spamming
  const lastOverpopLogRef = useRef<Record<SpeciesType, number>>({} as any);
  const lastScarcityLogRef = useRef<Record<SpeciesType, number>>({} as any);
  const startUpTimeRef = useRef<number>(0);
  const lastLogSignatureRef = useRef<string>("");
  
  const modifiersRef = useRef<GameModifiers>({ ...DEFAULT_MODIFIERS });
  const spawnSettingsRef = useRef<SpawnSettings>({ ...DEFAULT_SPAWN_SETTINGS });
  const gameConfigRef = useRef<GameConfig>({ ...DEFAULT_GAME_CONFIG });
  const ignoredExtinctionsRef = useRef<Set<SpeciesType>>(new Set());
  const neighborMapRef = useRef<Int32Array[]>([]);

  const speciesRef = useRef(new Uint8Array(WIDTH * HEIGHT));
  const terrainRef = useRef(new Uint8Array(WIDTH * HEIGHT));
  const baseTerrainRef = useRef(new Uint8Array(WIDTH * HEIGHT));
  const ageRef = useRef(new Uint16Array(WIDTH * HEIGHT));
  const energyRef = useRef(new Uint8Array(WIDTH * HEIGHT));
  const nextSpeciesRef = useRef(new Uint8Array(WIDTH * HEIGHT));
  const nextAgeRef = useRef(new Uint16Array(WIDTH * HEIGHT));
  const nextEnergyRef = useRef(new Uint8Array(WIDTH * HEIGHT));
  const occupiedRef = useRef(new Uint8Array(WIDTH * HEIGHT));

  const stop = useCallback(() => {
    isRunning.current = false;
    cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const spawnAlien = useCallback((x: number, y: number) => {
    if (alienDeployed) return;
    const index = y * WIDTH + x;
    speciesRef.current[index] = SpeciesType.ALIEN;
    ageRef.current[index] = 0;
    energyRef.current[index] = 100;
    setAlienDeployed(true);
  }, [alienDeployed]);

  const initializeWorld = useCallback(() => {
    // Pass gameConfigRef.current so we can access maxHp settings
    const data = initializeWorldData(WIDTH, HEIGHT, spawnSettingsRef.current, gameConfigRef.current);
    
    speciesRef.current.set(data.species);
    terrainRef.current.set(data.terrain);
    baseTerrainRef.current.set(data.baseTerrain);
    ageRef.current.set(data.ages);
    energyRef.current.set(data.energies);
    if (data.neighborMap.length > 0 && neighborMapRef.current.length === 0) {
        neighborMapRef.current = data.neighborMap;
    }

    seasonTickRef.current = 0;
    modifiersRef.current = { ...DEFAULT_MODIFIERS };
    ignoredExtinctionsRef.current.clear();
    setAlienDeployed(false);
    
    // Clear feed on reset/init
    setNewsFeed([]);
    hasStartedRef.current = false;
    startUpTimeRef.current = 0;
    lastLogSignatureRef.current = "";

    generationRef.current = 0;
    setGeneration(0);
    setGameOver({ isOver: false, cause: '' }); 
    setStats({
       generation: 0,
       population: calculateStats(speciesRef.current),
       season: Season.SPRING,
       modifiers: modifiersRef.current
    });
    
    // Reset log trackers
    lastOverpopLogRef.current = {} as any;
    lastScarcityLogRef.current = {} as any;
  }, []);

  const update = useCallback(() => {
    const currentPopStats = calculateStats(speciesRef.current);
    const totalPop = Object.values(currentPopStats).reduce((a, b) => a + b, 0) - currentPopStats[SpeciesType.NONE] - currentPopStats[SpeciesType.CORPSE];
    const ticksPerSeason = gameConfigRef.current.seasonDuration;
    const ticksPerYear = ticksPerSeason * 4; 
    const currentSeason = Math.floor((seasonTickRef.current % ticksPerYear) / ticksPerSeason) as Season;
    seasonTickRef.current += 1;

    // --- News Feed Logic ---
    const rawEvents: NewsItem[] = [];
    // Cooldown is strictly based on when Start was pressed (startUpTimeRef)
    const isCoolingDown = startUpTimeRef.current > 0 && (Date.now() - startUpTimeRef.current) < 2000;
    
    // Allow news only after cooldown AND after 30 ticks (days)
    if (!isCoolingDown && generationRef.current > 30) {
        const LIVING_SPECIES = [SpeciesType.PLANT, SpeciesType.INSECT, SpeciesType.HERBIVORE, SpeciesType.PREDATOR, SpeciesType.APEX];
        
        // 1. Check Population Status
        LIVING_SPECIES.forEach(s => {
            const count = currentPopStats[s];
            if (totalPop > 0) {
                const pct = count / totalPop;
                const cooldown = 200; // ticks before repeating message
                
                // Check Scarcity (Critically Low but not 0)
                if (pct < 0.05 && count > 0 && count < 30) {
                     const lastTick = lastScarcityLogRef.current[s] || -9999;
                     if (generationRef.current - lastTick > cooldown) {
                         rawEvents.push({
                            id: `scarcity-${s}-${generationRef.current}`,
                            text: `${SPECIES_CONFIG[s].name} are near extinction!`,
                            type: 'extinction' // Red
                         });
                         lastScarcityLogRef.current[s] = generationRef.current;
                     }
                }
                
                // Check Overpopulation (Dominance)
                if (pct > 0.45) {
                     const lastTick = lastOverpopLogRef.current[s] || -9999;
                     if (generationRef.current - lastTick > cooldown) {
                         rawEvents.push({
                             id: `boom-${s}-${generationRef.current}`,
                             text: `${SPECIES_CONFIG[s].name} population is booming!`,
                             type: 'overpop' // Orange
                         });
                         lastOverpopLogRef.current[s] = generationRef.current;
                     }
                }
            }
        });

        // 2. Trivia Injection
        if (Math.random() < 0.005) { // Roughly once every 200 ticks
            const tip = TRIVIA_LIST[Math.floor(Math.random() * TRIVIA_LIST.length)];
            rawEvents.push({
                id: `trivia-${generationRef.current}`,
                text: tip,
                type: 'tip' // Blue
            });
        }
    }

    const { events } = updateWorld(WIDTH, HEIGHT, {
        species: speciesRef.current,
        terrain: terrainRef.current,
        baseTerrain: baseTerrainRef.current,
        ages: ageRef.current,
        energies: energyRef.current,
        nextSpecies: nextSpeciesRef.current,
        nextAges: nextAgeRef.current,
        nextEnergies: nextEnergyRef.current,
        occupied: occupiedRef.current,
        neighborMap: neighborMapRef.current
    }, {
        config: gameConfigRef.current,
        modifiers: modifiersRef.current,
        seasonTick: seasonTickRef.current,
        season: currentSeason,
        totalPop,
        currentPopStats
    });

    // 3. Process Engine Events (Balancer Actions)
    if (!isCoolingDown) {
        events.forEach(evtText => {
            let type: NewsType = 'info';
            if (evtText.includes("culled")) type = 'cull';     // Purple
            else if (evtText.includes("restored")) type = 'restore'; // Green
            
            rawEvents.push({
                id: `evt-${generationRef.current}-${Math.random()}`,
                text: evtText,
                type: type
            });
        });
    }

    if (rawEvents.length > 0) {
        setNewsFeed(prev => {
            // Deduplicate logic:
            // 1. Check against the head of the previous list
            // 2. Check within the new batch to ensure no sequential duplicates
            
            const candidates: NewsItem[] = [];
            let lastText = prev.length > 0 ? prev[0].text : "";

            for (const event of rawEvents) {
                if (event.text !== lastText) {
                    candidates.push(event);
                    lastText = event.text;
                }
            }

            if (candidates.length === 0) return prev;

            // Update signature
            lastLogSignatureRef.current = candidates[candidates.length - 1].text;
            
            // Limit to latest 6 items
            return [...candidates.reverse(), ...prev].slice(0, 5);
        });
    }

    const tempS = speciesRef.current; speciesRef.current = nextSpeciesRef.current; nextSpeciesRef.current = tempS;
    const tempA = ageRef.current; ageRef.current = nextAgeRef.current; nextAgeRef.current = tempA;
    const tempE = energyRef.current; energyRef.current = nextEnergyRef.current; nextEnergyRef.current = tempE;

    generationRef.current += 1;
    setGeneration(generationRef.current);
    
    const newStats = calculateStats(speciesRef.current);
    const livingSpecies = [SpeciesType.PLANT, SpeciesType.INSECT, SpeciesType.HERBIVORE, SpeciesType.PREDATOR, SpeciesType.APEX];
    if (generationRef.current > 10) {
      const extinctSpecies = livingSpecies.find(s => newStats[s] === 0 && !ignoredExtinctionsRef.current.has(s));
      if (extinctSpecies) {
         stop();
         isRunning.current = false;
         setGameOver({ isOver: true, cause: `${SPECIES_CONFIG[extinctSpecies].name} have gone extinct.`});
      }
    }
    if (generationRef.current % 10 === 0) {
        setStats({ generation: generationRef.current, population: newStats, season: currentSeason, modifiers: modifiersRef.current });
    }

  }, [stop]);

  const gameLoop = useCallback(() => {
    const now = Date.now();
    if (now - lastTickRef.current > speedRef.current) { update(); lastTickRef.current = now; }
    if (isRunning.current) animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [update]);

  const start = useCallback(() => { 
    if (!isRunning.current && !gameOver.isOver) { 
        // Initial Start Message on first play
        if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            startUpTimeRef.current = Date.now();
            setNewsFeed([{
                id: 'start-' + Date.now(),
                text: "The simulation has started.",
                type: 'info'
            }]);
            lastLogSignatureRef.current = "The simulation has started.";
        }
        
        isRunning.current = true; 
        gameLoop(); 
    } 
  }, [gameLoop, gameOver.isOver]);

  const continueSimulation = useCallback(() => {
     const currentStats = calculateStats(speciesRef.current);
     const livingSpecies = [SpeciesType.PLANT, SpeciesType.INSECT, SpeciesType.HERBIVORE, SpeciesType.PREDATOR, SpeciesType.APEX];
     livingSpecies.forEach(s => { if (currentStats[s] === 0) ignoredExtinctionsRef.current.add(s); });
     setGameOver({ isOver: false, cause: '' });
  }, []);
  const reset = useCallback(() => { stop(); initializeWorld(); }, [stop, initializeWorld]);
  const setSpeed = useCallback((ms: number) => { speedRef.current = ms; }, []);
  const updateSpawnSettings = useCallback((newSettings: SpawnSettings) => { spawnSettingsRef.current = newSettings; }, []);
  const updateGameConfig = useCallback((newConfig: GameConfig) => { gameConfigRef.current = newConfig; }, []);

  useEffect(() => { initializeWorld(); return () => stop(); }, [initializeWorld, stop]);

  return { width: WIDTH, height: HEIGHT, speciesRef, terrainRef, ageRef, energyRef, generation, stats, start, stop, reset, continueSimulation, spawnAlien, alienDeployed, isRunning, setSpeed, updateSpawnSettings, updateGameConfig, currentSettings: spawnSettingsRef.current, currentConfig: gameConfigRef.current, extinctionEvent, gameOver, newsFeed };
};
