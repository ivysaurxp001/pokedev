import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus } from '../types';
import {
    X, ExternalLink, Github, Network, Clock, Terminal, Check, Globe,
    Code, Tag, Users, BrainCircuit, Cpu, Edit3, Copy, ChevronRight,
    Layers, CheckCircle, Image as ImageIcon
} from 'lucide-react';

interface ProjectDetailViewProps {
    project: Project;
    onClose: () => void;
    onEdit: () => void;
}

const statusStyles: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
    [ProjectStatus.ACTIVE]: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    [ProjectStatus.PAUSED]: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    [ProjectStatus.ARCHIVED]: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
    [ProjectStatus.IDEA]: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
};

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, onClose, onEdit }) => {
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

    const handleCopyCommand = (cmd: string) => {
        navigator.clipboard.writeText(cmd);
        setCopiedCommand(cmd);
        setTimeout(() => setCopiedCommand(null), 2000);
    };

    const statusStyle = statusStyles[project.status];

    const deployStatusLabel = () => {
        switch (project.deploy_status_ai) {
            case 'production': return { icon: <Globe size={12} />, text: 'PRODUCTION', color: 'text-emerald-400' };
            case 'testnet': return { icon: <Globe size={12} />, text: 'TESTNET', color: 'text-amber-400' };
            case 'local': return { icon: <Terminal size={12} />, text: 'LOCAL', color: 'text-slate-400' };
            default: return null;
        }
    };

    const deployInfo = deployStatusLabel();

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl max-h-[90vh] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur relative overflow-hidden">
                    {/* Decorative gradient line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            {/* Status & Deploy badges */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-[10px] font-mono-tech font-bold uppercase tracking-wider px-2 py-1 border ${statusStyle.border} ${statusStyle.bg} ${statusStyle.text}`}>
                                    {project.status}
                                </span>
                                {deployInfo && (
                                    <span className={`flex items-center gap-1 text-[10px] font-mono-tech uppercase px-2 py-1 bg-slate-900 border border-slate-700 ${deployInfo.color}`}>
                                        {deployInfo.icon}
                                        {deployInfo.text}
                                    </span>
                                )}
                                <span className="text-[10px] font-mono-tech text-slate-500 px-2 py-1 bg-slate-900 border border-slate-700 uppercase">
                                    {project.type}
                                </span>
                                {project.confidence_score && (
                                    <span className={`flex items-center gap-1 text-[10px] font-mono-tech uppercase px-2 py-1 border ${project.confidence_score > 0.8 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${project.confidence_score > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                        {Math.floor(project.confidence_score * 100)}%
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-tech font-bold text-white tracking-tight mb-2 truncate">
                                {project.name || 'UNNAMED_ENTITY'}
                            </h1>

                            {/* One-liner */}
                            <p className="text-lg text-cyan-100/80 font-sans leading-relaxed">
                                {project.one_liner_ai || 'No description available'}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 font-mono-tech text-xs uppercase tracking-wide transition-all"
                            >
                                <Edit3 size={14} />
                                Edit
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* External Links */}
                    {(project.repo_url || project.demo_url) && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800/50">
                            {project.repo_url && (
                                <a
                                    href={project.repo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono-tech transition-colors"
                                >
                                    <Github size={14} />
                                    Repository
                                    <ExternalLink size={10} />
                                </a>
                            )}
                            {project.demo_url && (
                                <a
                                    href={project.demo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono-tech transition-colors"
                                >
                                    <Globe size={14} />
                                    Live Demo
                                    <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Description */}
                    {project.description_ai && (
                        <div className="bg-slate-900/50 border border-slate-800 p-5">
                            <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3">Technical Summary</h3>
                            <p className="text-slate-300 leading-relaxed">{project.description_ai}</p>
                        </div>
                    )}

                    {/* Project Images */}
                    {project.images && project.images.length > 0 && (
                        <div className="bg-slate-900/50 border border-slate-800 p-5">
                            <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ImageIcon size={14} /> Screenshots
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {project.images.map((img, i) => (
                                    <div key={i} className="aspect-video bg-slate-800 border border-slate-700 overflow-hidden group cursor-pointer">
                                        <img
                                            src={img}
                                            alt={`Screenshot ${i + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Run Commands */}
                    {project.run_commands_ai && project.run_commands_ai.length > 0 && (
                        <div className="bg-slate-900/50 border border-slate-800 p-5">
                            <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Terminal size={14} className="text-green-500" /> Run Commands
                            </h3>
                            <div className="space-y-2">
                                {project.run_commands_ai.map((cmd, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-4 py-2 font-mono-tech text-sm text-green-400 group">
                                        <ChevronRight size={14} className="text-slate-600" />
                                        <code className="flex-1">{cmd}</code>
                                        <button
                                            onClick={() => handleCopyCommand(cmd)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded transition-all"
                                            title="Copy command"
                                        >
                                            {copiedCommand === cmd ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-slate-400" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tech Stack & Chains */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tech Stack */}
                        {project.stack_ai.length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 p-5">
                                <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Code size={14} /> Tech Stack
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.stack_ai.map((tech, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-200 font-mono-tech text-xs hover:border-cyan-500/50 hover:text-cyan-400 transition-colors cursor-default">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chains */}
                        {project.chains_ai.length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 p-5">
                                <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Network size={14} className="text-cyan-500" /> Networks / Chains
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.chains_ai.map((chain, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-mono-tech text-xs">
                                            {chain}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    {project.features_ai.length > 0 && (
                        <div className="bg-slate-900/50 border border-slate-800 p-5">
                            <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Layers size={14} className="text-purple-500" /> Main Features
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {project.features_ai.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                        <CheckCircle size={14} className="text-purple-400 mt-0.5 shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Key Decisions / Memory */}
                    {project.key_decisions_ai && project.key_decisions_ai.length > 0 && (
                        <div className="bg-slate-900/50 border border-slate-800 p-5">
                            <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <BrainCircuit size={14} className="text-amber-500" /> Key Decisions / Memory
                            </h3>
                            <ul className="space-y-2">
                                {project.key_decisions_ai.map((decision, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>{decision}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Target Users & Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.target_users_ai.length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 p-5">
                                <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Users size={14} className="text-purple-500" /> Target Users
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.target_users_ai.map((user, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-purple-950/50 border border-purple-500/30 text-purple-300 font-mono-tech text-xs">
                                            {user}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {project.tags_ai.length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 p-5">
                                <h3 className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Tag size={14} className="text-pink-500" /> Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.tags_ai.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-pink-950/50 border border-pink-500/30 text-pink-300 font-mono-tech text-xs">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with metadata */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs font-mono-tech text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Created: {new Date(project.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Last touched: {new Date(project.last_touched_at).toLocaleDateString()}
                        </span>
                    </div>
                    <span className="text-slate-600">ID: {project.id.slice(0, 8).toUpperCase()}</span>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProjectDetailView;
