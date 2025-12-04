
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---

let url = "";
let key = "";

// 1. Try standard Vite import.meta.env (Works in most dev/prod setups)
try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
        // @ts-ignore
        url = import.meta.env.VITE_SUPABASE_URL;
        // @ts-ignore
        key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }
} catch (e) { /* ignore */ }

// 2. Fallback to process.env replacement (Works with the vite.config.ts define we added)
// We access these directly so the bundler can replace the token string
if (!url) {
    try {
        // @ts-ignore
        const pUrl = process.env.VITE_SUPABASE_URL;
        // @ts-ignore
        const pKey = process.env.VITE_SUPABASE_ANON_KEY;
        if (pUrl && pKey) {
            url = pUrl;
            key = pKey;
        }
    } catch (e) { /* ignore */ }
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

// Returns object with success flag and optional error message
export const submitGlobalScore = async (entry: HighScoreEntry): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };

  try {
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
        console.error('Supabase Error:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
  } catch (e: any) {
      console.error("Network error submitting score:", e);
      return { success: false, error: e.message || "Unknown network error" };
  }
};
