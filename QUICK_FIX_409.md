# 🚨 Quick Fix Lỗi 409 Conflict

## Cách nhanh nhất để fix:

### Bước 1: Tắt RLS tạm thời (để test)

1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy và chạy file `supabase/DISABLE_RLS_TEMP.sql`
3. Script này sẽ **TẮT RLS** hoàn toàn để test

### Bước 2: Test lại

1. Refresh trang web
2. Thử upload file
3. Nếu **WORK** → Vấn đề là ở policies, cần fix policies
4. Nếu **KHÔNG WORK** → Vấn đề là ở constraint/trigger khác

### Bước 3: Nếu tắt RLS mà work

Chạy lại file `supabase/RESET_AND_SETUP.sql` để:
- Bật lại RLS
- Tạo policies đúng (cho phép anonymous access)

### Bước 4: Nếu tắt RLS mà vẫn không work

Có thể do:
1. **Project không tồn tại** - Kiểm tra `project_id` có đúng không
2. **Foreign key constraint** - Project phải được tạo trước
3. **Check constraint** - Kiểm tra `kind` có đúng giá trị không ('readme', 'docs', 'config', 'image')

## Debug thêm:

Chạy file `supabase/DEBUG_AND_FIX.sql` để xem:
- Policies hiện tại
- Constraints
- Indexes
- RLS status

## Lỗi thường gặp:

### 409 Conflict + RLS error
→ Chạy `DISABLE_RLS_TEMP.sql` để tắt RLS

### 409 Conflict + Foreign key error  
→ Đảm bảo project đã được tạo trước khi upload file

### 409 Conflict + Check constraint error
→ Kiểm tra `kind` phải là một trong: 'readme', 'docs', 'config', 'image'

