-- ============================================
-- DevDex (Project Pokedex) - Complete SQL Setup
-- Copy và paste toàn bộ file này vào Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('dApp', 'Tool', 'Web', 'Library', 'Other')),
    status TEXT NOT NULL CHECK (status IN ('Active', 'Paused', 'Archived', 'Idea')),
    
    -- Content
    summary_human TEXT,
    
    -- AI Generated Fields
    one_liner_ai TEXT,
    description_ai TEXT,
    features_ai TEXT[] DEFAULT '{}',
    stack_ai TEXT[] DEFAULT '{}',
    chains_ai TEXT[] DEFAULT '{}',
    target_users_ai TEXT[] DEFAULT '{}',
    tags_ai TEXT[] DEFAULT '{}',
    
    -- Actionable & Memory
    run_commands_ai TEXT[] DEFAULT '{}',
    deploy_status_ai TEXT CHECK (deploy_status_ai IN ('production', 'testnet', 'local', 'unknown')),
    key_decisions_ai TEXT[] DEFAULT '{}',
    lessons_learned TEXT[] DEFAULT '{}',
    next_steps TEXT,
    
    -- Links
    demo_url TEXT,
    repo_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_touched_at TIMESTAMPTZ DEFAULT NOW(),
    confidence_score NUMERIC(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    ai_updated_at TIMESTAMPTZ
);

-- ============================================
-- 2. PROJECT FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL, -- Storage path
    bucket TEXT NOT NULL DEFAULT 'project-files',
    kind TEXT NOT NULL CHECK (kind IN ('readme', 'docs', 'config', 'image')),
    size BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. AI JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_ids UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done', 'error')),
    model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_project_id ON ai_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see/edit their own projects
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = owner_id);

-- Policies for project_files
CREATE POLICY "Users can view files of their projects"
    ON project_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_files.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert files to their projects"
    ON project_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_files.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- Policies for ai_jobs
CREATE POLICY "Users can view jobs of their projects"
    ON ai_jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = ai_jobs.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- ============================================
-- 6. TRIGGER FUNCTIONS
-- ============================================

-- Function to update last_touched_at
CREATE OR REPLACE FUNCTION update_last_touched_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_touched_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update last_touched_at on project update
CREATE TRIGGER update_projects_last_touched
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_last_touched_at();

-- Function to update ai_jobs updated_at
CREATE OR REPLACE FUNCTION update_ai_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on ai_jobs update
CREATE TRIGGER update_ai_jobs_updated_at
    BEFORE UPDATE ON ai_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_jobs_updated_at();

-- ============================================
-- 7. ENABLE REALTIME (Optional - for subscriptions)
-- ============================================
-- Realtime is enabled by default in Supabase
-- Make sure it's enabled in Dashboard: Settings > API > Realtime

-- ============================================
-- HOÀN TẤT!
-- ============================================
-- Sau khi chạy SQL này:
-- 1. Tạo Storage Bucket tên "project-files" trong Dashboard > Storage
-- 2. Deploy Edge Function (xem SUPABASE_SETUP.md)
-- 3. Cấu hình Webhook trong Dashboard > Database > Webhooks
-- ============================================

