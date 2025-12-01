// Database Import/Export Service
import { supabase } from '../lib/supabase';
import { Project, ProjectFile } from '../types';

export interface DatabaseExport {
  version: string;
  exportedAt: string;
  projects: Project[];
  projectFiles: ProjectFile[];
}

export const exportDatabase = async (): Promise<DatabaseExport> => {
  try {
    // Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw new Error(`Failed to export projects: ${projectsError.message}`);
    }

    // Get all project files
    const { data: projectFiles, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (filesError) {
      throw new Error(`Failed to export project files: ${filesError.message}`);
    }

    const exportData: DatabaseExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects: projects || [],
      projectFiles: projectFiles || [],
    };

    return exportData;
  } catch (error: any) {
    console.error('Export error:', error);
    throw error;
  }
};

export const exportDatabaseAsJSON = async (): Promise<string> => {
  const data = await exportDatabase();
  return JSON.stringify(data, null, 2);
};

export const exportDatabaseAsFile = async (): Promise<void> => {
  const json = await exportDatabaseAsJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `devdex-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importDatabase = async (
  jsonData: string,
  options: {
    overwriteExisting?: boolean;
    skipDuplicates?: boolean;
  } = {}
): Promise<{ projectsImported: number; filesImported: number; errors: string[] }> => {
  try {
    const data: DatabaseExport = JSON.parse(jsonData);
    const errors: string[] = [];
    let projectsImported = 0;
    let filesImported = 0;

    // Validate data structure
    if (!data.projects || !data.projectFiles) {
      throw new Error('Invalid export format');
    }

    // Import projects
    for (const project of data.projects) {
      try {
        if (options.overwriteExisting) {
          // Upsert (update if exists, insert if not)
          const { error } = await supabase
            .from('projects')
            .upsert(project, { onConflict: 'id' });
          
          if (error) throw error;
          projectsImported++;
        } else {
          // Check if exists
          const { data: existing } = await supabase
            .from('projects')
            .select('id')
            .eq('id', project.id)
            .single();

          if (existing && options.skipDuplicates) {
            // Skip duplicate
            continue;
          }

          if (existing) {
            errors.push(`Project ${project.name} (${project.id}) already exists`);
            continue;
          }

          // Insert new
          const { error } = await supabase
            .from('projects')
            .insert(project);

          if (error) throw error;
          projectsImported++;
        }
      } catch (error: any) {
        errors.push(`Failed to import project ${project.name}: ${error.message}`);
      }
    }

    // Import project files
    for (const file of data.projectFiles) {
      try {
        if (options.overwriteExisting) {
          const { error } = await supabase
            .from('project_files')
            .upsert(file, { onConflict: 'id' });
          
          if (error) throw error;
          filesImported++;
        } else {
          const { data: existing } = await supabase
            .from('project_files')
            .select('id')
            .eq('id', file.id)
            .single();

          if (existing && options.skipDuplicates) {
            continue;
          }

          if (existing) {
            errors.push(`File ${file.name} (${file.id}) already exists`);
            continue;
          }

          const { error } = await supabase
            .from('project_files')
            .insert(file);

          if (error) throw error;
          filesImported++;
        }
      } catch (error: any) {
        errors.push(`Failed to import file ${file.name}: ${error.message}`);
      }
    }

    return {
      projectsImported,
      filesImported,
      errors,
    };
  } catch (error: any) {
    console.error('Import error:', error);
    throw error;
  }
};

export const importDatabaseFromFile = async (
  file: File,
  password: string,
  options?: {
    overwriteExisting?: boolean;
    skipDuplicates?: boolean;
  }
): Promise<{ projectsImported: number; filesImported: number; errors: string[] }> => {
  // Verify password - use admin password or separate import password
  const adminPassword = localStorage.getItem('devdex_admin_password') || 'thoang126';
  const importPassword = localStorage.getItem('devdex_import_password') || adminPassword;
  
  if (password !== importPassword && password !== adminPassword) {
    throw new Error('Mật khẩu import không đúng');
  }

  const text = await file.text();
  return await importDatabase(text, options);
};

