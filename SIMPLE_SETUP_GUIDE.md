# 🚀 Setup Đơn Giản - Chỉ Cần URL + Anon Key

## ✅ Những gì cần:

1. **Supabase URL** (ví dụ: `https://xxxxx.supabase.co`)
2. **Supabase Anon Key**
3. **Gemini API Key** (cho AI analysis)

## 📋 Các Bước Setup:

### Bước 1: Chạy SQL Setup

1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ file `supabase/SIMPLE_SETUP_ONLY.sql`
3. Paste và chạy (RUN)

### Bước 2: Tạo Storage Bucket (Optional)

1. Vào **Storage** → **Buckets**
2. Click **New bucket**
3. Name: `project-files`
4. Public: **ON**
5. Click **Create bucket**

**Lưu ý:** Nếu không tạo bucket, files sẽ chỉ lưu content trong database (vẫn work được).

### Bước 3: Environment Variables

Tạo file `.env.local` (hoặc `.env`) trong project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Bước 4: Update Code

Code đã được update để:
- ✅ Không dùng Edge Function
- ✅ Không dùng webhook
- ✅ Chạy analysis trực tiếp ở client side
- ✅ RLS đã được tắt (development mode)

### Bước 5: Test

1. `npm run dev`
2. Tạo project mới
3. Upload file
4. Analysis sẽ chạy tự động ở client side

## 🔧 Cách Hoạt Động:

1. **Upload file** → Lưu vào database (và Storage nếu có)
2. **Analysis** → Chạy trực tiếp ở browser, gọi Gemini API
3. **Kết quả** → Lưu vào project record

**Không cần:**
- ❌ Edge Function
- ❌ Webhook
- ❌ Database triggers
- ❌ Service role key

## ⚠️ Lưu ý:

- **Gemini API Key** sẽ được expose ở client side (không an toàn cho production)
- Cho production, nên dùng Edge Function để giữ API key bí mật
- Hiện tại setup này phù hợp cho **development/testing**

## 🐛 Troubleshooting:

### Lỗi "Missing Gemini API Key"
→ Kiểm tra `.env.local` có `VITE_GEMINI_API_KEY` chưa

### Lỗi "Failed to upload"
→ Kiểm tra Storage bucket đã được tạo chưa, hoặc để code lưu content trong DB

### Lỗi "Analysis failed"
→ Kiểm tra Gemini API key có đúng không, có quota không

