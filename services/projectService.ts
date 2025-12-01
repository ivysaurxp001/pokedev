import { Project, ProjectStatus, ProjectType, ProjectFile, AIJob, AIAnalysisResult } from "../types";
import { analyzeProject } from "./geminiService";

const STORAGE_KEY_PROJECTS = 'project_pokedex_projects';
const STORAGE_KEY_JOBS = 'project_pokedex_jobs';
const STORAGE_KEY_FILES = 'project_pokedex_files';

// --- DATA ACCESS LAYER (Mocking Supabase) ---

export const getProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEY_PROJECTS);
  return data ? JSON.parse(data) : [];
};

export const saveProject = (project: Project): void => {
  const projects = getProjects();
  const existingIndex = projects.findIndex((p) => p.id === project.id);
  
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
};

export const getJob = (jobId: string): AIJob | undefined => {
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEY_JOBS) || '[]');
    return jobs.find((j: AIJob) => j.id === jobId);
};

export const saveJob = (job: AIJob): void => {
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEY_JOBS) || '[]');
    const idx = jobs.findIndex((j: AIJob) => j.id === job.id);
    if (idx >= 0) jobs[idx] = job;
    else jobs.push(job);
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
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

// --- MOCK SUPABASE EDGE FUNCTION / ASYNC WORKFLOW ---

/**
 * 1. Upload Multiple Files (Mocks Storage)
 */
export const uploadFilesMock = async (files: File[], projectId: string): Promise<ProjectFile[]> => {
    const uploadedFiles: ProjectFile[] = [];
    
    for (const file of files) {
        await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const projectFile: ProjectFile = {
                    id: crypto.randomUUID(),
                    project_id: projectId,
                    name: file.name,
                    path: `${projectId}/${file.name}`,
                    bucket: 'project-files',
                    kind: file.name.toLowerCase().includes('readme') ? 'readme' : 'config',
                    size: file.size,
                    content: content, 
                    created_at: new Date().toISOString()
                };
                
                // Save file metadata
                const storedFiles = JSON.parse(localStorage.getItem(STORAGE_KEY_FILES) || '[]');
                storedFiles.push(projectFile);
                localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(storedFiles));
                
                uploadedFiles.push(projectFile);
                resolve();
            };
            reader.readAsText(file);
        });
    }
    return uploadedFiles;
};

/**
 * 2. Create Job (Mocks Database Trigger)
 */
export const createAnalysisJobMock = async (projectId: string, fileIds: string[]): Promise<AIJob> => {
    const job: AIJob = {
        id: crypto.randomUUID(),
        project_id: projectId,
        file_ids: fileIds, // Array of file IDs
        status: 'queued',
        model: 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    saveJob(job);
    
    // Simulate Async Trigger
    setTimeout(() => simulateEdgeFunction(job.id, fileIds), 1000);
    
    return job;
};

/**
 * Retry Logic (Reset job to Queued and re-trigger)
 */
export const retryAnalysisJobMock = async (jobId: string): Promise<void> => {
    const job = getJob(jobId);
    if (!job) return;

    // Reset status
    job.status = 'queued';
    job.error = undefined;
    job.updated_at = new Date().toISOString();
    saveJob(job);

    // Re-trigger simulation
    setTimeout(() => simulateEdgeFunction(job.id, job.file_ids), 1000);
};

/**
 * 3. Simulate Edge Function Processing (Multi-file)
 */
const simulateEdgeFunction = async (jobId: string, fileIds: string[]) => {
    // A. Set status to Running
    let job = getJob(jobId);
    if (!job) return;
    job.status = 'running';
    job.updated_at = new Date().toISOString();
    saveJob(job);

    try {
        // B. Get Files Content
        const allFiles = JSON.parse(localStorage.getItem(STORAGE_KEY_FILES) || '[]');
        const targetFiles = allFiles.filter((f: ProjectFile) => fileIds.includes(f.id));
        
        if (targetFiles.length === 0) throw new Error("Files not found in storage");

        // Prepare context
        const fileContexts = targetFiles.map((f: ProjectFile) => ({
            name: f.name,
            content: f.content || ''
        }));

        // C. Call AI Service (Real Gemini Call)
        const analysis = await analyzeProject(fileContexts);

        // D. Update Job to Done
        job = getJob(jobId)!;
        job.status = 'done';
        job.result = analysis;
        job.updated_at = new Date().toISOString();
        saveJob(job);
        
        // E. Auto-fill Project Record
        const projects = getProjects();
        const projectIdx = projects.findIndex(p => p.id === job!.project_id);
        if (projectIdx >= 0) {
            const p = projects[projectIdx];
            
            // Intelligent Name Naming: If name is empty/default, try to use package.json name or readme title
            if (!p.name || p.name === 'New Project' || p.name === '') {
                 // Simple logic: use first file name without extension if analysis doesn't give a good name
                 // Ideally AI gives us a name, but our schema doesn't ask for it specifically yet.
                 // We can infer from the first file.
                 p.name = targetFiles[0].name.split('.')[0]; 
            }

            p.one_liner_ai = analysis.one_liner;
            p.description_ai = analysis.description;
            p.features_ai = analysis.main_features;
            p.stack_ai = analysis.tech_stack;
            p.chains_ai = analysis.chains;
            p.target_users_ai = analysis.target_users;
            p.tags_ai = analysis.tags;
            p.confidence_score = analysis.confidence_score;
            p.run_commands_ai = analysis.run_commands || [];
            p.key_decisions_ai = analysis.key_decisions || [];
            if (analysis.deploy_status) p.deploy_status_ai = analysis.deploy_status as any;
            
            p.ai_updated_at = new Date().toISOString();
            
            saveProject(p);
        }

    } catch (err: any) {
        console.error(err);
        job = getJob(jobId)!;
        job.status = 'error';
        job.error = err.message || "Unknown error";
        job.updated_at = new Date().toISOString();
        saveJob(job);
    }
};

/**
 * Retrieve file contents for Oracle Chat
 */
export const getProjectFiles = (projectId: string) => {
    const allFiles = JSON.parse(localStorage.getItem(STORAGE_KEY_FILES) || '[]');
    return allFiles.filter((f: ProjectFile) => f.project_id === projectId);
}