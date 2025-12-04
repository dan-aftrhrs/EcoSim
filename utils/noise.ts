import { TerrainType } from '../types';

// A simple pseudo-random number generator for seeding
class MersenneTwister {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  random() {
    const x = Math.sin(this.state++) * 10000;
    return x - Math.floor(x);
  }
}

// Simple Perlin-like noise implementation for TypeScript
export const generateMap = (width: number, height: number, seed: number): TerrainType[] => {
  const map: TerrainType[] = new Array(width * height).fill(TerrainType.DEEP_WATER);
  const rng = new MersenneTwister(seed);

  // Smooth noise function
  const noise = (x: number, y: number) => {
    return (Math.sin(x * 0.1) + Math.sin(y * 0.1) + Math.sin((x + y) * 0.05)) / 3;
  };

  // --- 1. Generate 7 Random Points ---
  const points: {x: number, y: number, r: number}[] = [];
  const margin = Math.min(width, height) * 0.15;
  
  for(let i=0; i<7; i++) {
     points.push({ 
         x: margin + rng.random() * (width - margin * 2), 
         y: margin + rng.random() * (height - margin * 2),
         r: 0.15 + rng.random() * 0.15 // Random radius influence
     });
  }

  // --- 2. Identify Groups ---
  // Find the two points furthest apart
  let maxDistSq = -1;
  let p1Idx = 0;
  let p2Idx = 1;

  for(let i=0; i<points.length; i++) {
      for(let j=i+1; j<points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dSq = dx*dx + dy*dy;
          if (dSq > maxDistSq) {
              maxDistSq = dSq;
              p1Idx = i;
              p2Idx = j;
          }
      }
  }

  // Group 1: The two furthest points
  const group1 = [points[p1Idx], points[p2Idx]];
  // Group 2: The rest
  const group2 = points.filter((_, i) => i !== p1Idx && i !== p2Idx);

  // --- 3. Determine Bridge Connection ---
  // Find the closest pair of points between Group 1 and Group 2 to connect
  let minDistSq = Number.MAX_VALUE;
  let bridgeStart = group1[0];
  let bridgeEnd = group2[0];

  for(const g1 of group1) {
      for(const g2 of group2) {
          const dx = g1.x - g2.x;
          const dy = g1.y - g2.y;
          const dSq = dx*dx + dy*dy;
          if (dSq < minDistSq) {
              minDistSq = dSq;
              bridgeStart = g1;
              bridgeEnd = g2;
          }
      }
  }

  // Pre-calculate bridge vector params
  const bDx = bridgeEnd.x - bridgeStart.x;
  const bDy = bridgeEnd.y - bridgeStart.y;
  const bLenSq = bDx*bDx + bDy*bDy;
  const bLen = Math.sqrt(bLenSq);

  // Generate terrain
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Layered noise for detail
      const nx = x + rng.random() * 100;
      const ny = y + rng.random() * 100;
      
      let e = 1 * noise(1 * nx, 1 * ny) +
              0.5 * noise(2 * nx, 2 * ny) +
              0.25 * noise(4 * nx, 4 * ny);
      
      e = e / (1 + 0.5 + 0.25);
      
      // --- DOMAIN WARPING ---
      // Strong warping for irregular coastlines
      const warpScale = 0.03;
      const warpStrength = 25.0;
      const warpDx = noise(x * warpScale, y * warpScale) * warpStrength;
      const warpDy = noise((x + 100) * warpScale, (y + 100) * warpScale) * warpStrength;
      
      const wx = x + warpDx;
      const wy = y + warpDy;

      // --- CALCULATE ISLAND INFLUENCE ---
      let maxShape = 0;
      
      // Influence from Group 1
      for(const p of group1) {
        const dx = (wx - p.x) / (width / 2);
        const dy = (wy - p.y) / (height / 2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        // Use individual radius
        const r = p.r * 1.5; // Slight boost for the "Far" islands
        const influence = Math.max(0, 1 - (dist / r) * 0.5);
        if (influence > maxShape) maxShape = influence;
      }

      // Influence from Group 2
      for(const p of group2) {
        const dx = (wx - p.x) / (width / 2);
        const dy = (wy - p.y) / (height / 2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        const r = p.r;
        const influence = Math.max(0, 1 - (dist / r) * 0.5);
        if (influence > maxShape) maxShape = influence;
      }

      // --- BRIDGE LOGIC (Narrow & Winding) ---
      let bridgeInfluence = 0;
      
      // Project current point onto the line segment
      // Use raw x,y for general direction, but add noise for the "winding" check
      // t is the normalized projection [0, 1] along the line
      if (bLenSq > 0) {
        const t = ((x - bridgeStart.x) * bDx + (y - bridgeStart.y) * bDy) / bLenSq;
        
        if (t > 0 && t < 1) {
            // Straight projection point
            const projX = bridgeStart.x + t * bDx;
            const projY = bridgeStart.y + t * bDy;
            
            // Add sine wave / noise offset to the "center" of the bridge based on t
            // This curves the bridge path
            const curveAmp = 15; // How much it swings
            const curveFreq = 6; // How many wiggles
            const offset = Math.sin(t * Math.PI * curveFreq) * curveAmp;
            
            // Perpendicular vector (-y, x) normalized
            const pX = -bDy / bLen;
            const pY = bDx / bLen;
            
            // The actual centered point of the bridge at this t
            const bridgeCenterX = projX + pX * offset;
            const bridgeCenterY = projY + pY * offset;
            
            const distToBridge = Math.sqrt((x - bridgeCenterX)**2 + (y - bridgeCenterY)**2);
            
            // Narrow width (e.g., 2.5 units)
            if (distToBridge < 2.5) {
                bridgeInfluence = 0.25;
            }
        }
      }

      // Combine noise and shape
      const noiseVal = (e + 1) / 2;
      
      // Weight shape vs noise
      let val = maxShape * 0.85 + noiseVal * 0.15;
      
      // Apply bridge (Clamp to Shallow Water)
      // This ensures it acts as a winter route (Shallow Water -> Ice) but is water otherwise
      if (val < 0.20 && bridgeInfluence > 0) {
         val = 0.25; // Set strictly to Shallow Water
      }

      const i = y * width + x;

      if (val < 0.20) map[i] = TerrainType.DEEP_WATER;
      else if (val < 0.30) map[i] = TerrainType.SHALLOW_WATER;
      else if (val < 0.35) map[i] = TerrainType.SAND;
      else if (val < 0.60) map[i] = TerrainType.GRASS;
      else if (val < 0.80) map[i] = TerrainType.FOREST;
      else map[i] = TerrainType.MOUNTAIN;
    }
  }

  return map;
};