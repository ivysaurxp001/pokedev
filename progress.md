# DevDex (Project Pokedex) - Architecture & Progress

## 🏗️ Architecture: Async Event-Driven (Supabase Pattern)

The application has been refactored to simulate a production-grade Supabase architecture.

### **The Flow (Simulated)**
1.  **Storage Upload:** User selects a file -> `uploadFileMock` simulates uploading to a Supabase Storage Bucket and creating a `project_files` record.
2.  **Job Creation:** System triggers `createAnalysisJobMock`, creating an `AIJob` in the database with status `queued`.
3.  **Edge Function (AI):** A background process (simulated via `setTimeout`) picks up the job, downloads the file content, calls Gemini 2.5, and updates the job to `done`.
4.  **Realtime UI:** The Frontend polls the job status (simulating `supabase.channel` subscription) and auto-populates the form when the job completes.

---

## ✅ Real Implementation (Live Logic)

### 1. **AI Analysis Engine** (`services/geminiService.ts`)
- **Gemini 2.5 Flash:** Used for high-speed extraction.
- **Schema:** Extracts structured JSON (One-liner, Stack, Chains, Users, Missing Info).
- **Multi-File Support:** Now accepts multiple files (e.g. README + package.json) to generate a combined context for higher accuracy.
- **Oracle Chat:** Dedicated chat session initialized with project file context for Q&A.

### 2. **Frontend UI**
- **DevDex Theme:** Cyberpunk/Sci-Fi aesthetics with grid backgrounds and HUD.
- **Portal Modals:** Fixed z-index stacking issues for overlays.
- **ProjectForm:** Handles the "Upload -> Queue -> Analyze -> Review" state machine. Now supports **Tabs** for Data Ingestion vs Oracle Chat.
- **ProjectCard:** Displays rich metadata including Chains and Confidence scores with Quick Run actions.

### 3. **Data Model** (`types.ts`)
- Schema matches the planned Postgres tables: `projects`, `project_files`, `ai_jobs`.
- Added `ChatMessage` for Oracle history.

---

## 🛠️ Migration Status

### ✅ **Completed Migration Components**

### 1. **Database Service** (`services/projectServiceSupabase.ts`)
- ✅ **Implemented:** Real Supabase client implementation
    - `uploadFiles` -> `supabase.storage.from('project-files').upload(...)`
    - `saveProject` -> `supabase.from('projects').upsert(...)`
    - `getJob`, `saveJob` -> Real database queries
    - `subscribeToJob` -> Realtime subscriptions via `supabase.channel()`

### 2. **Edge Function** (`supabase/functions/analyze-project/index.ts`)
- ✅ **Implemented:** Deno Edge Function with Gemini AI integration
    - Downloads files from Supabase Storage
    - Calls Gemini 2.5 Flash API
    - Updates `ai_jobs` table with results
    - Auto-populates `projects` table

### 3. **Realtime Subscription** (`components/ProjectFormSupabase.tsx`)
- ✅ **Implemented:** Real Supabase Realtime subscriptions
    - Replaced `setInterval` polling with `subscribeToJob()`
    - Listens to `postgres_changes` on `ai_jobs` table
    - Auto-updates UI when job status changes

### 4. **Database Schema** (`supabase/migrations/001_initial_schema.sql`)
- ✅ **Created:** Complete SQL schema matching `types.ts`
    - Tables: `projects`, `project_files`, `ai_jobs`
    - Row Level Security (RLS) policies
    - Indexes and triggers

### 5. **Database Webhook** (`supabase/migrations/002_create_webhook.sql`)
- ✅ **Created:** Webhook trigger for `project_files` INSERT
    - Triggers Edge Function automatically
    - Alternative: Supabase Dashboard webhook configuration

### 6. **Setup Documentation** (`SUPABASE_SETUP.md`)
- ✅ **Created:** Complete migration guide
    - Step-by-step Supabase setup
    - Environment configuration
    - Testing checklist

---

## 🚀 Migration Checklist (Prototype -> Production)

### Code Implementation ✅ COMPLETE
1.  [x] **DB Schema:** SQL migration files created (`supabase/migrations/001_initial_schema.sql`)
2.  [x] **Edge Function:** Deno function created (`supabase/functions/analyze-project/index.ts`)
3.  [x] **Webhook:** SQL trigger created (`supabase/migrations/002_create_webhook.sql`)
4.  [x] **Client Service:** Real Supabase implementation (`services/projectServiceSupabase.ts`)
5.  [x] **Realtime:** Updated component with subscriptions (`components/ProjectFormSupabase.tsx`)
6.  [x] **Documentation:** Setup guide created (`SUPABASE_SETUP.md`)

### Deployment Steps (Manual - Follow SUPABASE_SETUP.md)
1.  [ ] **Supabase Setup:** Create Project, enable Auth, create Storage Bucket `project-files`.
2.  [ ] **Run Migrations:** Execute SQL files in Supabase SQL Editor.
3.  [ ] **Deploy Edge Function:** Use Supabase CLI to deploy `analyze-project`.
4.  [ ] **Configure Webhook:** Set up Database Webhook in Supabase Dashboard.
5.  [ ] **Environment Variables:** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6.  [ ] **Switch Implementation:** Update imports to use `projectServiceSupabase` instead of `projectService`.

## 📁 New Files Created

- `supabase/migrations/001_initial_schema.sql` - Database schema
- `supabase/migrations/002_create_webhook.sql` - Webhook trigger
- `supabase/functions/analyze-project/index.ts` - Edge Function
- `supabase/functions/analyze-project/deno.json` - Deno config
- `lib/supabase.ts` - Supabase client configuration
- `services/projectServiceSupabase.ts` - Real Supabase service
- `components/ProjectFormSupabase.tsx` - Updated form with Realtime
- `SUPABASE_SETUP.md` - Complete setup guide
- `.env.example` - Environment variables template