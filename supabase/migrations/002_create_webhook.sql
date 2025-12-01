-- Database Webhook to trigger Edge Function on project_files INSERT
-- This creates a function that will be called via pg_net extension

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to call Edge Function when a new file is uploaded
CREATE OR REPLACE FUNCTION trigger_analyze_project()
RETURNS TRIGGER AS $$
DECLARE
    edge_function_url TEXT;
BEGIN
    -- Get the Edge Function URL from environment or use default
    -- Replace with your actual Supabase project URL
    edge_function_url := current_setting('app.settings.edge_function_url', true);
    
    IF edge_function_url IS NULL OR edge_function_url = '' THEN
        -- Default pattern: https://<project-ref>.supabase.co/functions/v1/analyze-project
        -- You'll need to set this via: ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://your-project.supabase.co/functions/v1/analyze-project';
        RAISE WARNING 'Edge function URL not configured. Set app.settings.edge_function_url';
        RETURN NEW;
    END IF;

    -- Call the Edge Function asynchronously
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'project_id', NEW.project_id,
            'file_ids', ARRAY[NEW.id]::text[]
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Call Edge Function when a file is inserted
CREATE TRIGGER on_project_file_inserted
    AFTER INSERT ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION trigger_analyze_project();

-- Alternative: Use Supabase Database Webhooks (recommended)
-- Instead of pg_net, you can configure this in Supabase Dashboard:
-- 1. Go to Database > Webhooks
-- 2. Create new webhook
-- 3. Table: project_files
-- 4. Events: INSERT
-- 5. HTTP Request: POST to https://<project-ref>.supabase.co/functions/v1/analyze-project
-- 6. HTTP Headers: { "Authorization": "Bearer <service_role_key>" }

