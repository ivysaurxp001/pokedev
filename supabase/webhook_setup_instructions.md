# Hướng dẫn cấu hình Webhook trong Supabase Dashboard

Sau khi chạy SQL setup, bạn cần cấu hình Webhook để tự động trigger Edge Function khi có file mới được upload.

## Cách 1: Sử dụng Supabase Dashboard Webhooks (Khuyến nghị)

1. Vào **Supabase Dashboard** > **Database** > **Webhooks**
2. Click **Create a new webhook**
3. Điền thông tin:

   **Name:** `trigger_analyze_project`

   **Table:** `project_files`

   **Events:** Chọn **INSERT** (bỏ chọn UPDATE, DELETE)

   **Type:** `HTTP Request`

   **Method:** `POST`

   **URL:** 
   ```
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/analyze-project
   ```
   (Thay `YOUR-PROJECT-REF` bằng project reference của bạn)

   **HTTP Headers:**
   ```json
   {
     "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
     "Content-Type": "application/json"
   }
   ```
   (Lấy Service Role Key từ Settings > API)

   **HTTP Request Body:**
   ```json
   {
     "project_id": "{{ $1.project_id }}",
     "file_ids": ["{{ $1.id }}"]
   }
   ```

4. Click **Save**

## Cách 2: Sử dụng pg_net Extension (Nâng cao)

Nếu muốn dùng SQL trigger thay vì Dashboard webhook, chạy SQL sau:

```sql
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to call Edge Function
CREATE OR REPLACE FUNCTION trigger_analyze_project()
RETURNS TRIGGER AS $$
DECLARE
    edge_function_url TEXT;
    service_role_key TEXT;
BEGIN
    -- Lấy URL và key từ environment (set trong Dashboard > Settings > Database)
    edge_function_url := current_setting('app.settings.edge_function_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    IF edge_function_url IS NULL OR edge_function_url = '' THEN
        RAISE WARNING 'Edge function URL not configured';
        RETURN NEW;
    END IF;

    -- Gọi Edge Function
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
            'project_id', NEW.project_id,
            'file_ids', ARRAY[NEW.id]::text[]
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo trigger
CREATE TRIGGER on_project_file_inserted
    AFTER INSERT ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION trigger_analyze_project();
```

**Lưu ý:** Cách này yêu cầu set environment variables trong Database settings, phức tạp hơn. Nên dùng Cách 1.

