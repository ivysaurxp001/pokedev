# 🔧 Fix Storage Upload Error

## Lỗi hiện tại:
```
StorageApiError: new row violates row-level security policy
POST /rest/v1/project_files 409 (Conflict)
```

## Nguyên nhân:
- Row Level Security (RLS) policies yêu cầu authentication
- Storage bucket chưa có policies để cho phép upload/download

## Giải pháp:

### Bước 1: Chạy Migration SQL (QUAN TRỌNG!)

1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung file `supabase/migrations/003_fix_rls_and_storage.sql`
3. Paste vào SQL Editor và chạy (RUN)
4. **Đảm bảo không có lỗi** - nếu có lỗi, kiểm tra lại

Migration này sẽ:
- ✅ Drop tất cả policies cũ để tránh conflict
- ✅ Cho phép anonymous access cho development
- ✅ Tạo Storage policies để upload/download files
- ✅ Fix RLS cho tất cả tables (projects, project_files, ai_jobs)

**Lưu ý:** Migration đã được cải thiện để tự động drop tất cả policies cũ trước khi tạo mới, tránh conflict.

### Bước 2: Kiểm tra Storage Bucket

1. Vào **Storage** → **Buckets**
2. Đảm bảo có bucket tên `project-files`
3. Nếu chưa có, tạo mới:
   - Name: `project-files`
   - Public: **ON** (hoặc OFF, policies sẽ handle)

### Bước 3: Test lại

1. Refresh trang web
2. Thử upload file lại
3. Nếu vẫn lỗi, kiểm tra:
   - Bucket đã được tạo chưa?
   - Migration SQL đã chạy thành công chưa?

## Lưu ý:

⚠️ **Cho Production:**
- Policies hiện tại cho phép anonymous access (không an toàn)
- Nên implement authentication và update policies để check `auth.uid()`
- Xem file `supabase/migrations/001_initial_schema.sql` để biết policies an toàn hơn

## Nếu vẫn lỗi:

1. Kiểm tra console browser để xem lỗi chi tiết
2. Kiểm tra Supabase Dashboard → Logs để xem lỗi server
3. Đảm bảo environment variables đã được set đúng:
   ```env
   VITE_SUPABASE_URL=https://atbonveyhgkgoeuphpfn.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

