# Setup Đơn Giản - Chỉ Cần URL + Anon Key

## ✅ Những gì BẮT BUỘC:

### 1. Database Schema (Đã làm xong)
- Chạy SQL trong `supabase/complete_setup.sql` ✅

### 2. Environment Variables (Đã làm xong)
```env
VITE_SUPABASE_URL=https://atbonveyhgkgoeuphpfn.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```
✅ Đã có trong `.env.local`

### 3. Storage Bucket
- Tạo bucket `project-files` trong Supabase Dashboard
- **Cần thiết** để upload files

### 4. Edge Function (Để chạy AI)
- Deploy Edge Function để phân tích AI
- **Cần thiết** nếu muốn dùng AI analysis

---

## ❌ Những gì KHÔNG BẮT BUỘC:

### Webhook - KHÔNG CẦN!
- Code đã tự động gọi Edge Function từ client
- Webhook chỉ là "nice to have" để tự động hóa
- **Bỏ qua bước này nếu muốn đơn giản**

---

## 🚀 Cách Hoạt Động (Không có Webhook):

1. **User upload file** → Code upload lên Storage
2. **Code tạo job** trong database (`ai_jobs` table)
3. **Code gọi Edge Function trực tiếp** từ browser
4. **Edge Function** phân tích và update job
5. **UI tự động refresh** khi job xong

**Tất cả đều từ client code, không cần webhook!**

---

## 📋 Setup Tối Thiểu:

### Bước 1: Tạo Storage Bucket
```
Dashboard → Storage → New bucket → Name: "project-files"
```

### Bước 2: Deploy Edge Function (Nếu muốn dùng AI)
```bash
# Dùng npx (không cần cài CLI)
npx supabase@latest login
npx supabase@latest link --project-ref atbonveyhgkgoeuphpfn
npx supabase@latest secrets set GEMINI_API_KEY=your_key
npx supabase@latest functions deploy analyze-project
```

### Bước 3: Cài dependencies và chạy
```bash
npm install @supabase/supabase-js
npm run dev
```

### Bước 4: Switch code sang Supabase
- Đổi import trong `components/ProjectForm.tsx`:
  ```typescript
  // Từ:
  import { ... } from '../services/projectService';
  
  // Thành:
  import { ... } from '../services/projectServiceSupabase';
  ```

---

## 🎯 Tóm Lại:

**Cần:**
- ✅ Database schema (đã xong)
- ✅ Environment variables (đã xong)
- ✅ Storage bucket
- ✅ Edge Function (nếu dùng AI)

**KHÔNG cần:**
- ❌ Webhook
- ❌ Service Role Key (chỉ cần cho webhook)
- ❌ Cài Supabase CLI (có thể dùng npx)

---

## 💡 Tại Sao Có Webhook?

Webhook chỉ là để:
- **Tự động trigger** Edge Function khi có file mới
- **Không cần code client** phải gọi Edge Function

Nhưng code đã có sẵn fallback để gọi trực tiếp từ client, nên **webhook là optional**!

---

## 🧪 Test Nhanh:

1. Tạo Storage bucket `project-files`
2. Deploy Edge Function (nếu dùng AI)
3. Switch code sang `projectServiceSupabase`
4. Chạy `npm run dev`
5. Upload file và test!

**Không cần webhook vẫn hoạt động bình thường!** 🎉

