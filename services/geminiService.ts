
import { GameStats } from '../types';

// Stubbed functions to replace API calls so the app works without an API key
export const analyzeEcosystem = async (stats: GameStats): Promise<string> => {
  return "Analysis disabled.";
};

export const analyzeExtinction = async (stats: GameStats, cause: string): Promise<string> => {
  return "Analysis disabled.";
};
