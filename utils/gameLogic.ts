
import { SpeciesType, TerrainType, GameConfig, GameModifiers, Season, SpawnSettings, SPECIES_CONFIG } from '../types';
import { generateMap } from './noise';
import { generateNeighborMap } from './simulation';

export const initializeWorldData = (width: number, height: number, spawnSettings: SpawnSettings) => {
  const terrain = generateMap(width, height, Math.random() * 10000);
  const neighborMap = generateNeighborMap(width, height);
  const species = new Uint8Array(width * height);
  const ages = new Uint16Array(width * height);
  const energies = new Uint8Array(width * height);
  const baseTerrain = new Uint8Array(terrain);

  const totalWeight = (Object.values(spawnSettings) as number[]).reduce((a, b) => a + b, 0);
  const globalSpawnChance = 1200 / (width * height);

  // 1. General Population Spawn (Excluding Apexes)
  for (let i = 0; i < width * height; i++) {
    if (species[i] !== SpeciesType.NONE) continue;
    const t = terrain[i];
    let selectedSpecies = SpeciesType.NONE;
    const isValidLand = t === TerrainType.GRASS || t === TerrainType.FOREST || t === TerrainType.MOUNTAIN;

    if (isValidLand && Math.random() < globalSpawnChance) {
       const roll = Math.random() * totalWeight;
       let currentWeight = 0;
       for (const [sKey, w] of Object.entries(spawnSettings)) {
         const sType = Number(sKey) as SpeciesType;
         // Skip Apexes in random distribution
         if (sType === SpeciesType.APEX) continue;
         
         const weight = w as number; 
         currentWeight += weight;
         if (roll < currentWeight) { selectedSpecies = sType; break; }
       }
    }

    if (selectedSpecies !== SpeciesType.NONE) {
      if (selectedSpecies === SpeciesType.INSECT && t !== TerrainType.FOREST) { if (Math.random() < 0.7) selectedSpecies = SpeciesType.NONE; }
      else if (selectedSpecies === SpeciesType.HERBIVORE && t !== TerrainType.GRASS) { if (Math.random() < 0.7) selectedSpecies = SpeciesType.NONE; }
      else if (selectedSpecies === SpeciesType.PLANT && t === TerrainType.MOUNTAIN) { selectedSpecies = SpeciesType.NONE; }
    }
    
    if (selectedSpecies !== SpeciesType.NONE) {
        species[i] = selectedSpecies;
        ages[i] = Math.floor(Math.random() * 50); 
        energies[i] = selectedSpecies === SpeciesType.PLANT ? 10 : (40 + Math.floor(Math.random() * 30));

        if (selectedSpecies === SpeciesType.PREDATOR) {
            const packSize = 4;
            const neighbors = neighborMap[i];
            let spawnedCount = 0;
            const shuffled = Array.from(neighbors).sort(() => Math.random() - 0.5);

            for (const nIdx of shuffled) {
                if (spawnedCount >= packSize) break;
                if (species[nIdx] === SpeciesType.NONE) {
                     const nt = terrain[nIdx];
                     const validPackLand = nt === TerrainType.GRASS || nt === TerrainType.FOREST || nt === TerrainType.MOUNTAIN;
                     if (validPackLand) {
                         species[nIdx] = selectedSpecies;
                         ages[nIdx] = Math.floor(Math.random() * 50);
                         energies[nIdx] = 40 + Math.floor(Math.random() * 30);
                         spawnedCount++;
                     }
                }
            }
        }
    }
  }

  // 2. Apex Spawn Logic (Exactly 2 Locations)
  if (spawnSettings[SpeciesType.APEX] > 0) {
     const potentialSpawns: number[] = [];
     // Prioritize Mountains
     for(let i=0; i<width*height; i++) {
         if (terrain[i] === TerrainType.MOUNTAIN && species[i] === SpeciesType.NONE) potentialSpawns.push(i);
     }
     
     // Fallback if no mountains available
     if (potentialSpawns.length < 2) {
         for(let i=0; i<width*height; i++) {
             if ((terrain[i] === TerrainType.FOREST || terrain[i] === TerrainType.GRASS) && species[i] === SpeciesType.NONE) {
                 potentialSpawns.push(i);
             }
         }
     }

     if (potentialSpawns.length > 0) {
         // Shuffle to pick random spots
         for (let i = potentialSpawns.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [potentialSpawns[i], potentialSpawns[j]] = [potentialSpawns[j], potentialSpawns[i]];
         }

         // Pick up to 2 locations
         const spawnCount = Math.min(2, potentialSpawns.length);
         for(let k=0; k<spawnCount; k++) {
             const idx = potentialSpawns[k];
             species[idx] = SpeciesType.APEX;
             ages[idx] = Math.floor(Math.random() * 50);
             energies[idx] = 80;

             // Spawn Pack
             const neighbors = neighborMap[idx];
             const shuffled = Array.from(neighbors).sort(() => Math.random() - 0.5);
             let mates = 0;
             for (const nIdx of shuffled) {
                 if (mates >= 2) break; // Pack size of 3 (1 leader + 2 mates)
                 if (species[nIdx] === SpeciesType.NONE) {
                      const nt = terrain[nIdx];
                      if (nt === TerrainType.GRASS || nt === TerrainType.FOREST || nt === TerrainType.MOUNTAIN) {
                          species[nIdx] = SpeciesType.APEX;
                          ages[nIdx] = Math.floor(Math.random() * 50);
                          energies[nIdx] = 80;
                          mates++;
                      }
                 }
             }
         }
     }
  }

  return { terrain, baseTerrain, neighborMap, species, ages, energies };
};

