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

## 🛠️ Simulated Components (Ready for Migration)

### 1. **Database Service** (`services/projectService.ts`)
- **Current:** Uses `localStorage` to store `projects`, `jobs`, and `files` (base64).
- **Migration:** Replace with `supabase-js` client calls.
    - `uploadFileMock` -> `supabase.storage.from('...').upload(...)`
    - `saveProject` -> `supabase.from('projects').upsert(...)`

### 2. **Edge Function**
- **Current:** `simulateEdgeFunction` runs inside the browser thread asynchronously.
- **Migration:** Move the logic inside `simulateEdgeFunction` (including `analyzeProject`) to a Deno script in `supabase/functions/analyze-project`.

### 3. **Realtime Subscription**
- **Current:** `setInterval` polling in `ProjectForm`.
- **Migration:** Use `supabase.channel('custom-all-channel').on('postgres_changes', ...)` to listen for updates on `ai_jobs`.

---

## 🚀 Migration Checklist (Prototype -> Production)

1.  [ ] **Supabase Setup:** Create Project, enable Auth, create Storage Bucket `project-files`.
2.  [ ] **DB Schema:** Run SQL to create tables matching `types.ts`.
3.  [ ] **Edge Function:** Deploy `analyze-project` function with `geminiService` logic.
4.  [ ] **Webhook:** Create a Database Webhook on `project_files` INSERT to call the Edge Function.
5.  [ ] **Client:** Swap `projectService.ts` mocks with real Supabase client code.