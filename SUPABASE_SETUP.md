# Supabase Setup Guide for DevDex

This guide will help you migrate from the mock/localStorage implementation to a production Supabase setup.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js installed
- Supabase CLI (optional, for local development)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Note down your:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key (found in Settings > API)
   - Service Role Key (found in Settings > API - keep this secret!)

## Step 2: Run Database Migrations

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the migration files in order:
   - Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the SQL
   - Then run `supabase/migrations/002_create_webhook.sql`

## Step 3: Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it: `project-files`
4. Set it to **Public** (or configure RLS policies if you want private)
5. Click **Create bucket**

## Step 4: Configure Edge Function

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Set Edge Function secrets:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key
   ```

5. Deploy the Edge Function:
   ```bash
   supabase functions deploy analyze-project
   ```

## Step 5: Configure Database Webhook (Alternative to pg_net)

Instead of using the pg_net extension, you can use Supabase's built-in Database Webhooks:

1. Go to **Database** > **Webhooks** in your Supabase dashboard
2. Click **Create a new webhook**
3. Configure:
   - **Name**: `trigger_analyze_project`
   - **Table**: `project_files`
   - **Events**: Select **INSERT**
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-project-ref.supabase.co/functions/v1/analyze-project`
   - **HTTP Headers**:
     ```json
     {
       "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
       "Content-Type": "application/json"
     }
     ```
   - **HTTP Request Body**:
     ```json
     {
       "project_id": "{{ $1.project_id }}",
       "file_ids": ["{{ $1.id }}"]
     }
     ```

## Step 6: Enable Authentication (Optional but Recommended)

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Enable your preferred auth provider (Email, Google, GitHub, etc.)
3. Configure settings as needed

## Step 7: Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

**Important**: Never commit `.env.local` to version control!

## Step 8: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 9: Switch to Supabase Implementation

Update your imports in `components/ProjectForm.tsx`:

```typescript
// Change from:
import { ... } from '../services/projectService';

// To:
import { ... } from '../services/projectServiceSupabase';
```

## Step 10: Test the Migration

1. Start your dev server: `npm run dev`
2. Create a new project
3. Upload a file (README.md or package.json)
4. Verify:
   - File appears in Supabase Storage
   - `project_files` record is created
   - `ai_jobs` record is created with status `queued`
   - Edge Function processes the job
   - Job status updates to `done`
   - Project record is auto-populated with AI analysis

## Troubleshooting

### Edge Function not triggering
- Check that the webhook is configured correctly
- Verify the Edge Function URL is correct
- Check Edge Function logs in Supabase dashboard

### Storage upload fails
- Verify the bucket name is `project-files`
- Check bucket permissions (should be public or have proper RLS)
- Verify RLS policies allow inserts

### Realtime not working
- Ensure Realtime is enabled in Supabase dashboard (Settings > API)
- Check that you're subscribed to the correct channel
- Verify RLS policies allow SELECT on `ai_jobs`

### Authentication issues
- Make sure users are authenticated before accessing projects
- Check RLS policies match your auth setup
- Verify `owner_id` is set correctly when creating projects

## Migration Checklist

- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Storage bucket `project-files` created
- [ ] Edge Function deployed
- [ ] Database webhook configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Code updated to use `projectServiceSupabase`
- [ ] Tested file upload
- [ ] Tested AI analysis
- [ ] Tested realtime updates

## Next Steps

After migration is complete:
1. Remove the old `projectService.ts` mock implementation (or keep as fallback)
2. Update all components to use the new service
3. Add error handling and loading states
4. Consider adding retry logic for failed jobs
5. Add analytics/monitoring for Edge Function performance

