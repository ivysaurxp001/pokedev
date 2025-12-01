# 🔍 Tại Sao Job Bị Kẹt Ở "QUEUED..."

## Vấn đề:
Job được tạo với status "queued" nhưng không chuyển sang "running" hoặc "done".

## Nguyên nhân có thể:

### 1. Edge Function chưa được deploy
- Edge Function `analyze-project` chưa được deploy lên Supabase
- Hoặc Edge Function bị lỗi khi chạy

### 2. Edge Function không được trigger
- Code đang cố trigger nhưng không có session/auth
- Hoặc Edge Function URL không đúng

### 3. Webhook chưa được setup
- Database webhook chưa được cấu hình
- Webhook không hoạt động đúng

## Giải pháp:

### Bước 1: Kiểm tra Edge Function
1. Vào **Supabase Dashboard** → **Edge Functions**
2. Kiểm tra xem có function `analyze-project` không
3. Nếu chưa có, cần deploy:
   ```bash
   supabase functions deploy analyze-project
   ```

### Bước 2: Test Edge Function thủ công
1. Vào **Edge Functions** → **analyze-project** → **Invoke**
2. Test với payload:
   ```json
   {
     "project_id": "your-project-id",
     "file_ids": ["file-id-1", "file-id-2"]
   }
   ```
3. Xem có lỗi gì không

### Bước 3: Kiểm tra Console
1. Mở Developer Tools (F12)
2. Xem tab **Console** và **Network**
3. Tìm request đến Edge Function
4. Xem có lỗi gì không

### Bước 4: Tạm thời - Mock Edge Function
Nếu Edge Function chưa sẵn sàng, có thể:
- Tạo một mock function đơn giản
- Hoặc chạy analysis trực tiếp trong client (không khuyến nghị cho production)

## Code đã được cải thiện:
- ✅ Trigger Edge Function ngay cả khi không có session (dùng anon key)
- ✅ Better error logging
- ✅ Không throw error nếu Edge Function fail (job vẫn được tạo)

## Next Steps:
1. Deploy Edge Function nếu chưa có
2. Test Edge Function thủ công
3. Kiểm tra logs trong Supabase Dashboard
4. Nếu vẫn không work, có thể cần setup webhook hoặc chạy analysis ở client side tạm thời

