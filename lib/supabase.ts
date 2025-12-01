// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import { Project, ProjectFile, AIJob } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Type-safe database types (matching our schema)
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'last_touched_at'> & {
          id?: string;
          created_at?: string;
          last_touched_at?: string;
        };
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      project_files: {
        Row: ProjectFile;
        Insert: Omit<ProjectFile, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ProjectFile, 'id' | 'created_at'>>;
      };
      ai_jobs: {
        Row: AIJob;
        Insert: Omit<AIJob, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AIJob, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};

