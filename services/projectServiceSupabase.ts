// Real Supabase Implementation (replaces projectService.ts mocks)
import { supabase } from '../lib/supabase';
import { Project, ProjectFile, AIJob, ProjectType, ProjectStatus } from '../types';

const STORAGE_BUCKET = 'project-files';
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-project`;

// --- DATA ACCESS LAYER (Real Supabase) ---

export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('last_touched_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data || [];
};

export const saveProject = async (project: Project): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .upsert(project, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving project:', error);
    throw error;
  }

  return data;
};

export const getJob = async (jobId: string): Promise<AIJob | null> => {
  const { data, error } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }

  return data;
};

export const saveJob = async (job: AIJob): Promise<AIJob> => {
  const { data, error } = await supabase
    .from('ai_jobs')
    .upsert(job, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving job:', error);
    throw error;
  }

  return data;
};

export const createEmptyProject = (): Project => ({
  id: crypto.randomUUID(),
  name: '',
  type: ProjectType.WEB,
  status: ProjectStatus.IDEA,
  features_ai: [],
  stack_ai: [],
  chains_ai: [],
  target_users_ai: [],
  tags_ai: [],
  run_commands_ai: [],
  key_decisions_ai: [],
  created_at: new Date().toISOString(),
  last_touched_at: new Date().toISOString(),
});

// --- REAL SUPABASE STORAGE & WORKFLOW ---

/**
 * 1. Upload Multiple Files to Supabase Storage
 */
export const uploadFiles = async (files: File[], projectId: string): Promise<ProjectFile[]> => {
  const uploadedFiles: ProjectFile[] = [];

  for (const file of files) {
    const filePath = `${projectId}/${crypto.randomUUID()}-${file.name}`;

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error(`Failed to upload ${file.name}:`, uploadError);
      throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
    }

    // Determine file kind
    const fileName = file.name.toLowerCase();
    let kind: ProjectFile['kind'] = 'config';
    if (fileName.includes('readme')) kind = 'readme';
    else if (fileName.includes('.md') || fileName.includes('doc')) kind = 'docs';
    else if (fileName.match(/\.(png|jpg|jpeg|gif|svg)$/)) kind = 'image';

    // Create database record
    const projectFile: Omit<ProjectFile, 'id' | 'created_at'> = {
      project_id: projectId,
      name: file.name,
      path: filePath,
      bucket: STORAGE_BUCKET,
      kind,
      size: file.size,
    };

    const { data: dbFile, error: dbError } = await supabase
      .from('project_files')
      .insert(projectFile)
      .select()
      .single();

    if (dbError) {
      // Cleanup: delete uploaded file if DB insert fails
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      
      // Log full error for debugging
      console.error('Full DB error:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
        error: dbError
      });
      
      // Provide more detailed error message
      if (dbError.code === '23505') {
        throw new Error(`File already exists: ${file.name}. Please try again.`);
      } else if (dbError.code === 'PGRST301' || dbError.message.includes('row-level security') || dbError.message.includes('RLS')) {
        throw new Error(`Permission denied (RLS). Run DISABLE_RLS_TEMP.sql or RESET_AND_SETUP.sql in Supabase SQL Editor.`);
      } else if (dbError.code === '23503' || dbError.message.includes('foreign key') || dbError.message.includes('project_id')) {
        throw new Error(`Project not found in database. Please save the project first before uploading files. Project ID: ${projectId}`);
      } else {
        throw new Error(`Failed to create file record: ${dbError.message} (Code: ${dbError.code || 'unknown'})`);
      }
    }

    uploadedFiles.push(dbFile);
  }

  return uploadedFiles;
};

/**
 * 2. Create Analysis Job (triggers Edge Function via webhook)
 */
export const createAnalysisJob = async (projectId: string, fileIds: string[]): Promise<AIJob> => {
  // Check for existing queued job
  const { data: existingJob, error: queryError } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'queued')
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if no result
  
  if (queryError) {
    console.error('Error querying ai_jobs:', queryError);
    // Continue to create new job if query fails
  }

  let job: AIJob;

  if (existingJob) {
    // Update existing job with new file_ids
    const updatedFileIds = [...new Set([...existingJob.file_ids, ...fileIds])];
    const { data: updatedJob, error } = await supabase
      .from('ai_jobs')
      .update({
        file_ids: updatedFileIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingJob.id)
      .select()
      .single();

    if (error || !updatedJob) {
      throw new Error(`Failed to update job: ${error?.message}`);
    }
    job = updatedJob;
  } else {
    // Create new job
    const { data: newJob, error } = await supabase
      .from('ai_jobs')
      .insert({
        project_id: projectId,
        file_ids: fileIds,
        status: 'queued',
        model: 'gemini-2.5-flash',
      })
      .select()
      .single();

    if (error || !newJob) {
      throw new Error(`Failed to create job: ${error?.message}`);
    }
    job = newJob;
  }

  // Trigger Edge Function manually (webhook should handle this, but we can also call directly)
  // Note: In production, the database webhook will automatically trigger the Edge Function
  // This is a fallback if webhooks aren't configured
  try {
    // Use anon key if no session (for development without auth)
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        project_id,
        file_ids,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Edge function trigger failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      // Don't throw - job is created, Edge Function might be called later via webhook
    } else {
      console.log('Edge function triggered successfully');
    }
  } catch (err) {
    console.warn('Could not trigger edge function manually:', err);
    // Don't throw - job is created, might be processed later
  }

  return job;
};

/**
 * Retry Analysis Job
 */
export const retryAnalysisJob = async (jobId: string): Promise<void> => {
  const job = await getJob(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  // Reset job status
  await supabase
    .from('ai_jobs')
    .update({
      status: 'queued',
      error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  // Re-trigger Edge Function
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        project_id: job.project_id,
        file_ids: job.file_ids,
      }),
    });
  }
};

/**
 * Retrieve project files
 */
export const getProjectFiles = async (projectId: string): Promise<ProjectFile[]> => {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project files:', error);
    return [];
  }

  return data || [];
};

/**
 * Download file content from Storage (for Oracle Chat)
 */
export const getFileContent = async (file: ProjectFile): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(file.bucket)
    .download(file.path);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  return await data.text();
};

/**
 * Subscribe to job status changes (Realtime)
 */
export const subscribeToJob = (
  jobId: string,
  callback: (job: AIJob | null) => void
) => {
  const channel = supabase
    .channel(`ai_job:${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        callback(payload.new as AIJob);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