export const updateWorld = (
  width: number, height: number,
  buffers: { species: Uint8Array, terrain: Uint8Array, baseTerrain: Uint8Array, ages: Uint16Array, energies: Uint8Array, nextSpecies: Uint8Array, nextAges: Uint16Array, nextEnergies: Uint8Array, occupied: Uint8Array, neighborMap: Int32Array[] },
  params: { config: GameConfig, modifiers: GameModifiers, seasonTick: number, season: Season, totalPop: number, currentPopStats: Record<SpeciesType, number> }
) => {
    const { species, terrain, baseTerrain, ages, energies, nextSpecies, nextAges, nextEnergies, occupied, neighborMap } = buffers;
    const { config, modifiers, seasonTick, season, totalPop, currentPopStats } = params;
    const ticksPerSeason = config.seasonDuration;
    const ticksPerYear = ticksPerSeason * 4;
    const isRegenTick = seasonTick % 10 === 0;
    const centerX = width / 2;
    const centerY = height / 2;
    const events: string[] = [];

    nextSpecies.fill(SpeciesType.NONE); nextAges.fill(0); nextEnergies.fill(0); occupied.fill(0);

    // --- ALIEN BALANCER INTELLIGENCE ---
    const isEndangered: Record<number, boolean> = {};
    const isDominant: Record<number, boolean> = {};
    
    if (totalPop > 0) {
        const globalDensity = totalPop / (width * height);
        
        // Dynamic Thresholds based on Global Density
        // If crowded (>15%), be strict about dominance (20%). If empty (<5%), be generous (40%).
        let dominantThreshold = 0.30;
        if (globalDensity > 0.15) dominantThreshold = 0.20;
        else if (globalDensity < 0.05) dominantThreshold = 0.40;

        // If crowded, barely help anyone (<5%). If empty, help everyone (<15%).
        let endangeredThreshold = 0.10;
        if (globalDensity > 0.15) endangeredThreshold = 0.05;
        else if (globalDensity < 0.05) endangeredThreshold = 0.15;

        for (const sKey in currentPopStats) {
             const sType = Number(sKey) as SpeciesType;
             if (sType === SpeciesType.NONE || sType === SpeciesType.ALIEN || sType === SpeciesType.CORPSE) continue;
             const percent = currentPopStats[sType] / totalPop;
             
             if (percent < endangeredThreshold) isEndangered[sType] = true;
             if (percent > dominantThreshold) isDominant[sType] = true;
        }
    }

    // Seasons
    if (seasonTick % ticksPerSeason === 0) {
        if (season === Season.WINTER) {
            for (let i = 0; i < width * height; i++) {
                if (baseTerrain[i] === TerrainType.SHALLOW_WATER) terrain[i] = TerrainType.ICE;
                else if (baseTerrain[i] === TerrainType.DEEP_WATER) {
                    let landNeighbors = 0;
                    const nArr = neighborMap[i];
                    for(let k=0; k<nArr.length; k++) if (baseTerrain[nArr[k]] >= TerrainType.SAND) landNeighbors++;
                    if (landNeighbors >= 2) terrain[i] = TerrainType.ICE;
                }
            }
        } else if (season === Season.SPRING) {
             for (let i = 0; i < width * height; i++) {
                if (terrain[i] === TerrainType.ICE) {
                    terrain[i] = baseTerrain[i];
                    const s = species[i];
                    if (s !== SpeciesType.NONE && s !== SpeciesType.PLANT && s !== SpeciesType.CORPSE && s !== SpeciesType.INSECT && s !== SpeciesType.ALIEN) {
                        const nArr = neighborMap[i];
                        let moved = false;
                        
                        // Priority 1: Empty Land
                        for(let k=0; k<nArr.length; k++) {
                            const idx = nArr[k];
                            if (terrain[idx] >= TerrainType.SAND && species[idx] === SpeciesType.NONE) {
                                species[idx] = s; energies[idx] = energies[i] + 10; 
                                ages[idx] = ages[i];
                                species[i] = SpeciesType.NONE; energies[i] = 0; moved = true; break;
                            }
                        }
                        // Priority 2: Trample Plants
                        if (!moved) {
                             for(let k=0; k<nArr.length; k++) {
                                const idx = nArr[k];
                                if (terrain[idx] >= TerrainType.SAND && species[idx] === SpeciesType.PLANT) {
                                    species[idx] = s; energies[idx] = energies[i] + 15; 
                                    ages[idx] = ages[i];
                                    species[i] = SpeciesType.NONE; energies[i] = 0; moved = true; break;
                                }
                             }
                        }
                        
                        if (!moved) { species[i] = SpeciesType.CORPSE; energies[i] = 50; }
                    }
                }
            }
        }
    }

    const totalCells = width * height;
    const iterateForward = (seasonTick % 2 === 0);

    for (let k = 0; k < totalCells; k++) {
        const i = iterateForward ? k : (totalCells - 1 - k);
        const s = species[i];
        
        if (s === SpeciesType.NONE) {
             if (occupied[i] === 0) {
                let spontChance = isRegenTick ? 0.10 : 0.005; 
                if (season === Season.WINTER) spontChance = 0.001; 
                spontChance *= modifiers.plantGrowthRate;
                const t = terrain[i];
                if ((t === TerrainType.FOREST || (t === TerrainType.GRASS && Math.random() < 0.5)) && Math.random() < spontChance) {
                    nextSpecies[i] = SpeciesType.PLANT; nextAges[i] = 0; nextEnergies[i] = 10; occupied[i] = 1;
                }
             }
             continue;
        }

        if (s === SpeciesType.PLANT) {
            if (occupied[i] === 0) {
                 const currentHealth = energies[i];
                 if (currentHealth > 0) {
                    const sStats = config.species[SpeciesType.PLANT];
                    if (ages[i] < sStats.maxAge * ticksPerYear) {
                        nextSpecies[i] = SpeciesType.PLANT; nextAges[i] = ages[i] + 1;
                        nextEnergies[i] = Math.min(10, currentHealth + (isRegenTick ? 2.0 : 0.15));
                        occupied[i] = 1;
                        let spreadChance = sStats.spawnChance * modifiers.plantGrowthRate * 6.0;
                        if (season === Season.WINTER) spreadChance *= 0.2;
                        if (ages[i] > 10 && Math.random() < spreadChance) {
                             const nArr = neighborMap[i];
                             const possibleSpots = [];
                             for(let k=0; k<nArr.length; k++) {
                                 const idx = nArr[k];
                                 if (occupied[idx] === 0 && (terrain[idx] === TerrainType.GRASS || terrain[idx] === TerrainType.FOREST)) possibleSpots.push(idx);
                             }
                             if (possibleSpots.length > 0) {
                                 const spot = possibleSpots[Math.floor(Math.random() * possibleSpots.length)];
                                 nextSpecies[spot] = SpeciesType.PLANT; nextAges[spot] = 0; nextEnergies[spot] = 10; occupied[spot] = 1;
                             }
                        }
                    }
                 }
            }
            continue;
        }

        const nArr = neighborMap[i];
        
        if (s === SpeciesType.CORPSE) {
             const decay = energies[i] - 1;
             if (decay > 0) {
                 if (occupied[i] === 0) { nextSpecies[i] = SpeciesType.CORPSE; nextEnergies[i] = decay; occupied[i] = 1; }
             } else {
                 if (occupied[i] === 0 && Math.random() < 0.50 && (terrain[i] === TerrainType.GRASS || terrain[i] === TerrainType.FOREST)) {
                     nextSpecies[i] = SpeciesType.PLANT; nextAges[i] = 0; nextEnergies[i] = 10; occupied[i] = 1;
                 }
             }
             continue;
        }

        if (s === SpeciesType.ALIEN) {
            // 1. INTERACT
            for(let k=0; k<nArr.length; k++) {
                const nIdx = nArr[k];
                const targetS = species[nIdx];
                
                if (targetS === SpeciesType.CORPSE && occupied[nIdx] === 0) {
                    nextSpecies[nIdx] = SpeciesType.PLANT; nextAges[nIdx] = 0; nextEnergies[nIdx] = 10; occupied[nIdx] = 1;
                } 
                else if (targetS !== SpeciesType.NONE && targetS !== SpeciesType.ALIEN && targetS !== SpeciesType.PLANT) {
                    if (isDominant[targetS]) { 
                        species[nIdx] = SpeciesType.CORPSE; energies[nIdx] = 50; 
                        if (events.length < 3 && Math.random() < 0.3) {
                             events.push(`Balancer culled ${SPECIES_CONFIG[targetS].name}`);
                        }
                    }
                    else if (isEndangered[targetS]) {
                         for(let j=0; j<nArr.length; j++) {
                            const eIdx = nArr[j];
                            if (species[eIdx] === SpeciesType.NONE && occupied[eIdx] === 0) {
                                nextSpecies[eIdx] = targetS; nextAges[eIdx] = 0; nextEnergies[eIdx] = 50; occupied[eIdx] = 1; 
                                if (events.length < 3 && Math.random() < 0.3) {
                                    events.push(`Balancer restored ${SPECIES_CONFIG[targetS].name}`);
                                }
                                break;
                            }
                         }
                    }
                }
            }

            // 2. INTELLIGENT MOVEMENT
            let moveTarget = i;
            const candidates = [];
            
            for(let k=0; k<nArr.length; k++) {
                const idx = nArr[k];
                // Check if we can step here.
                // 1. Terrain must not be deep water.
                // 2. Current species is NONE or PLANT.
                // 3. Next slot is empty OR occupied by a PLANT (which we can trample).
                const isTraversableTerrain = terrain[idx] !== TerrainType.DEEP_WATER;
                const isPlantOrEmpty = species[idx] === SpeciesType.NONE || species[idx] === SpeciesType.PLANT;
                const isNextFreeOrPlant = occupied[idx] === 0 || nextSpecies[idx] === SpeciesType.PLANT;

                if (isTraversableTerrain && isPlantOrEmpty && isNextFreeOrPlant) {
                    let score = Math.random();
                    
                    const secondaryNeighbors = neighborMap[idx];
                    for (let m=0; m<secondaryNeighbors.length; m++) {
                        const sIdx = secondaryNeighbors[m];
                        const sType = species[sIdx];
                        
                        if (sType !== SpeciesType.NONE && sType !== SpeciesType.ALIEN) {
                            if (isEndangered[sType]) score += 20; 
                            else if (sType === SpeciesType.CORPSE) score += 5; 
                            else if (isDominant[sType]) score += 5; 
                        }
                    }
                    
                    candidates.push({ idx, score });
                }
            }

            if (candidates.length > 0) {
                candidates.sort((a, b) => b.score - a.score);
                const limit = Math.min(2, candidates.length);
                moveTarget = candidates[Math.floor(Math.random() * limit)].idx;
            }
            
            nextSpecies[moveTarget] = SpeciesType.ALIEN; nextEnergies[moveTarget] = 100; occupied[moveTarget] = 1;
            continue;
        }

        const age = ages[i];
        let energy = energies[i];
        const sStats = config.species[s];
        const maxAgeInTicks = sStats.maxAge * ticksPerYear;

        if (season === Season.WINTER && (s === SpeciesType.INSECT || s === SpeciesType.APEX)) {
            const needsSleep = energy < 60;
            if (Math.random() < (needsSleep ? 1.0 : 0.85)) {
                if (occupied[i] === 0) { nextSpecies[i] = s; nextAges[i] = age + 1; nextEnergies[i] = Math.max(0, energy - 0.01); occupied[i] = 1; }
                continue;
            }
        }

        if (age > maxAgeInTicks || energy <= 0) {
            if (occupied[i] === 0) { nextSpecies[i] = SpeciesType.CORPSE; nextEnergies[i] = 50; occupied[i] = 1; }
            continue;
        }

        let moveTarget = -1;
        let eaten = false;
        const isDesperate = energy < 30;
        const huntModifier = isDesperate ? 2.0 : 1.0;
        
        if (s === SpeciesType.INSECT) {
             const corpses = []; const plants = [];
             for(let k=0; k<nArr.length; k++) {
                 const idx = nArr[k];
                 if (species[idx] === SpeciesType.CORPSE) corpses.push(idx);
                 else if (species[idx] === SpeciesType.PLANT) plants.push(idx);
             }
             if (corpses.length > 0) {
                 energy += 30; eaten = true; moveTarget = corpses[Math.floor(Math.random() * corpses.length)];
             } else if (plants.length > 0 && Math.random() < 0.50) {
                 const target = plants[Math.floor(Math.random() * plants.length)];
                 let damage = 1;
                 if (energies[target] < 3 && Math.random() < 0.5) damage = 0;
                 if (damage > 0) {
                    energies[target] -= damage; energy += 20; eaten = true;
                    if (energies[target] <= 0) moveTarget = target; 
                 }
             }
        } else if (s === SpeciesType.HERBIVORE) {
             const plants = []; const insects = [];
             for(let k=0; k<nArr.length; k++) {
                 const idx = nArr[k];
                 if (species[idx] === SpeciesType.PLANT) plants.push(idx);
                 else if (species[idx] === SpeciesType.INSECT) insects.push(idx);
             }
             if (insects.length > 0 && Math.random() < 0.60) {
                 energy += 20; eaten = true; moveTarget = insects[Math.floor(Math.random() * insects.length)];
             } else if (plants.length > 0 && Math.random() < 0.8) {
                 const target = plants[Math.floor(Math.random() * plants.length)];
                 let damage = 1;
                 if (energies[target] < 3 && Math.random() < 0.5) damage = 0;
                 if (damage > 0) {
                    energies[target] -= damage; energy += 12; eaten = true;
                    if (energies[target] <= 0) moveTarget = target;
                 }
             }
        } else if (s === SpeciesType.PREDATOR) {
             const preys = []; const snacks = []; const apexes = [];
             for(let k=0; k<nArr.length; k++) {
                 const idx = nArr[k];
                 if (species[idx] === SpeciesType.HERBIVORE) preys.push(idx);
                 else if (species[idx] === SpeciesType.INSECT) snacks.push(idx);
                 else if (species[idx] === SpeciesType.APEX) apexes.push(idx);
             }
             let targetApex = -1;
             if (apexes.length > 0) {
                 for(const tIndex of apexes) {
                     const tNeighbors = neighborMap[tIndex];
                     let hunterCount = 0;
                     for(let j=0; j<tNeighbors.length; j++) {
                         if (species[tNeighbors[j]] === SpeciesType.PREDATOR || nextSpecies[tNeighbors[j]] === SpeciesType.PREDATOR) hunterCount++;
                     }
                     if (hunterCount >= 10) { targetApex = tIndex; break; }
                 }
             }
             if (targetApex !== -1 && Math.random() < 0.8) {
                 energy += 100; eaten = true; moveTarget = targetApex;
             } else if (preys.length > 0 && energy < 90 && Math.random() < (0.50 * huntModifier)) {
                 energy += 50; eaten = true; moveTarget = preys[Math.floor(Math.random() * preys.length)];
             } else if (snacks.length > 0 && Math.random() < (0.50 * huntModifier)) {
                 energy += 15; eaten = true; moveTarget = snacks[Math.floor(Math.random() * snacks.length)];
             }
        } else if (s === SpeciesType.APEX) {
             const predators = []; const grazers = []; const plants = []; const snacks = [];
             const kin = []; const corpses = [];

             for(let k=0; k<nArr.length; k++) {
                 const idx = nArr[k];
                 const sp = species[idx];
                 if (sp === SpeciesType.PREDATOR) predators.push(idx);
                 else if (sp === SpeciesType.HERBIVORE) grazers.push(idx);
                 else if (sp === SpeciesType.PLANT) plants.push(idx);
                 else if (sp === SpeciesType.INSECT) snacks.push(idx);
                 else if (season === Season.AUTUMN) {
                    if (sp === SpeciesType.APEX) kin.push(idx);
                    else if (sp === SpeciesType.CORPSE) corpses.push(idx);
                 }
             }

             const isAutumn = season === Season.AUTUMN;
             // Autumn: Hunt until full (95), else 70. Aggression x2.
             const threshold = isAutumn ? 95 : 70;
             const aggressiveness = isAutumn ? 2.0 : 1.0;

             if (predators.length > 0 && energy < threshold && Math.random() < (0.15 * huntModifier * aggressiveness)) {
                 energy += 80; eaten = true; moveTarget = predators[Math.floor(Math.random() * predators.length)];
             } else if (grazers.length > 0 && energy < threshold && Math.random() < (0.20 * huntModifier * aggressiveness)) {
                 energy += 40; eaten = true; moveTarget = grazers[Math.floor(Math.random() * grazers.length)];
             } else if (isAutumn && kin.length > 0 && energy < 80 && Math.random() < (0.1 * huntModifier * aggressiveness)) {
                 // Cannibalism
                 energy += 90; eaten = true; moveTarget = kin[Math.floor(Math.random() * kin.length)];
             } else if (isAutumn && corpses.length > 0 && energy < threshold && Math.random() < (0.5 * huntModifier)) {
                 // Scavenge
                 energy += 30; eaten = true; moveTarget = corpses[Math.floor(Math.random() * corpses.length)];
             } else {
                 // Snacks/Plants: In Autumn, eat snacks greedily
                 if ((isAutumn && snacks.length > 0) || snacks.length >= 20) {
                     energy += 15; eaten = true; moveTarget = snacks[Math.floor(Math.random() * snacks.length)];
                 } else if (plants.length > 0 && energy < (isAutumn ? 90 : 50) && Math.random() < 0.5) {
                     const target = plants[Math.floor(Math.random() * plants.length)];
                     let damage = 1;
                     if (isAutumn) damage = 5; 
                     else if (energies[target] < 3 && Math.random() < 0.5) damage = 0;
                     
                     if (damage > 0) {
                        energies[target] -= damage; energy += 15; eaten = true;
                        if (energies[target] <= 0) moveTarget = target;
                     }
                 }
             }
        }

        if (moveTarget === -1) {
             const candidates = [];
             const curX = i % width;
             const curY = Math.floor(i / width);

             for(let k=0; k<nArr.length; k++) {
                 const idx = nArr[k];
                 const nextT = terrain[idx];
                 let isTraversable = (nextT === TerrainType.GRASS || nextT === TerrainType.FOREST || nextT === TerrainType.ICE);
                 if (s === SpeciesType.APEX && nextT === TerrainType.MOUNTAIN) isTraversable = true;
                 if (s === SpeciesType.INSECT && nextT === TerrainType.SHALLOW_WATER) isTraversable = true;
                 
                 if (isTraversable && occupied[idx] === 0) {
                     let score = Math.random();
                     const nx = idx % width;
                     const ny = Math.floor(idx / width);

                     if (s === SpeciesType.INSECT) {
                         if (ny > curY) score += 2; 
                         if (nextT === TerrainType.FOREST) score += 5;
                         if (nextT === TerrainType.SHALLOW_WATER) score += 1;
                     } else if (s === SpeciesType.APEX) {
                         if (ny < curY) score += 2;
                         if (nextT === TerrainType.MOUNTAIN) score += 5;
                     } else if (s === SpeciesType.HERBIVORE) {
                         const dx = nx - curX;
                         const dy = ny - curY;
                         const relX = curX - centerX;
                         const relY = curY - centerY;
                         const dot = dx * (-relY) + dy * (relX);
                         if (dot > 0) score += 2;
                         if (nextT === TerrainType.GRASS) score += 5;
                     } else if (s === SpeciesType.PREDATOR) {
                         const dx = nx - curX;
                         const dy = ny - curY;
                         const relX = curX - centerX;
                         const relY = curY - centerY;
                         const dot = dx * (relY) + dy * (-relX);
                         if (dot > 0) score += 2;
                     }

                     if (nextT === TerrainType.ICE) score -= 2;

                     candidates.push({ idx, score });
                 }
             }
             if (candidates.length > 0) {
                 candidates.sort((a, b) => b.score - a.score);
                 const limit = Math.min(3, candidates.length);
                 moveTarget = candidates[Math.floor(Math.random() * limit)].idx;
             } else {
                 moveTarget = i;
             }
        }

        if (occupied[moveTarget] === 1 && moveTarget !== i) moveTarget = i;

        if (occupied[moveTarget] === 0) {
            nextSpecies[moveTarget] = s;
            nextAges[moveTarget] = age + 1;
            let burnMod = 1.0;
            if (s === SpeciesType.APEX) burnMod = 0.2; 
            if (s === SpeciesType.PREDATOR) burnMod = 0.7;
            const currentTerrain = terrain[moveTarget];
            if (s === SpeciesType.INSECT && currentTerrain === TerrainType.FOREST) burnMod *= 0.5;
            if (s === SpeciesType.HERBIVORE && currentTerrain === TerrainType.GRASS) burnMod *= 0.5;
            if (s === SpeciesType.APEX && currentTerrain === TerrainType.MOUNTAIN) burnMod *= 0.5;

            const burn = 1 * modifiers.energyBurnRate * burnMod;
            const moveCost = (moveTarget !== i) ? 0.1 : 0.05;
            nextEnergies[moveTarget] = Math.min(energy - burn - moveCost, 100);
            occupied[moveTarget] = 1;
        } 
        else if (moveTarget !== i && occupied[moveTarget] === 1 && nextSpecies[moveTarget] === SpeciesType.CORPSE) {
            nextSpecies[i] = s; nextAges[i] = age; nextEnergies[i] = energy; occupied[i] = 1;
        }

        let { reproCost, reproThreshold, mateReq, spawnChance } = sStats;
        if (season === Season.SPRING) spawnChance *= 1.2;     
        else if (season === Season.WINTER) spawnChance *= 0.1; 
        if (s === SpeciesType.HERBIVORE) spawnChance *= 2.0;
        reproCost *= modifiers.reproCostMultiplier;
        const REPRO_SAFETY_BUFFER = 20;

        if (energy > (reproThreshold + REPRO_SAFETY_BUFFER) && Math.random() < spawnChance) {
            let mates = 0;
            for(let k=0; k<nArr.length; k++) { if(species[nArr[k]] === s) mates++; }
            if (mates >= mateReq) {
                const freeSpots = [];
                 for(let k=0; k<nArr.length; k++) {
                     const idx = nArr[k];
                     const nextT = terrain[idx];
                     const isTraversable = (s === SpeciesType.APEX) 
                        ? (nextT >= TerrainType.GRASS) 
                        : (nextT >= TerrainType.GRASS && nextT !== TerrainType.MOUNTAIN);
                     const canBirth = occupied[idx] === 0 && (isTraversable || (s===SpeciesType.INSECT && nextT === TerrainType.SHALLOW_WATER));
                     if(canBirth) freeSpots.push(idx);
                 }
                 if (freeSpots.length > 0) {
                    const childSpot = freeSpots[Math.floor(Math.random() * freeSpots.length)];
                    nextSpecies[childSpot] = s; nextAges[childSpot] = 0; nextEnergies[childSpot] = 40; occupied[childSpot] = 1;
                    if (nextSpecies[moveTarget] === s) {
                        const afterBirthEnergy = nextEnergies[moveTarget] - reproCost;
                        if (afterBirthEnergy > 0) nextEnergies[moveTarget] = afterBirthEnergy;
                        else { nextSpecies[childSpot] = SpeciesType.NONE; occupied[childSpot] = 0; }
                    }
                 }
            }
        }
    }
    return { events };
};
