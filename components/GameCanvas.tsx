import React, { useEffect, useRef } from 'react';
import { SpeciesType, TerrainType, SPECIES_CONFIG, Season } from '../types';

interface GameCanvasProps {
  width: number;
  height: number;
  speciesRef: React.MutableRefObject<Uint8Array>;
  terrainRef: React.MutableRefObject<Uint8Array>;
  ageRef: React.MutableRefObject<Uint16Array>; 
  energyRef: React.MutableRefObject<Uint8Array>;
  generation: number;
  season: Season;
  highlightSpecies: SpeciesType | null;
}

// Fixed internal resolution for crisp rendering
// We render at this size, then let CSS scale it down to fit the phone screen.
const CELL_SIZE = 5;

// "Dark Mode" High Contrast Palette
const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.DEEP_WATER]: '#020617',    // Slate 950
  [TerrainType.SHALLOW_WATER]: '#0f172a', // Slate 900
  [TerrainType.SAND]: '#44403c',          // Stone 700
  [TerrainType.GRASS]: '#1c1917',         // Stone 900
  [TerrainType.FOREST]: '#111827',        // Gray 900
  [TerrainType.MOUNTAIN]: '#374151',      // Gray 700
  [TerrainType.ICE]: '#334155',           // Slate 700
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ width, height, speciesRef, terrainRef, ageRef, energyRef, generation, season, highlightSpecies }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for speed
    if (!ctx) return;

    const species = speciesRef.current;
    const terrain = terrainRef.current;
    const ages = ageRef.current;
    const energies = energyRef.current;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animation Factors
    const breath = 1.0 + Math.sin(generation * 0.15) * 0.1;
    const alienPulse = 1.0 + Math.sin(generation * 0.3) * 0.3;

    for (let i = 0; i < width * height; i++) {
      const x = (i % width) * CELL_SIZE;
      const y = Math.floor(i / width) * CELL_SIZE;
      
      const s = species[i] as SpeciesType;
      const t = terrain[i] as TerrainType;
      const age = ages[i];

      const isHighlightMode = highlightSpecies !== null;
      let alpha = 1.0;
      let fillStyle = TERRAIN_COLORS[t];

      ctx.fillStyle = fillStyle;
      
      if (isHighlightMode) {
          if (s === highlightSpecies) {
              alpha = 1.0;
          } else {
              alpha = 0.15; 
          }
      }
      
      ctx.globalAlpha = alpha;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      
      // Texture Overlay
      if (t !== TerrainType.DEEP_WATER && t !== TerrainType.SHALLOW_WATER && !isHighlightMode) {
         if ((x + y * 57) % 7 === 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(x + 1, y + 1, 1, 1);
         }
      }

      // Draw Species
      if (s !== SpeciesType.NONE) {
        const config = SPECIES_CONFIG[s];
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        
        if (s === SpeciesType.PLANT) {
            const health = energies[i];
            const opacity = Math.max(0.3, Math.min(1.0, health / 5.0));
            
            ctx.globalAlpha = alpha * opacity;
            ctx.fillStyle = config.color;
            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        } 
        else if (s === SpeciesType.CORPSE) {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = config.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
            ctx.moveTo(x + CELL_SIZE, y);
            ctx.lineTo(x, y + CELL_SIZE);
            ctx.stroke();
        } 
        else if (s === SpeciesType.ALIEN) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = config.color;
            ctx.globalAlpha = 0.3 * alpha;
            ctx.beginPath();
            ctx.arc(cx, cy, CELL_SIZE * alienPulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(cx, cy, CELL_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        } 
        else {
            // ANIMALS
            ctx.globalAlpha = alpha;
            ctx.fillStyle = config.color;

            const maxGrowthAge = 50; 
            const growthFactor = Math.min(1, (age + 1) / maxGrowthAge);
            
            let radius = (CELL_SIZE / 2.2) * (0.6 + (0.4 * growthFactor)) * breath;
            radius = Math.max(0.5, Math.min(radius, CELL_SIZE / 1.8));

            if (s === SpeciesType.PREDATOR || s === SpeciesType.APEX) {
                ctx.globalAlpha = 0.3 * alpha;
                ctx.beginPath();
                ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = alpha;
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            if (radius > 1.5) {
               ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
               ctx.beginPath();
               ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
               ctx.fill();
            }
        }
      }
    }

    // Seasonal Overlay
    if (!highlightSpecies) {
        ctx.globalAlpha = 1.0;
        if (season === Season.WINTER) {
        ctx.fillStyle = 'rgba(200, 230, 255, 0.05)'; 
        ctx.fillRect(0,0, canvas.width, canvas.height);
        } else if (season === Season.AUTUMN) {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.03)'; 
        ctx.fillRect(0,0, canvas.width, canvas.height);
        } else if (season === Season.SPRING) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.03)'; 
        ctx.fillRect(0,0, canvas.width, canvas.height);
        }
    }

  }, [generation, width, height, speciesRef, terrainRef, ageRef, energyRef, season, highlightSpecies]);

  return (
    <div className="w-full h-auto border-4 border-slate-700 rounded-lg shadow-2xl overflow-hidden bg-black cursor-crosshair flex justify-center items-center bg-slate-900">
      <canvas
        ref={canvasRef}
        width={width * CELL_SIZE}
        height={height * CELL_SIZE}
        className="block"
        // CSS SCALING: This is what makes it fit on mobile.
        // It forces the high-res canvas to shrink into the container width.
        style={{ width: '100%', height: 'auto', imageRendering: 'pixelated' }}
      />
    </div>
  );
};