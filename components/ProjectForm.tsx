import React, { useState, useRef, useEffect } from 'react';
import { Project, ProjectStatus, ProjectType, ChatMessage, AIAnalysisResult } from '../types';
import { saveProject, createEmptyProject, uploadFiles, runAnalysis, getProjectFiles, getFileContent } from '../services/projectServiceSimple';
import { createOracleChat } from '../services/geminiService';
import { supabase } from '../lib/supabase';
import { isAdmin } from '../utils/adminAuth';
import ImageUploader from './ImageUploader';
import { Upload, Cpu, Save, X, FileText, AlertTriangle, CheckCircle, Loader2, Network, Users, RefreshCw, Tag, Code, Terminal, BrainCircuit, MessageSquare, Send, Bot, User, Trash2 } from 'lucide-react';

interface ProjectFormProps {
    initialProject?: Project;
    onClose: () => void;
    onSave: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialProject, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'ingest' | 'oracle'>('ingest');
    const [project, setProject] = useState<Project>(initialProject || createEmptyProject());

    // Upload & Analysis State
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Multi-file state
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, id: string }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [missingInfo, setMissingInfo] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Oracle Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);
    const [chatSession, setChatSession] = useState<any>(null);

    // Initialize uploaded files list if editing
    useEffect(() => {
        if (initialProject) {
            const loadFiles = async () => {
                const files = await getProjectFiles(initialProject.id);
                setUploadedFiles(files.map(f => ({ name: f.name, id: f.id })));
            };
            loadFiles();
        }
    }, [initialProject]);

    // No need for job subscription - analysis runs directly

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
            setError(null);
            setUploading(true);

            try {
                // 0. Đảm bảo project đã được lưu vào database trước
                if (!initialProject) {
                    const savedProject = await saveProject({
                        ...project,
                        last_touched_at: new Date().toISOString()
                    });
                    setProject(savedProject);
                }

                // 1. Upload Files
                setUploading(true);
                const newUploadedFiles = await uploadFiles(files, project.id);

                // Update local list
                const updatedList = [...uploadedFiles, ...newUploadedFiles.map(f => ({ name: f.name, id: f.id }))];
                setUploadedFiles(updatedList);

                // 2. Run Analysis trực tiếp (client side)
                setUploading(false);
                setAnalyzing(true);
                setError(null);

                const allFileIds = updatedList.map(f => f.id);
                await runAnalysis(project.id, allFileIds);

                // 3. Reload project để lấy kết quả analysis
                const { data: updatedProject } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', project.id)
                    .single();

                if (updatedProject) {
                    setProject(updatedProject);
                }

                setError(null);
            } catch (err: any) {
                console.error('Upload/Analysis error:', err);
                setError(err.message || "Upload/Analysis failed.");
            } finally {
                setUploading(false);
                setAnalyzing(false);
            }
        }
    };

    const handleRetry = async () => {
        if (uploadedFiles.length === 0) return;
        setError(null);
        setAnalyzing(true);
        try {
            const allFileIds = uploadedFiles.map(f => f.id);
            await runAnalysis(project.id, allFileIds);

            // Reload project từ database
            const { data: updatedProject } = await supabase
                .from('projects')
                .select('*')
                .eq('id', project.id)
                .single();

            if (updatedProject) {
                setProject(updatedProject);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message || "Analysis failed.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAnalysisComplete = (analysis: AIAnalysisResult) => {
        setProject(prev => ({
            ...prev,
            // Only auto-name if it's generic
            name: (prev.name && prev.name !== 'New Project' && prev.name !== '') ? prev.name : prev.name,
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
            ai_updated_at: new Date().toISOString()
        }));

        if (analysis.missing_info && analysis.missing_info.length > 0) {
            setMissingInfo(analysis.missing_info);
        }
    };

    // Oracle Chat Logic
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsChatting(true);

        try {
            let session = chatSession;
            if (!session) {
                // Initialize session on first message
                const files = await getProjectFiles(project.id);
                if (files.length === 0) {
                    setChatMessages(prev => [...prev, { role: 'model', content: "SYSTEM ERROR: No source files found. Please upload files to initialize Oracle.", timestamp: Date.now() }]);
                    setIsChatting(false);
                    return;
                }
                // Download file contents from Storage
                const contextFiles = await Promise.all(
                    files.map(async (f) => ({
                        name: f.name,
                        content: await getFileContent(f).catch(() => '')
                    }))
                );
                session = createOracleChat(contextFiles);
                setChatSession(session);
            }

            // Updated for @google/genai SDK compliance
            const result = await session.sendMessage({ message: userMsg.content });
            const text = result.text; // Access directly as property, not function

            const botMsg: ChatMessage = { role: 'model', content: text || "No response received.", timestamp: Date.now() };
            setChatMessages(prev => [...prev, botMsg]);

        } catch (err: any) {
            console.error("Oracle Error:", err);
            setChatMessages(prev => [...prev, {
                role: 'model',
                content: `CONNECTION ERROR: ${err.message || "Oracle unavailable."}`,
                timestamp: Date.now()
            }]);
        } finally {
            setIsChatting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check admin permission
        if (!isAdmin()) {
            setError("Chỉ admin mới có thể tạo/chỉnh sửa project!");
            return;
        }

        try {
            const finalProject = {
                ...project,
                last_touched_at: new Date().toISOString()
            };
            await saveProject(finalProject);
            onSave();
        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.message || JSON.stringify(err) || "Failed to save project");
        }
    };

    const renderArrayInput = (
        label: string,
        items: string[],
        onChange: (items: string[]) => void,
        icon?: React.ReactNode
    ) => (
        <div className="bg-slate-900/50 border border-slate-800 p-4 relative group hover:border-slate-700 transition-colors h-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-cyan-500/50 transition-colors"></div>
            <label className="block text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                {icon} {label}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
                {items.map((item, i) => (
                    <span key={i} className="bg-slate-800/80 text-cyan-100/90 font-mono-tech px-2 py-1 text-xs flex items-center gap-1 border border-slate-700">
                        {item}
                        <button
                            type="button"
                            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                            className="hover:text-red-400 ml-1"
                        >
                            <X size={10} />
                        </button>
                    </span>
                ))}
                <button
                    type="button"
                    onClick={() => {
                        const newVal = prompt(`Add ${label}:`);
                        if (newVal) onChange([...items, newVal]);
                    }}
                    className="px-2 py-1 text-xs font-mono-tech border border-dashed border-slate-700 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
                >
                    + ADD
                </button>
            </div>
        </div>
    );

    const isScanning = uploading || analyzing;
    const isError = !!error;

    return (
        <div className="bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[85vh] relative w-full">
            {/* Decorative Grid Background */}
            <div className="absolute inset-0 bg-grid pointer-events-none opacity-20"></div>

            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-md relative z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center">
                        <Cpu className="text-cyan-400" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-tech font-bold text-white tracking-tight">
                            {initialProject ? 'EDIT ENTITY' : 'NEW PROJECT INGESTION'}
                        </h2>
                        <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-500">
                            <span>ID: {project.id.slice(0, 8).toUpperCase()}</span>
                            <span>//</span>
                            <span className={`${isScanning ? "text-cyan-400 animate-pulse" : isError ? "text-red-500" : "text-emerald-500"}`}>
                                {isScanning ? "SYSTEM ANALYZING..." : isError ? "SYSTEM FAILURE" : "READY"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-sm">
                    <button
                        onClick={() => setActiveTab('ingest')}
                        className={`px-4 py-1.5 text-xs font-mono-tech uppercase tracking-wide flex items-center gap-2 transition-all ${activeTab === 'ingest' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-white'}`}
                    >
                        <FileText size={12} /> Data
                    </button>
                    <button
                        onClick={() => setActiveTab('oracle')}
                        className={`px-4 py-1.5 text-xs font-mono-tech uppercase tracking-wide flex items-center gap-2 transition-all ${activeTab === 'oracle' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-white'}`}
                    >
                        <MessageSquare size={12} /> Oracle Link
                    </button>
                </div>

                <button onClick={onClose} className="text-slate-500 hover:text-white p-2 hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800">
                    <X size={24} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative z-10">

                {/* VIEW: DATA INGESTION */}
                {activeTab === 'ingest' && (
                    <div className="h-full overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: Input & Meta */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Multi-File Upload Area */}
                            <div className={`border border-dashed p-6 text-center transition-all relative overflow-hidden group ${isError ? 'border-red-500/50 bg-red-950/10' :
                                uploadedFiles.length > 0 ? 'border-cyan-500/30 bg-cyan-950/10' : 'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-900/50'
                                }`}>
                                {/* Scanning Laser Effect */}
                                {isScanning && (
                                    <div className="absolute left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-scan z-20 pointer-events-none"></div>
                                )}

                                <input
                                    type="file"
                                    accept=".md,.txt,.json,.toml,.yml,Makefile"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    disabled={uploading || isScanning}
                                />

                                {isError ? (
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <AlertTriangle className="text-red-500 mb-2" size={32} />
                                        <span className="text-red-400 font-tech text-base tracking-wider mb-2">ANALYSIS FAILED</span>
                                        <p className="text-xs text-red-300/70 mb-4 max-w-[200px]">{error}</p>
                                        <button
                                            onClick={handleRetry}
                                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 flex items-center gap-2 text-xs font-mono-tech transition-colors"
                                        >
                                            <RefreshCw size={12} /> RETRY ANALYSIS
                                        </button>
                                    </div>
                                ) : isScanning ? (
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <Loader2 className="animate-spin text-cyan-400 mb-4" size={32} />
                                        <span className="text-cyan-300 font-tech text-base tracking-wider animate-pulse">
                                            {uploading ? 'UPLOADING...' : 'ANALYZING...'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 cursor-pointer py-4" onClick={() => fileInputRef.current?.click()}>
                                        <div className="p-3 bg-slate-900 border border-slate-700 group-hover:border-cyan-500/50 group-hover:text-cyan-400 text-slate-400 transition-all">
                                            <Upload size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white font-tech">UPLOAD SOURCE FILES</h3>
                                            <p className="text-[10px] font-mono-tech text-slate-500 mt-1">DRAG DROP OR CLICK • README + CONFIGS</p>
                                        </div>
                                    </div>
                                )}

                                {/* File Stack List */}
                                {uploadedFiles.length > 0 && !isError && (
                                    <div className="mt-4 pt-4 border-t border-slate-700/50 text-left">
                                        <label className="text-[10px] font-mono-tech text-slate-500 uppercase block mb-2">Ingested Files ({uploadedFiles.length})</label>
                                        <div className="flex flex-wrap gap-2">
                                            {uploadedFiles.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-300 font-mono-tech">
                                                    <FileText size={10} className="text-cyan-500" />
                                                    <span className="truncate max-w-[100px]">{f.name}</span>
                                                </div>
                                            ))}
                                            {!isScanning && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setUploadedFiles([]); setError(null); }}
                                                    className="text-[10px] text-slate-500 hover:text-white font-mono-tech underline ml-auto"
                                                >
                                                    CLEAR
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Missing Info Alert */}
                            {missingInfo.length > 0 && (
                                <div className="bg-amber-950/20 border-l-2 border-amber-500 p-4">
                                    <div className="flex items-center gap-2 text-amber-500 mb-2 font-mono-tech text-xs uppercase tracking-widest">
                                        <AlertTriangle size={14} />
                                        <span>Incomplete Data Detected</span>
                                    </div>
                                    <ul className="list-disc list-inside text-xs font-mono-tech text-amber-200/60 space-y-1 ml-1">
                                        {missingInfo.map((q, i) => <li key={i}>{q}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Manual Meta Inputs */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <div className="group">
                                    <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-1 group-focus-within:text-cyan-500 transition-colors">Project Name</label>
                                    <input
                                        type="text"
                                        value={project.name}
                                        onChange={e => setProject({ ...project, name: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 px-4 py-3 text-white focus:border-cyan-500 outline-none font-tech text-lg tracking-wide transition-colors"
                                        placeholder="ENTER PROJECT IDENTIFIER"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-1">Type</label>
                                        <select
                                            value={project.type}
                                            onChange={e => setProject({ ...project, type: e.target.value as ProjectType })}
                                            className="w-full bg-slate-900 border border-slate-800 px-4 py-3 text-slate-200 focus:border-cyan-500 outline-none font-mono-tech text-xs"
                                        >
                                            {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-1">Status</label>
                                        <select
                                            value={project.status}
                                            onChange={e => setProject({ ...project, status: e.target.value as ProjectStatus })}
                                            className="w-full bg-slate-900 border border-slate-800 px-4 py-3 text-slate-200 focus:border-cyan-500 outline-none font-mono-tech text-xs"
                                        >
                                            {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-1">Endpoints</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={project.repo_url || ''}
                                            onChange={e => setProject({ ...project, repo_url: e.target.value })}
                                            className="bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono-tech text-white placeholder-slate-700 focus:border-cyan-500 outline-none"
                                            placeholder="GITHUB_REPO_URL"
                                        />
                                        <input
                                            type="text"
                                            value={project.demo_url || ''}
                                            onChange={e => setProject({ ...project, demo_url: e.target.value })}
                                            className="bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono-tech text-white placeholder-slate-700 focus:border-cyan-500 outline-none"
                                            placeholder="DEPLOYMENT_URL"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: AI Results & Operations */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-slate-900/30 p-6 border border-slate-800/60 relative">
                                <div className="absolute top-0 right-0 p-2">
                                    {project.confidence_score !== undefined && (
                                        <div className={`flex items-center gap-2 px-3 py-1 border ${project.confidence_score > 0.8 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                                            <span className="text-[10px] font-mono-tech uppercase">Confidence</span>
                                            <span className="text-xs font-bold font-mono-tech">{(project.confidence_score * 100).toFixed(0)}%</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-2">Primary Directive (One-Liner)</label>
                                    <input
                                        type="text"
                                        value={project.one_liner_ai || ''}
                                        onChange={e => setProject({ ...project, one_liner_ai: e.target.value })}
                                        className="w-full bg-transparent border-b border-slate-700 px-0 py-2 text-xl font-tech text-cyan-100 placeholder-slate-700 focus:border-cyan-500 outline-none"
                                        placeholder="..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-2">Technical Summary</label>
                                    <textarea
                                        value={project.description_ai || ''}
                                        onChange={e => setProject({ ...project, description_ai: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-slate-800 p-4 text-slate-300 text-sm h-32 focus:border-cyan-500 outline-none resize-none font-sans leading-relaxed"
                                        placeholder="..."
                                    />
                                </div>
                            </div>

                            {/* OPERATIONAL & MEMORY BLOCK */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderArrayInput(
                                    'Run Commands',
                                    project.run_commands_ai || [],
                                    (val) => setProject({ ...project, run_commands_ai: val }),
                                    <Terminal size={14} className="text-green-500" />
                                )}

                                {renderArrayInput(
                                    'Key Decisions / Memory',
                                    project.key_decisions_ai || [],
                                    (val) => setProject({ ...project, key_decisions_ai: val }),
                                    <BrainCircuit size={14} className="text-amber-500" />
                                )}
                            </div>

                            {/* TAGS & STACK BLOCK */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderArrayInput('Tech Stack', project.stack_ai, (val) => setProject({ ...project, stack_ai: val }), <Code size={14} />)}

                                {renderArrayInput(
                                    'Networks / Chains',
                                    project.chains_ai,
                                    (val) => setProject({ ...project, chains_ai: val }),
                                    <Network size={14} className="text-cyan-500" />
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderArrayInput(
                                    'Target Entities',
                                    project.target_users_ai,
                                    (val) => setProject({ ...project, target_users_ai: val }),
                                    <Users size={14} className="text-purple-500" />
                                )}

                                {renderArrayInput(
                                    'Tags / Keywords',
                                    project.tags_ai,
                                    (val) => setProject({ ...project, tags_ai: val }),
                                    <Tag size={14} className="text-pink-500" />
                                )}
                            </div>

                            {/* PROJECT IMAGES */}
                            <div className="bg-slate-900/50 border border-slate-800 p-4">
                                <ImageUploader
                                    projectId={project.id}
                                    images={project.images || []}
                                    onChange={(images) => setProject({ ...project, images })}
                                    disabled={uploading || analyzing}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: ORACLE CHAT */}
                {activeTab === 'oracle' && (
                    <div className="h-full flex flex-col p-4 md:p-8">
                        {/* Chat Container */}
                        <div className="flex-1 bg-slate-900/50 border border-slate-800 flex flex-col relative overflow-hidden">
                            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {uploadedFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <BrainCircuit size={48} className="mb-4 opacity-20" />
                                        <p className="font-tech text-lg">ORACLE OFFLINE</p>
                                        <p className="text-xs font-mono-tech">UPLOAD PROJECT FILES TO ESTABLISH UPLINK</p>
                                    </div>
                                ) : chatMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <MessageSquare size={48} className="mb-4 text-purple-500/50" />
                                        <p className="font-tech text-lg text-purple-200">ORACLE LINK ESTABLISHED</p>
                                        <p className="text-xs font-mono-tech max-w-md text-center mt-2">
                                            I have read {uploadedFiles.length} file(s) from this project.
                                            Ask me about architecture, run commands, or code locations.
                                        </p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-purple-900/50 border border-purple-500/30'}`}>
                                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-purple-400" />}
                                            </div>
                                            <div className={`max-w-[80%] p-3 rounded text-sm font-mono-tech leading-relaxed ${msg.role === 'user' ? 'bg-slate-800 text-slate-200' : 'bg-purple-900/10 border border-purple-500/20 text-purple-100'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isChatting && (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded bg-purple-900/50 border border-purple-500/30 flex items-center justify-center shrink-0">
                                            <Bot size={16} className="text-purple-400" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder={uploadedFiles.length > 0 ? "Ask the Oracle (e.g. 'How do I build this?')" : "Upload files first..."}
                                        disabled={uploadedFiles.length === 0 || isChatting}
                                        className="flex-1 bg-slate-900 border border-slate-700 p-3 text-sm font-mono-tech text-white focus:border-purple-500 outline-none placeholder-slate-600 disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={uploadedFiles.length === 0 || isChatting || !chatInput.trim()}
                                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white px-4 py-2 flex items-center justify-center transition-colors"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center relative z-10 shrink-0">
                <div className="text-xs font-mono-tech text-slate-600">
                    {uploadedFiles.length} SOURCES ATTACHED
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-xs font-mono-tech text-slate-400 hover:text-white hover:bg-slate-800 transition-colors uppercase tracking-widest border border-transparent hover:border-slate-700"
                    >
                        Abort
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono-tech text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] transition-all flex items-center gap-2 border border-cyan-400/50"
                    >
                        <Save size={16} />
                        Commit to Database
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectForm;