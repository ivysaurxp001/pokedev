# 🔄 Hướng Dẫn Reset và Setup Lại Từ Đầu

## ⚠️ CẢNH BÁO
**File này sẽ XÓA HẾT dữ liệu hiện tại!** Chỉ chạy nếu bạn muốn bắt đầu lại từ đầu.

## 📋 Các Bước

### Bước 1: Chạy SQL Reset
1. Vào **Supabase Dashboard** → **SQL Editor**
2. Mở file `supabase/RESET_AND_SETUP.sql`
3. **Copy TOÀN BỘ** nội dung
4. Paste vào SQL Editor
5. Click **RUN** (hoặc Ctrl+Enter)
6. **Đợi cho đến khi hoàn tất** - có thể mất vài giây

### Bước 2: Kiểm Tra Kết Quả
Sau khi chạy xong, bạn sẽ thấy:
- ✅ Tables đã được tạo: `projects`, `project_files`, `ai_jobs`
- ✅ Policies đã được tạo (cho phép anonymous access)
- ✅ Storage policies đã được tạo

### Bước 3: Tạo Storage Bucket (Nếu Chưa Có)
1. Vào **Storage** → **Buckets**
2. Nếu chưa có bucket `project-files`:
   - Click **New bucket**
   - Name: `project-files`
   - Public: **ON** (hoặc OFF, policies đã handle)
   - Click **Create bucket**

### Bước 4: Test
1. Refresh trang web
2. Tạo project mới
3. Upload file
4. Kiểm tra xem có lỗi không

## ✅ Những Gì Đã Được Setup

### Database Tables:
- ✅ `projects` - Lưu thông tin projects
- ✅ `project_files` - Lưu metadata files
- ✅ `ai_jobs` - Lưu AI analysis jobs

### Policies:
- ✅ Cho phép **anonymous access** (development mode)
- ✅ Tất cả operations: SELECT, INSERT, UPDATE, DELETE
- ✅ Storage policies cho bucket `project-files`

### Triggers:
- ✅ Auto-update `last_touched_at` khi project thay đổi
- ✅ Auto-update `updated_at` khi AI job thay đổi

## 🐛 Nếu Vẫn Có Lỗi

1. **Kiểm tra Storage Bucket:**
   - Đảm bảo bucket `project-files` đã được tạo
   - Kiểm tra trong Dashboard > Storage > Buckets

2. **Kiểm tra Environment Variables:**
   ```env
   VITE_SUPABASE_URL=https://atbonveyhgkgoeuphpfn.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Kiểm tra Console:**
   - Mở Developer Tools (F12)
   - Xem tab Console và Network
   - Copy lỗi và kiểm tra

4. **Kiểm tra SQL Editor:**
   - Xem có lỗi nào khi chạy SQL không
   - Đảm bảo tất cả statements đã chạy thành công

## 📝 Lưu Ý

- ⚠️ **Development Mode:** Policies hiện tại cho phép anonymous access
- 🔒 **Production:** Nên implement authentication và update policies
- 💾 **Backup:** Nếu có dữ liệu quan trọng, backup trước khi reset

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn tất:
- ✅ Upload file không còn lỗi 409 Conflict
- ✅ Upload file không còn lỗi RLS policy
- ✅ Có thể tạo project và upload files thành công
- ✅ Dữ liệu được lưu vào Supabase thay vì localStorage

