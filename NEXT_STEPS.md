# Các bước tiếp theo sau khi setup SQL

## ✅ Đã hoàn thành
- [x] Database schema đã được tạo
- [x] Environment variables đã được cấu hình (`.env.local`)

## 📋 Các bước còn lại

### 1. Tạo Storage Bucket (Bắt buộc)

1. Vào **Supabase Dashboard** → **Storage**
2. Click **New bucket**
3. Điền thông tin:
   - **Name:** `project-files`
   - **Public bucket:** Bật ON (hoặc OFF nếu muốn private)
4. Click **Create bucket**

### 2. Lấy Service Role Key (Cho Webhook)

1. Vào **Settings** → **API**
2. Tìm **service_role** key (secret key - không chia sẻ!)
3. Copy key này để dùng cho Webhook configuration

### 3. Cấu hình Database Webhook

1. Vào **Database** → **Webhooks**
2. Click **Create a new webhook**
3. Điền thông tin:

   **Name:** `trigger_analyze_project`

   **Table:** `project_files`

   **Events:** Chỉ chọn **INSERT** ✅

   **Type:** `HTTP Request`

   **Method:** `POST`

   **URL:** 
   ```
   https://atbonveyhgkgoeuphpfn.supabase.co/functions/v1/analyze-project
   ```

   **HTTP Headers:**
   ```json
   {
     "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
     "Content-Type": "application/json"
   }
   ```
   (Thay `YOUR_SERVICE_ROLE_KEY` bằng service_role key từ bước 2)

   **HTTP Request Body:**
   ```json
   {
     "project_id": "{{ $1.project_id }}",
     "file_ids": ["{{ $1.id }}"]
   }
   ```

4. Click **Save**

### 4. Deploy Edge Function

#### Cài đặt Supabase CLI (nếu chưa có):
```bash
npm install -g supabase
```

#### Login và link project:
```bash
# Login
supabase login

# Link project (project ref: atbonveyhgkgoeuphpfn)
supabase link --project-ref atbonveyhgkgoeuphpfn
```

#### Set Gemini API Key:
```bash
supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key_here
```

#### Deploy function:
```bash
supabase functions deploy analyze-project
```

### 5. Cài đặt dependencies và test

```bash
# Cài đặt Supabase client
npm install @supabase/supabase-js

# Chạy dev server
npm run dev
```

### 6. Switch sang Supabase implementation

Cập nhật import trong `components/ProjectForm.tsx`:

```typescript
// Thay đổi từ:
import { ... } from '../services/projectService';

// Thành:
import { ... } from '../services/projectServiceSupabase';
```

Hoặc đổi tên file:
- `components/ProjectForm.tsx` → `components/ProjectFormOld.tsx` (backup)
- `components/ProjectFormSupabase.tsx` → `components/ProjectForm.tsx`

## 🧪 Test thử

1. Mở app: `http://localhost:5173` (hoặc port của bạn)
2. Tạo project mới
3. Upload file (README.md hoặc package.json)
4. Kiểm tra:
   - File xuất hiện trong Storage bucket
   - `project_files` table có record mới
   - `ai_jobs` table có job với status `queued`
   - Webhook trigger Edge Function
   - Job status chuyển sang `running` rồi `done`
   - Project record được auto-populate với AI analysis

## 🔍 Troubleshooting

### Webhook không trigger?
- Kiểm tra Service Role Key đúng chưa
- Kiểm tra URL Edge Function đúng chưa
- Xem logs trong Dashboard → Edge Functions → Logs

### Edge Function lỗi?
- Kiểm tra GEMINI_API_KEY đã set chưa: `supabase secrets list`
- Xem logs: Dashboard → Edge Functions → analyze-project → Logs

### Storage upload fail?
- Kiểm tra bucket name đúng là `project-files`
- Kiểm tra RLS policies cho bucket (nếu private)

### Realtime không hoạt động?
- Vào Settings → API → Realtime
- Đảm bảo Realtime đã được enable

## 📝 Checklist cuối cùng

- [ ] Storage bucket `project-files` đã tạo
- [ ] Service Role Key đã lấy
- [ ] Database Webhook đã cấu hình
- [ ] Edge Function đã deploy
- [ ] Gemini API Key đã set
- [ ] Dependencies đã cài (`@supabase/supabase-js`)
- [ ] Code đã switch sang `projectServiceSupabase`
- [ ] Test upload file thành công
- [ ] AI analysis hoạt động

