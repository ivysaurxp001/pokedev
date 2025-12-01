# 🚀 Quick Start Guide - DevDex Supabase Setup

## ✅ Bước 1: Đã hoàn thành
- [x] SQL Schema đã chạy
- [x] Environment variables đã cấu hình

## 📋 Bước 2: Tạo Storage Bucket (2 phút)

1. Vào: https://supabase.com/dashboard/project/atbonveyhgkgoeuphpfn/storage/buckets
2. Click **New bucket**
3. Name: `project-files`
4. Public: **ON** (hoặc OFF nếu muốn private)
5. Click **Create bucket**

## 📋 Bước 3: Lấy Service Role Key (1 phút)

1. Vào: https://supabase.com/dashboard/project/atbonveyhgkgoeuphpfn/settings/api
2. Tìm **service_role** key (secret)
3. Copy key này (cần cho webhook)

## 📋 Bước 4: Cấu hình Webhook (3 phút)

1. Vào: https://supabase.com/dashboard/project/atbonveyhgkgoeuphpfn/database/webhooks
2. Click **Create a new webhook**
3. Điền:

   **Name:** `trigger_analyze_project`
   
   **Table:** `project_files`
   
   **Events:** ✅ INSERT (chỉ chọn INSERT)
   
   **Type:** HTTP Request
   
   **Method:** POST
   
   **URL:** 
   ```
   https://atbonveyhgkgoeuphpfn.supabase.co/functions/v1/analyze-project
   ```
   
   **HTTP Headers:**
   ```json
   {
     "Authorization": "Bearer PASTE_SERVICE_ROLE_KEY_HERE",
     "Content-Type": "application/json"
   }
   ```
   (Thay `PASTE_SERVICE_ROLE_KEY_HERE` bằng service_role key từ bước 3)
   
   **HTTP Request Body:**
   ```json
   {
     "project_id": "{{ $1.project_id }}",
     "file_ids": ["{{ $1.id }}"]
   }
   ```

4. Click **Save**

## 📋 Bước 5: Deploy Edge Function (5 phút)

### Cài Supabase CLI (Windows):

**Cách 1: Dùng Scoop (Khuyến nghị)**
```powershell
# Cài Scoop nếu chưa có
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Cài Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Cách 2: Dùng Chocolatey**
```powershell
choco install supabase
```

**Cách 3: Download Binary (Nếu không dùng package manager)**
1. Vào: https://github.com/supabase/cli/releases
2. Download file `.exe` cho Windows
3. Đặt vào thư mục trong PATH

**Cách 4: Dùng npx (Không cần cài global)**
```bash
# Chạy trực tiếp với npx (chậm hơn nhưng không cần cài)
npx supabase@latest login
npx supabase@latest link --project-ref atbonveyhgkgoeuphpfn
npx supabase@latest secrets set GEMINI_API_KEY=your_key
npx supabase@latest functions deploy analyze-project
```

### Login và link:
```bash
supabase login
supabase link --project-ref atbonveyhgkgoeuphpfn
```

### Set Gemini API Key:
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### Deploy:
```bash
supabase functions deploy analyze-project
```

## 📋 Bước 6: Cài dependencies và chạy app

```bash
# Cài Supabase client
npm install @supabase/supabase-js

# Chạy dev server
npm run dev
```

## 📋 Bước 7: Switch sang Supabase code

Cập nhật `components/Dashboard.tsx`:

```typescript
// Thay đổi từ:
import { getProjects } from '../services/projectService';

// Thành:
import { getProjects } from '../services/projectServiceSupabase';
```

Và cập nhật function:
```typescript
// Thay đổi từ:
const refreshProjects = () => {
  setProjects(getProjects());
};

// Thành:
const refreshProjects = async () => {
  const projects = await getProjects();
  setProjects(projects);
};
```

Cập nhật `components/ProjectForm.tsx`:
- Đổi import từ `projectService` → `projectServiceSupabase`

Hoặc đơn giản hơn: đổi tên file
- `components/ProjectForm.tsx` → `components/ProjectFormOld.tsx`
- `components/ProjectFormSupabase.tsx` → `components/ProjectForm.tsx`

## 🧪 Test

1. Mở: http://localhost:5173
2. Click **Init New Project**
3. Upload file (README.md)
4. Kiểm tra:
   - File trong Storage
   - Job trong `ai_jobs` table
   - Project được auto-fill với AI data

## ⚠️ Lưu ý quan trọng

- **Service Role Key** là secret, không commit vào git
- File `.env.local` đã có trong `.gitignore`
- Nếu webhook không hoạt động, kiểm tra Service Role Key và URL
- Edge Function cần Gemini API Key để hoạt động

## 🆘 Troubleshooting

**Webhook không trigger?**
- Kiểm tra Service Role Key đúng
- Kiểm tra URL: `https://atbonveyhgkgoeuphpfn.supabase.co/functions/v1/analyze-project`
- Xem logs: Dashboard → Edge Functions → Logs

**Edge Function lỗi?**
- Kiểm tra: `supabase secrets list` (xem GEMINI_API_KEY đã set chưa)
- Xem logs trong Dashboard

**Storage upload fail?**
- Kiểm tra bucket name: `project-files`
- Kiểm tra bucket permissions

