import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, ProjectType } from '../types';
import { getProjects } from '../services/projectServiceSupabase';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import { Search, Filter, Plus, Activity, Layers, Server } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<ProjectType | 'ALL'>('ALL');
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load data
  const refreshProjects = async () => {
    const projects = await getProjects();
    setProjects(projects);
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.one_liner_ai?.toLowerCase().includes(search.toLowerCase()) ||
        p.stack_ai.some(s => s.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesType = filterType === 'ALL' || p.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => 
    new Date(b.last_touched_at).getTime() - new Date(a.last_touched_at).getTime()
  );

  const activeCount = projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
  const ideaCount = projects.filter(p => p.status === ProjectStatus.IDEA).length;

  // Modal Handlers
  const handleSave = () => {
    setIsCreating(false);
    setEditingProject(null);
    refreshProjects();
  };

  return (
    <>
      <div className="space-y-8">
        {/* HUD Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {/* Stat 1 */}
             <div className="bg-slate-900/40 border border-slate-800 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Server size={40} />
                </div>
                <div className="text-slate-500 text-xs font-mono-tech uppercase tracking-widest mb-1">Total Entities</div>
                <div className="text-3xl font-tech font-bold text-white">{projects.length}</div>
                <div className="w-full h-0.5 bg-slate-800 mt-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-cyan-500 w-full"></div>
                </div>
             </div>
             
             {/* Stat 2 */}
             <div className="bg-slate-900/40 border border-slate-800 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Activity size={40} className="text-emerald-500" />
                </div>
                <div className="text-slate-500 text-xs font-mono-tech uppercase tracking-widest mb-1">Active Systems</div>
                <div className="text-3xl font-tech font-bold text-emerald-400">{activeCount}</div>
                <div className="w-full h-0.5 bg-slate-800 mt-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-emerald-500" style={{ width: `${(activeCount/projects.length || 0)*100}%` }}></div>
                </div>
             </div>

             {/* Stat 3 */}
             <div className="bg-slate-900/40 border border-slate-800 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Layers size={40} className="text-violet-500" />
                </div>
                <div className="text-slate-500 text-xs font-mono-tech uppercase tracking-widest mb-1">Concepts/Ideas</div>
                <div className="text-3xl font-tech font-bold text-violet-400">{ideaCount}</div>
                <div className="w-full h-0.5 bg-slate-800 mt-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-violet-500" style={{ width: `${(ideaCount/projects.length || 0)*100}%` }}></div>
                </div>
             </div>
             
              {/* Action */}
             <button 
                onClick={() => setIsCreating(true)}
                className="bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
             >
                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="font-mono-tech text-xs uppercase tracking-widest">Init New Project</span>
             </button>
        </div>

        {/* Console Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity rounded-none pointer-events-none"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="QUERY DATABASE..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 group-focus-within:border-cyan-500/50 rounded-none pl-12 pr-4 py-3 text-slate-200 placeholder-slate-600 outline-none font-mono-tech text-sm transition-all"
            />
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-600 group-focus-within:border-cyan-400 transition-colors"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-600 group-focus-within:border-cyan-400 transition-colors"></div>
          </div>
          
          <div className="flex gap-2">
             <div className="relative min-w-[140px] group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400" size={14} />
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full h-full bg-slate-900/80 border border-slate-800 group-focus-within:border-cyan-500/50 rounded-none pl-9 pr-8 py-3 text-slate-200 font-mono-tech text-xs appearance-none outline-none cursor-pointer"
                >
                    <option value="ALL">STATUS: ALL</option>
                    {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
            </div>
             <div className="relative min-w-[140px] group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400" size={14} />
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full h-full bg-slate-900/80 border border-slate-800 group-focus-within:border-cyan-500/50 rounded-none pl-9 pr-8 py-3 text-slate-200 font-mono-tech text-xs appearance-none outline-none cursor-pointer"
                >
                    <option value="ALL">TYPE: ALL</option>
                    {Object.values(ProjectType).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {sortedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map(project => (
                <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onClick={() => setEditingProject(project)}
                />
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 bg-slate-900/20">
                <div className="text-cyan-900 mb-4 opacity-50">
                    <Server size={64} />
                </div>
                <p className="text-slate-500 font-tech text-lg mb-2">NO RECORDS FOUND</p>
                <p className="text-slate-600 text-sm font-mono-tech mb-6">Database query returned 0 results.</p>
                {projects.length === 0 && (
                    <button onClick={() => setIsCreating(true)} className="text-cyan-400 hover:text-cyan-300 font-mono-tech text-xs border border-cyan-500/30 px-4 py-2 hover:bg-cyan-500/10 transition-colors">
                        INITIALIZE FIRST ENTRY
                    </button>
                )}
            </div>
        )}
      </div>

      {/* Modal Overlay with Portal */}
      {(isCreating || editingProject) && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-200">
                <ProjectForm 
                    initialProject={editingProject || undefined}
                    onClose={() => { setIsCreating(false); setEditingProject(null); }}
                    onSave={handleSave}
                />
            </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Dashboard;