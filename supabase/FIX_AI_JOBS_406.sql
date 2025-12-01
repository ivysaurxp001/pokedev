-- ============================================
-- FIX LỖI 406 KHI QUERY AI_JOBS
-- ============================================
-- Chạy script này để fix lỗi 406 Not Acceptable

-- 1. Kiểm tra RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'ai_jobs';

-- 2. Xem policies hiện tại
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'ai_jobs';

-- 3. Drop tất cả policies cũ trên ai_jobs
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ai_jobs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ai_jobs';
    END LOOP;
END $$;

-- 4. Tạo lại policy cho phép tất cả operations
CREATE POLICY "Allow all on ai_jobs"
    ON ai_jobs FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. HOẶC: Tắt RLS hoàn toàn (nếu vẫn lỗi)
-- ALTER TABLE ai_jobs DISABLE ROW LEVEL SECURITY;

-- 6. Kiểm tra lại
SELECT 
    tablename, 
    rowsecurity,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'ai_jobs';

SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'ai_jobs';

