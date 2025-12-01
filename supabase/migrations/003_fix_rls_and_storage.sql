-- ============================================
-- Fix RLS Policies for Anonymous Access (Development)
-- ============================================
-- This migration allows the app to work without authentication
-- For production, you should implement proper authentication

-- Drop ALL existing policies first (to avoid conflicts)
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
END $$;

-- Create policies that allow anonymous access (for development)
-- NOTE: For production, you should require authentication

-- Projects: Allow all operations for now (development mode)
CREATE POLICY "Allow all operations on projects"
    ON projects FOR ALL
    USING (true)
    WITH CHECK (true);

-- Project files: Allow all operations (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow all operations on project_files"
    ON project_files FOR ALL
    USING (true)
    WITH CHECK (true);

-- AI jobs: Allow all operations
CREATE POLICY "Allow all operations on ai_jobs"
    ON ai_jobs FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Storage Bucket Policies
-- ============================================
-- These policies allow upload/download from the project-files bucket
-- Make sure the bucket exists first: Dashboard > Storage > New bucket > "project-files"

-- Drop existing storage policies for project-files bucket
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%project-files%'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- Allow public read access (if bucket is public)
CREATE POLICY "Allow public read access project-files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'project-files');

-- Allow anonymous uploads (for development)
CREATE POLICY "Allow public upload project-files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'project-files');

-- Allow public update
CREATE POLICY "Allow public update project-files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'project-files')
    WITH CHECK (bucket_id = 'project-files');

-- Allow public delete
CREATE POLICY "Allow public delete project-files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'project-files');

-- ============================================
-- NOTES:
-- ============================================
-- 1. These policies allow anonymous access - suitable for development
-- 2. For production, you should:
--    - Require authentication (auth.uid() IS NOT NULL)
--    - Check ownership (owner_id = auth.uid())
--    - Use service role key for server-side operations
-- 3. Make sure Storage bucket "project-files" exists and is created
-- 4. If bucket is public, the read policy above will work
-- 5. If bucket is private, you may need to adjust policies

