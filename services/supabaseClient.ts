
import { createClient } from '@supabase/supabase-js';

// Robust retrieval of environment variables
// 1. Try standard Vite import.meta.env
// 2. Fallback to process.env (injected via vite.config.ts)

let url = "";
let key = "";

try {
    // @ts-ignore
    url = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    key = import.meta.env.VITE_SUPABASE_ANON_KEY;
} catch (e) {
    // import.meta access failed
}

// Fallback if import.meta didn't work or returned empty
if (!url && typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    url = process.env.VITE_SUPABASE_URL;
    // @ts-ignore
    key = process.env.VITE_SUPABASE_ANON_KEY;
}

if (!url || !key) {
    console.warn("Bio Sims: Supabase keys not found. Highscores will be in Offline/Local Mode.");
} else {
    console.log("Bio Sims: Connected to Global Highscore Database.");
}

export const supabase = (url && key) 
  ? createClient(url, key) 
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
