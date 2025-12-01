export enum ProjectType {
  DAPP = 'dApp',
  TOOL = 'Tool',
  WEB = 'Web',
  LIB = 'Library',
  OTHER = 'Other'
}

export enum ProjectStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  ARCHIVED = 'Archived',
  IDEA = 'Idea'
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface AIAnalysisResult {
  one_liner: string;
  description: string;
  main_features: string[];
  tech_stack: string[];
  chains: string[]; 
  target_users: string[]; 
  tags: string[];
  
  // Actionable Data
  run_commands: string[]; // e.g. "npm run dev", "forge test"
  deploy_status: 'production' | 'testnet' | 'local' | 'unknown';
  
  // Memory
  key_decisions: string[]; // e.g. "Used Supabase for auth due to RLS needs"
  
  confidence_score: number;
  missing_info: string[];
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  path: string; // Storage path
  bucket: string;
  kind: 'readme' | 'docs' | 'config' | 'image';
  size: number;
  content?: string; // Stored locally for mock purposes
  created_at: string;
}

export interface AIJob {
  id: string;
  project_id: string;
  file_ids: string[]; // Changed from single file_id to array
  status: 'queued' | 'running' | 'done' | 'error';
  model: string;
  result?: AIAnalysisResult;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  owner_id?: string; // Auth UID
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  
  // Content
  summary_human?: string; 
  
  // AI Generated Fields
  one_liner_ai?: string;
  description_ai?: string;
  features_ai: string[];
  stack_ai: string[];
  chains_ai: string[]; 
  target_users_ai: string[]; 
  tags_ai: string[];
  
  // Actionable & Memory
  run_commands_ai: string[];
  deploy_status_ai?: 'production' | 'testnet' | 'local' | 'unknown';
  key_decisions_ai: string[];
  lessons_learned?: string[]; // Human entered usually, but AI can suggest
  next_steps?: string; // "Add unit tests", "Deploy to Vercel"

  // Links
  demo_url?: string;
  repo_url?: string;
  
  // Metadata
  created_at: string;
  last_touched_at: string;
  confidence_score?: number; 
  ai_updated_at?: string;
}