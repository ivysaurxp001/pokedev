import React from 'react';
import { config } from '../config';
import Avatar3DViewer from './Avatar3DViewer';
import {
    MapPin, Mail, Download, Briefcase, Code, Globe, Server,
    Puzzle, Blocks, ChevronRight, Sparkles
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
    Blocks: <Blocks size={24} />,
    Globe: <Globe size={24} />,
    Puzzle: <Puzzle size={24} />,
    Server: <Server size={24} />,
    Code: <Code size={24} />,
};

const AboutMe: React.FC = () => {
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-pink-500/10"></div>
                <div className="relative bg-slate-900/60 border border-slate-800 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* 3D Avatar */}
                        <div className="relative">
                            <Avatar3DViewer
                                modelUrl="/avatar.glb"
                                className="w-48 h-48 md:w-64 md:h-64"
                            />
                            {/* Availability indicator */}
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-mono-tech uppercase tracking-wider border whitespace-nowrap z-10 ${config.availability.status === 'available'
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : config.availability.status === 'limited'
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                                }`}>
                                {config.availability.status === 'available' ? '🟢' : config.availability.status === 'limited' ? '🟡' : '🔴'} {config.availability.status}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-tech font-bold text-white mb-2">
                                {config.name}
                            </h1>
                            <p className="text-xl text-cyan-400 font-tech mb-4">{config.title}</p>
                            <p className="text-slate-400 italic mb-6">"{config.tagline}"</p>

                            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-slate-400">
                                <span className="flex items-center gap-2">
                                    <MapPin size={16} className="text-pink-500" />
                                    {config.location}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Mail size={16} className="text-cyan-500" />
                                    {config.email}
                                </span>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                                <a
                                    href={`mailto:${config.email}`}
                                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono-tech text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
                                >
                                    <Mail size={16} />
                                    Contact Me
                                </a>
                                {config.resumeUrl && (
                                    <a
                                        href={config.resumeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-6 py-3 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 font-mono-tech text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download CV
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio Section */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8">
                <h2 className="text-xl font-tech font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles size={20} className="text-purple-500" />
                    About Me
                </h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {config.bio}
                </div>
            </div>

            {/* Skills Section */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8">
                <h2 className="text-xl font-tech font-bold text-white mb-6 flex items-center gap-2">
                    <Code size={20} className="text-cyan-500" />
                    Skills & Technologies
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.skills.map((skill, index) => (
                        <div key={index} className="group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300 font-mono-tech text-sm">{skill.name}</span>
                                <span className="text-slate-500 text-xs font-mono-tech">{skill.level}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000 group-hover:from-cyan-400 group-hover:to-pink-500"
                                    style={{ width: `${skill.level}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Services Section */}
            <div>
                <h2 className="text-xl font-tech font-bold text-white mb-6 flex items-center gap-2">
                    <Briefcase size={20} className="text-amber-500" />
                    What I Can Do For You
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {config.services.map((service, index) => (
                        <div
                            key={index}
                            className="group bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 p-6 transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Hover gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-all"></div>

                            <div className="relative">
                                <div className="w-12 h-12 bg-slate-800 group-hover:bg-cyan-900/30 border border-slate-700 group-hover:border-cyan-500/30 flex items-center justify-center mb-4 transition-colors text-slate-400 group-hover:text-cyan-400">
                                    {iconMap[service.icon] || <Code size={24} />}
                                </div>
                                <h3 className="text-lg font-tech font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                    {service.title}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {service.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-cyan-900/30 via-purple-900/30 to-pink-900/30 border border-slate-700 p-8 text-center">
                <h2 className="text-2xl font-tech font-bold text-white mb-4">
                    Ready to Work Together?
                </h2>
                <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                    I'm currently {config.availability.message.toLowerCase()}. Let's discuss how I can help bring your project to life.
                </p>
                <a
                    href={`mailto:${config.email}?subject=Project Inquiry`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-mono-tech uppercase tracking-wider transition-colors"
                >
                    Get in Touch
                    <ChevronRight size={18} />
                </a>
            </div>
        </div>
    );
};

export default AboutMe;
