/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    // Note: VITE_GEMINI_API_KEY is no longer needed in frontend
    // All Gemini API calls are now routed through Supabase Edge Functions
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
