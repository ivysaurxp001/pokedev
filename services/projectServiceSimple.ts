// Simple Supabase Implementation - No Edge Functions, No Webhooks
// Chạy analysis trực tiếp ở client side
import { supabase } from '../lib/supabase';
import { Project, ProjectFile, ProjectType, ProjectStatus } from '../types';
import { analyzeProject, createOracleChat } from './geminiService';

const STORAGE_BUCKET = 'project-files';

// ============================================
// DATA ACCESS LAYER
// ============================================

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

// ============================================
// FILE UPLOAD & ANALYSIS (CLIENT SIDE)
// ============================================

export const uploadFiles = async (files: File[], projectId: string): Promise<ProjectFile[]> => {
  const uploadedFiles: ProjectFile[] = [];

  for (const file of files) {
    // Read file content
    const content = await file.text();

    // Determine file kind
    const fileName = file.name.toLowerCase();
    let kind: ProjectFile['kind'] = 'config';
    if (fileName.includes('readme')) kind = 'readme';
    else if (fileName.includes('.md') || fileName.includes('doc')) kind = 'docs';
    else if (fileName.match(/\.(png|jpg|jpeg|gif|svg)$/)) kind = 'image';

    // Option 1: Lưu vào Storage (nếu muốn)
    let filePath: string | null = null;
    try {
      const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (!uploadError) {
        filePath = path;
      }
    } catch (err) {
      console.warn('Storage upload failed, saving content in DB only:', err);
    }

    // Create database record (lưu content trực tiếp trong DB)
    const projectFile: Omit<ProjectFile, 'id' | 'created_at'> = {
      project_id: projectId,
      name: file.name,
      path: filePath || `${projectId}/${file.name}`,
      bucket: STORAGE_BUCKET,
      kind,
      size: file.size,
      content: content, // Lưu content trong DB
    };

    const { data: dbFile, error: dbError } = await supabase
      .from('project_files')
      .insert(projectFile)
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create file record:', dbError);
      throw new Error(`Failed to create file record: ${dbError.message}`);
    }

    uploadedFiles.push(dbFile);
  }

  return uploadedFiles;
};

// ============================================
// ANALYSIS (CHẠY TRỰC TIẾP Ở CLIENT)
// ============================================

export const runAnalysis = async (projectId: string, fileIds: string[]): Promise<void> => {
  try {
    // 1. Get files
    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .in('id', fileIds);

    if (filesError || !files || files.length === 0) {
      throw new Error('Files not found');
    }

    // 2. Prepare file contexts (dùng content từ DB hoặc download từ Storage)
    const fileContexts = await Promise.all(
      files.map(async (f) => {
        let content = f.content || '';
        
        // Nếu không có content trong DB, thử download từ Storage
        if (!content && f.path) {
          try {
            const { data, error } = await supabase.storage
              .from(f.bucket)
              .download(f.path);
            
            if (!error && data) {
              content = await data.text();
            }
          } catch (err) {
            console.warn(`Could not download ${f.name} from storage:`, err);
          }
        }

        return {
          name: f.name,
          content: content,
        };
      })
    );

    // 3. Run analysis (client side)
    const analysis = await analyzeProject(fileContexts);

    // 4. Update project với kết quả
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (project) {
      await supabase
        .from('projects')
        .update({
          one_liner_ai: analysis.one_liner,
          description_ai: analysis.description,
          features_ai: analysis.main_features,
          stack_ai: analysis.tech_stack,
          chains_ai: analysis.chains,
          target_users_ai: analysis.target_users,
          tags_ai: analysis.tags,
          confidence_score: analysis.confidence_score,
          run_commands_ai: analysis.run_commands || [],
          key_decisions_ai: analysis.key_decisions || [],
          deploy_status_ai: analysis.deploy_status as any || 'unknown',
          ai_updated_at: new Date().toISOString(),
          last_touched_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    }
  } catch (error: any) {
    console.error('Analysis failed:', error);
    throw error;
  }
};

// ============================================
// GET PROJECT FILES
// ============================================

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

// Get file content (from DB or Storage)
export const getFileContent = async (file: ProjectFile): Promise<string> => {
  // First try to get from DB
  if (file.content) {
    return file.content;
  }

  // Otherwise download from Storage
  const { data, error } = await supabase.storage
    .from(file.bucket)
    .download(file.path);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  return await data.text();
};

// Re-export for Oracle Chat
export { createOracleChat };

