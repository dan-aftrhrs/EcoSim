
export enum TerrainType {
  DEEP_WATER = 0,
  SHALLOW_WATER = 1,
  SAND = 2,
  GRASS = 3,
  FOREST = 4,
  MOUNTAIN = 5,
  ICE = 6,
}

export enum SpeciesType {
  NONE = 0,
  PLANT = 1,
  INSECT = 2,
  HERBIVORE = 3,
  PREDATOR = 4,
  APEX = 5,
  CORPSE = 6,
  ALIEN = 7,
}

export enum Season {
  SPRING = 0,
  SUMMER = 1,
  AUTUMN = 2,
  WINTER = 3,
}

export interface GameModifiers {
  energyBurnRate: number;
  plantGrowthRate: number;
  reproCostMultiplier: number;
  rescueCount: number;
}

export interface SpeciesAttributes {
  maxAge: number; // Years
  reproCost: number;
  reproThreshold: number;
  spawnChance: number;
  mateReq: number;
  maxHp: number; // Maximum Health/Energy
}

export interface GameConfig {
  seasonDuration: number;
  enableAutoRescue: boolean;
  species: Record<SpeciesType, SpeciesAttributes>;
}

export interface GameStats {
  generation: number;
  population: Record<SpeciesType, number>;
  season: Season;
  modifiers: GameModifiers;
}

export type SpawnSettings = Record<SpeciesType, number>;

export type NewsType = 'info' | 'extinction' | 'overpop' | 'cull' | 'restore' | 'tip';

export interface NewsItem {
    id: string;
    text: string;
    type: NewsType;
}

export const SPECIES_CONFIG = {
  [SpeciesType.PLANT]: { color: '#4ade80', name: 'Flora', shape: 'square' },
  [SpeciesType.INSECT]: { color: '#facc15', name: 'Swarmers', shape: 'circle' },
  [SpeciesType.HERBIVORE]: { color: '#3b82f6', name: 'Grazers', shape: 'diamond' },
  [SpeciesType.PREDATOR]: { color: '#f87171', name: 'Hunters', shape: 'triangle' },
  [SpeciesType.APEX]: { color: '#c084fc', name: 'Apexes', shape: 'star' },
  [SpeciesType.CORPSE]: { color: '#4b5563', name: 'Carrion', shape: 'x' },
  [SpeciesType.ALIEN]: { color: '#2dd4bf', name: 'Balancer', shape: 'star' }, // Changed to Light Teal
  [SpeciesType.NONE]: { color: 'transparent', name: '', shape: '' },
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  seasonDuration: 50,
  enableAutoRescue: false,
  species: {
    [SpeciesType.NONE]: { maxAge: 0, reproCost: 0, reproThreshold: 0, spawnChance: 0, mateReq: 0, maxHp: 0 },
    [SpeciesType.CORPSE]: { maxAge: 0, reproCost: 0, reproThreshold: 0, spawnChance: 0, mateReq: 0, maxHp: 0 },
    [SpeciesType.PLANT]: { maxAge: 4.0, reproCost: 0, reproThreshold: 0, spawnChance: 0.80, mateReq: 0, maxHp: 20 },
    [SpeciesType.INSECT]: { maxAge: 4.0, reproCost: 12, reproThreshold: 30, spawnChance: 0.50, mateReq: 0, maxHp: 100 },
    [SpeciesType.HERBIVORE]: { maxAge: 3.0, reproCost: 18, reproThreshold: 30, spawnChance: 0.35, mateReq: 1, maxHp: 100 },
    [SpeciesType.PREDATOR]: { maxAge: 8.0, reproCost: 20, reproThreshold: 40, spawnChance: 0.70, mateReq: 1, maxHp: 100 },
    [SpeciesType.APEX]: { maxAge: 20.0, reproCost: 30, reproThreshold: 40, spawnChance: 0.60, mateReq: 1, maxHp: 100 },
    [SpeciesType.ALIEN]: { maxAge: 9999, reproCost: 0, reproThreshold: 0, spawnChance: 0, mateReq: 0, maxHp: 100 },
  }
};

export const SPECIES_LIST: SpeciesType[] = [
  SpeciesType.PLANT,
  SpeciesType.INSECT,
  SpeciesType.HERBIVORE,
  SpeciesType.PREDATOR,
  SpeciesType.APEX,
  SpeciesType.ALIEN, 
];

export const SPECIES_LORE: Record<SpeciesType, { diet: string, predators: string, special: string }> = {
  [SpeciesType.PLANT]: {
    diet: "Sunlight",
    predators: "Swarmers, Grazers",
    special: "Resilient structure. 50% regen from corpses."
  },
  [SpeciesType.INSECT]: {
    diet: "Carrion (1st), Plants (2nd)",
    predators: "Grazers, Hunters",
    special: "Scavengers. Crosses shallow water. Hibernates in Winter."
  },
  [SpeciesType.HERBIVORE]: {
    diet: "Plants, Swarmers",
    predators: "Hunters, Apexes",
    special: "Prolific breeder. Prefers Grasslands."
  },
  [SpeciesType.PREDATOR]: {
    diet: "Grazers, Swarmers",
    predators: "Apexes",
    special: "Pack Hunters. Can mob Apexes."
  },
  [SpeciesType.APEX]: {
    diet: "Everything (Autumn), Hunters, Grazers",
    predators: "Swarm of Hunters",
    special: "Crosses Mountains. Hibernates in Winter. Cannibalistic in Autumn."
  },
  [SpeciesType.ALIEN]: {
    diet: "Cosmic Energy",
    predators: "None",
    special: "The Gardener: Walks on water, culls weeds, saves flowers."
  },
  [SpeciesType.CORPSE]: { diet: "None", predators: "Swarmers", special: "Decays over time." },
  [SpeciesType.NONE]: { diet: "", predators: "", special: "" }
};
