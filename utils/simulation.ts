
import { SpeciesType } from "../types";

export const calculateStats = (species: Uint8Array) => {
  const counts = {
    [SpeciesType.NONE]: 0,
    [SpeciesType.PLANT]: 0,
    [SpeciesType.INSECT]: 0,
    [SpeciesType.HERBIVORE]: 0,
    [SpeciesType.PREDATOR]: 0,
    [SpeciesType.APEX]: 0,
    [SpeciesType.CORPSE]: 0,
    [SpeciesType.ALIEN]: 0,
  };
  // Using a standard loop for performance over .reduce
  for(let i=0; i<species.length; i++) {
    counts[species[i] as SpeciesType]++;
  }
  return counts;
};

// Pre-calculate neighbor indices once to avoid 24,000 array creations per frame
export const generateNeighborMap = (width: number, height: number): Int32Array[] => {
  const map: Int32Array[] = new Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    const neighbors: number[] = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          neighbors.push(ny * width + nx);
        }
      }
    }
    map[i] = new Int32Array(neighbors);
  }
  return map;
};
