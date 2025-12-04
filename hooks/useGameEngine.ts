
import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeciesType, GameStats, SpawnSettings, Season, GameModifiers, GameConfig, DEFAULT_GAME_CONFIG, SPECIES_CONFIG } from '../types';
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
  const [balancerLog, setBalancerLog] = useState<string[]>([]);

  const speedRef = useRef(150); 
  const lastTickRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const isRunning = useRef(false);
  const seasonTickRef = useRef(0);
  const generationRef = useRef(0);
  
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
    const data = initializeWorldData(WIDTH, HEIGHT, spawnSettingsRef.current);
    
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
    setBalancerLog([]);
    generationRef.current = 0;
    setGeneration(0);
    setGameOver({ isOver: false, cause: '' }); 
    setStats({
       generation: 0,
       population: calculateStats(speciesRef.current),
       season: Season.SPRING,
       modifiers: modifiersRef.current
    });
  }, []);

  const update = useCallback(() => {
    const currentPopStats = calculateStats(speciesRef.current);
    const totalPop = Object.values(currentPopStats).reduce((a, b) => a + b, 0) - currentPopStats[SpeciesType.NONE] - currentPopStats[SpeciesType.CORPSE];
    const ticksPerSeason = gameConfigRef.current.seasonDuration;
    const ticksPerYear = ticksPerSeason * 4; 
    const currentSeason = Math.floor((seasonTickRef.current % ticksPerYear) / ticksPerSeason) as Season;
    seasonTickRef.current += 1;

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

    if (events.length > 0) {
        setBalancerLog(prev => [...events, ...prev].slice(0, 5));
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

  const start = useCallback(() => { if (!isRunning.current && !gameOver.isOver) { isRunning.current = true; gameLoop(); } }, [gameLoop, gameOver.isOver]);
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

  return { width: WIDTH, height: HEIGHT, speciesRef, terrainRef, ageRef, energyRef, generation, stats, start, stop, reset, continueSimulation, spawnAlien, alienDeployed, isRunning, setSpeed, updateSpawnSettings, updateGameConfig, currentSettings: spawnSettingsRef.current, currentConfig: gameConfigRef.current, extinctionEvent, gameOver, balancerLog };
};
