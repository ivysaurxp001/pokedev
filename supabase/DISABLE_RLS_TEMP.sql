-- ============================================
-- TẮT RLS TẠM THỜI ĐỂ TEST
-- ============================================
-- Chạy script này để TẮT RLS và test xem có work không
-- Nếu work, vấn đề là ở policies
-- Nếu không work, vấn đề là ở constraint/trigger khác
-- ============================================

-- Tắt RLS hoàn toàn (chỉ cho development!)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs DISABLE ROW LEVEL SECURITY;

-- Kiểm tra kết quả
SELECT 
    tablename, 
    rowsecurity,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'project_files', 'ai_jobs');

-- Nếu muốn bật lại RLS với policies đúng:
-- Chạy file RESET_AND_SETUP.sql phần policies

