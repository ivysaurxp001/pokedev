-- ============================================
-- DEBUG VÀ FIX LỖI 409 CONFLICT
-- ============================================
-- Chạy script này để kiểm tra và fix lỗi
-- ============================================

-- 1. Kiểm tra RLS có được enable không
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'project_files', 'ai_jobs');

-- 2. Kiểm tra policies hiện tại
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('projects', 'project_files', 'ai_jobs')
ORDER BY tablename, policyname;

-- 3. TẠM THỜI DISABLE RLS để test (chỉ cho development!)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs DISABLE ROW LEVEL SECURITY;

-- 4. Kiểm tra constraints trên project_files
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'project_files'::regclass;

-- 5. Kiểm tra indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'project_files';

-- ============================================
-- Nếu vẫn lỗi, thử insert test:
-- ============================================
-- INSERT INTO project_files (project_id, name, path, bucket, kind, size)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000'::uuid,
--     'test.txt',
--     'test/path.txt',
--     'project-files',
--     'config',
--     100
-- );

-- Nếu insert test thành công, vấn đề có thể ở:
-- 1. Path duplicate
-- 2. Code đang gửi data không đúng format
-- 3. Có trigger/function nào đó block

