-- ============================================
-- RESET VÀ SETUP LẠI TỪ ĐẦU
-- ============================================
-- File này sẽ XÓA HẾT và tạo lại từ đầu
-- Copy toàn bộ file này vào Supabase SQL Editor và chạy
-- ============================================

-- ============================================
-- BƯỚC 1: XÓA HẾT TẤT CẢ
-- ============================================

-- Drop all triggers
DROP TRIGGER IF EXISTS update_projects_last_touched ON projects;
DROP TRIGGER IF EXISTS update_ai_jobs_updated_at ON ai_jobs;

-- Drop all functions
DROP FUNCTION IF EXISTS update_last_touched_at();
DROP FUNCTION IF EXISTS update_ai_jobs_updated_at();

-- Drop all policies (using DO block to handle all)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on projects
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON projects';
    END LOOP;
    
    -- Drop all policies on project_files
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'project_files') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON project_files';
    END LOOP;
    
    -- Drop all policies on ai_jobs
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ai_jobs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ai_jobs';
    END LOOP;
    
    -- Drop storage policies for project-files
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (policyname LIKE '%project-files%' OR policyname LIKE '%project_files%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- Drop tables (cascade sẽ xóa foreign keys)
DROP TABLE IF EXISTS ai_jobs CASCADE;
DROP TABLE IF EXISTS project_files CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================
-- BƯỚC 2: TẠO LẠI TỪ ĐẦU
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
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
CREATE TABLE project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    bucket TEXT NOT NULL DEFAULT 'project-files',
    kind TEXT NOT NULL CHECK (kind IN ('readme', 'docs', 'config', 'image')),
    size BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. AI JOBS TABLE
-- ============================================
CREATE TABLE ai_jobs (
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
-- 4. INDEXES
-- ============================================
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_ai_jobs_project_id ON ai_jobs(project_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS nhưng cho phép anonymous access (development mode)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

-- Policies: Cho phép TẤT CẢ operations (development mode)
-- ⚠️ LƯU Ý: Cho production, nên thay bằng policies có authentication

CREATE POLICY "Allow all on projects"
    ON projects FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all on project_files"
    ON project_files FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all on ai_jobs"
    ON ai_jobs FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 6. TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Update last_touched_at
CREATE FUNCTION update_last_touched_at()
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

-- Function: Update ai_jobs updated_at
CREATE FUNCTION update_ai_jobs_updated_at()
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
-- 7. STORAGE BUCKET POLICIES
-- ============================================
-- ⚠️ QUAN TRỌNG: Đảm bảo bucket "project-files" đã được tạo trong Dashboard > Storage

-- Drop existing storage policies for project-files
-- Note: We drop all policies on storage.objects and recreate only what we need
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on storage.objects that might be related to project-files
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (
            policyname LIKE '%project%' 
            OR policyname LIKE '%project-files%'
            OR policyname LIKE '%project_files%'
        )
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- Allow public read
CREATE POLICY "project-files-public-read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'project-files');

-- Allow public upload
CREATE POLICY "project-files-public-upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'project-files');

-- Allow public update
CREATE POLICY "project-files-public-update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'project-files')
    WITH CHECK (bucket_id = 'project-files');

-- Allow public delete
CREATE POLICY "project-files-public-delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'project-files');

-- ============================================
-- HOÀN TẤT!
-- ============================================
-- ✅ Database đã được reset và setup lại từ đầu
-- ✅ Tất cả policies cho phép anonymous access (development mode)
-- ✅ Storage policies đã được tạo
--
-- BƯỚC TIẾP THEO:
-- 1. Tạo Storage Bucket "project-files" trong Dashboard > Storage (nếu chưa có)
-- 2. Test upload file trong app
-- ============================================

