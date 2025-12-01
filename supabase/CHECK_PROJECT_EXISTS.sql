-- ============================================
-- KIỂM TRA PROJECT CÓ TỒN TẠI KHÔNG
-- ============================================
-- Chạy script này để xem có projects nào trong database không

-- Xem tất cả projects
SELECT id, name, type, status, created_at 
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- Đếm số lượng projects
SELECT COUNT(*) as total_projects FROM projects;

-- Xem project_files
SELECT id, project_id, name, path, created_at 
FROM project_files 
ORDER BY created_at DESC 
LIMIT 10;

-- Kiểm tra foreign key constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'project_files';

-- Test insert (thay project_id bằng ID thực tế từ query trên)
-- INSERT INTO project_files (project_id, name, path, bucket, kind, size)
-- VALUES (
--     'YOUR_PROJECT_ID_HERE'::uuid,
--     'test.txt',
--     'test/path.txt',
--     'project-files',
--     'config',
--     100
-- );

