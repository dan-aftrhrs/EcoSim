
import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables to prevent crashes if import.meta.env is undefined
const getEnv = (key: string) => {
  try {
    // Check if import.meta.env exists
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[key];
    }
  } catch (e) {
    // Silently fail if env is not accessible
  }
  return undefined;
};

// 1. Try to get keys from environment variables
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export interface HighScoreEntry {
  id?: number;
  name: string;
  score: number;
  year: number;
  created_at?: string;
}

export const fetchGlobalScores = async (): Promise<HighScoreEntry[]> => {
  if (!supabase) return [];
  
  try {
      const { data, error } = await supabase
        .from('highscores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10); 

      if (error) {
        console.error('Error fetching scores:', error.message);
        return [];
      }
      return (data || []) as HighScoreEntry[];
  } catch (e) {
      console.error("Network error fetching scores:", e);
      return [];
  }
};

export const submitGlobalScore = async (entry: HighScoreEntry) => {
  if (!supabase) return null;

  try {
      // Must chain .select() to return the inserted data
      const { data, error } = await supabase
        .from('highscores')
        .insert([
          { 
            name: entry.name, 
            score: entry.score, 
            year: entry.year 
          }
        ])
        .select(); 

      if (error) {
        console.error('Supabase Error:', error.message, error.details || '', error.hint || '');
        return null;
      }
      return data;
  } catch (e) {
      console.error("Network error submitting score:", e);
      return null;
  }
};
