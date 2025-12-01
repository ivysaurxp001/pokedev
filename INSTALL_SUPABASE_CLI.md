# Cài đặt Supabase CLI trên Windows

Supabase CLI **KHÔNG** hỗ trợ `npm install -g`. Dùng một trong các cách sau:

## 🎯 Cách 1: Dùng Scoop (Khuyến nghị - Dễ nhất)

### Bước 1: Cài Scoop (nếu chưa có)
Mở PowerShell và chạy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Bước 2: Cài Supabase CLI
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Bước 3: Kiểm tra
```bash
supabase --version
```

---

## 🎯 Cách 2: Dùng Chocolatey

Nếu bạn đã có Chocolatey:
```powershell
choco install supabase
```

---

## 🎯 Cách 3: Dùng npx (Không cần cài - Chậm hơn)

Bạn có thể dùng `npx` để chạy Supabase CLI mà không cần cài đặt:

```bash
# Login
npx supabase@latest login

# Link project
npx supabase@latest link --project-ref atbonveyhgkgoeuphpfn

# Set secrets
npx supabase@latest secrets set GEMINI_API_KEY=your_key

# Deploy function
npx supabase@latest functions deploy analyze-project
```

**Lưu ý:** Cách này chậm hơn vì phải download mỗi lần chạy, nhưng không cần cài đặt gì.

---

## 🎯 Cách 4: Download Binary trực tiếp

1. Vào: https://github.com/supabase/cli/releases
2. Tìm release mới nhất
3. Download file `.exe` cho Windows (ví dụ: `supabase_windows_amd64.exe`)
4. Đổi tên thành `supabase.exe`
5. Đặt vào thư mục trong PATH (ví dụ: `C:\Windows\System32` hoặc tạo folder riêng và thêm vào PATH)

---

## ✅ Sau khi cài xong

Kiểm tra cài đặt:
```bash
supabase --version
```

Nếu thấy version number → thành công! 🎉

---

## 🚀 Tiếp theo

Sau khi cài xong, tiếp tục với các bước trong `QUICK_START.md`:

```bash
# Login
supabase login

# Link project
supabase link --project-ref atbonveyhgkgoeuphpfn

# Set Gemini API Key
supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# Deploy Edge Function
supabase functions deploy analyze-project
```

