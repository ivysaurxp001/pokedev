import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { ExternalLink, Github, Network, Clock, Terminal, Check, Globe, AlertCircle } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const statusStyles: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  [ProjectStatus.PAUSED]: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  [ProjectStatus.ARCHIVED]: 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  [ProjectStatus.IDEA]: 'text-violet-400 border-violet-500/30 bg-violet-500/5',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const [copied, setCopied] = useState(false);
  const stack = project.stack_ai.slice(0, 3);
  const chains = project.chains_ai.slice(0, 2);

  // Confidence color logic
  const confidenceColor = 
    (project.confidence_score || 0) > 0.8 ? 'bg-emerald-500' :
    (project.confidence_score || 0) > 0.5 ? 'bg-amber-500' : 'bg-red-500';

  const deployStatusIcon = () => {
    switch(project.deploy_status_ai) {
        case 'production': return <Globe size={10} className="text-emerald-400" />;
        case 'testnet': return <Globe size={10} className="text-amber-400" />;
        case 'local': return <Terminal size={10} className="text-slate-400" />;
        default: return null;
    }
  };

  const handleCopyCommand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.run_commands_ai && project.run_commands_ai.length > 0) {
        navigator.clipboard.writeText(project.run_commands_ai[0]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 backdrop-blur-sm transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
    >
      {/* Holographic Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-transparent group-hover:to-purple-500/5 transition-all duration-500"></div>
      
      {/* Decorative Corner Markers */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-700 group-hover:border-cyan-400 transition-colors"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-700 group-hover:border-cyan-400 transition-colors"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-700 group-hover:border-cyan-400 transition-colors"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-700 group-hover:border-cyan-400 transition-colors"></div>

      <div className="p-5 flex flex-col h-full relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono-tech font-bold uppercase tracking-wider px-2 py-0.5 border ${statusStyles[project.status]}`}>
                    {project.status}
                </span>
                {project.deploy_status_ai && project.deploy_status_ai !== 'unknown' && (
                    <div className="flex items-center gap-1 border border-slate-800 bg-slate-950 px-1.5 py-0.5" title="Inferred Deployment Status">
                        {deployStatusIcon()}
                        <span className="text-[9px] text-slate-400 font-mono-tech uppercase">{project.deploy_status_ai}</span>
                    </div>
                )}
             </div>
          </div>
          <div className="flex items-center gap-2">
            {project.confidence_score && (
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-1.5 py-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${confidenceColor} animate-pulse`}></div>
                    <span className="text-[9px] text-slate-500 font-mono-tech">{Math.floor(project.confidence_score * 100)}%</span>
                </div>
            )}
             <span className="text-[10px] font-mono-tech text-slate-500 px-2 py-0.5 border border-slate-800 bg-slate-950 uppercase tracking-widest">
                {project.type}
            </span>
          </div>
        </div>

        {/* Content */}
        <h3 className="font-tech text-xl font-bold text-slate-100 group-hover:text-cyan-400 transition-colors mb-2 line-clamp-1 tracking-tight">
          {project.name || "UNNAMED_ENTITY"}
        </h3>

        <p className="text-slate-400 text-sm mb-5 line-clamp-2 min-h-[40px] font-sans leading-relaxed">
          {project.one_liner_ai || project.description_ai || "Awaiting data input for analysis..."}
        </p>

        {/* Tech Specs */}
        <div className="mt-auto space-y-3">
            {stack.length > 0 && (
                 <div className="flex flex-wrap gap-1.5">
                    {stack.map((tech, i) => (
                    <span key={i} className="text-[10px] font-mono-tech px-2 py-1 bg-slate-800/50 text-slate-300 border border-slate-700/50 group-hover:border-slate-600 transition-colors">
                        {tech}
                    </span>
                    ))}
                </div>
            )}
            
            {chains.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                    <Network size={12} className="text-cyan-500"/>
                    <span className="text-xs text-cyan-300/80 font-mono-tech">{chains.join(' // ')}</span>
                </div>
            )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500 font-mono-tech relative z-10 group-hover:bg-slate-900/80 transition-colors">
        <div className="flex items-center gap-2">
            <Clock size={12} />
            <span>{new Date(project.last_touched_at).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Quick Run Button */}
          {project.run_commands_ai && project.run_commands_ai.length > 0 && (
              <button 
                onClick={handleCopyCommand}
                title={project.run_commands_ai[0]}
                className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${copied ? 'text-green-400' : 'text-slate-400 hover:text-cyan-400'}`}
              >
                  {copied ? <Check size={14} /> : <Terminal size={14} />}
              </button>
          )}

          {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <Github size={14} />
              </a>
          )}
          {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <ExternalLink size={14} />
              </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;