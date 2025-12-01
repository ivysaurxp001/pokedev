-- ============================================
-- SETUP ĐƠN GIẢN - CHỈ CẦN URL + ANON KEY
-- ============================================
-- Không dùng webhook, không tự động hóa
-- Chạy analysis ở client side
-- ============================================

-- Xóa hết cũ (nếu có)
DROP TABLE IF EXISTS ai_jobs CASCADE;
DROP TABLE IF EXISTS project_files CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

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
    content TEXT, -- Lưu content trực tiếp trong DB (đơn giản hơn)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);

-- ============================================
-- 4. RLS - TẮT HOÀN TOÀN (DEVELOPMENT)
-- ============================================
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. STORAGE POLICIES (Nếu dùng Storage)
-- ============================================
-- Drop existing storage policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (policyname LIKE '%project%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- Allow public access to project-files bucket
CREATE POLICY "project-files-public-all"
    ON storage.objects FOR ALL
    USING (bucket_id = 'project-files')
    WITH CHECK (bucket_id = 'project-files');

-- ============================================
-- HOÀN TẤT!
-- ============================================
-- ✅ Chỉ cần:
-- 1. Supabase URL
-- 2. Anon Key
-- 3. Tạo bucket "project-files" trong Dashboard > Storage
-- ============================================

