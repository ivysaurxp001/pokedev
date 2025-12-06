import React from 'react';
import { config } from '../config';
import Avatar3DViewer from './Avatar3DViewer';
import { Mail, MapPin, AtSign, Github, Linkedin, Twitter, Send as TelegramIcon } from 'lucide-react';

const ContactForm: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-tech font-bold text-white mb-4">
                    Get In Touch
                </h1>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Have a project in mind? Let's discuss how we can work together to bring your ideas to life.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* 3D Avatar - Left Side */}
                <div className="flex items-center justify-center">
                    <Avatar3DViewer
                        modelUrl="/avatar3.glb"
                        className="w-72 h-72"
                    />
                </div>

                {/* Contact Info - Right Side */}
                <div className="space-y-6">
                    <div className="bg-slate-900/60 border border-slate-800 p-6">
                        <h3 className="text-lg font-tech font-bold text-white mb-6">Contact Info</h3>

                        <div className="space-y-5">
                            {/* Email */}
                            <a
                                href={`mailto:${config.email}`}
                                className="flex items-center gap-4 group hover:translate-x-2 transition-transform"
                            >
                                <div className="w-12 h-12 bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:border-cyan-400 group-hover:bg-cyan-900/50 transition-colors">
                                    <Mail size={20} className="text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-mono-tech text-slate-500 uppercase mb-1">Email</p>
                                    <p className="text-slate-300 group-hover:text-cyan-400 transition-colors">{config.email}</p>
                                </div>
                            </a>

                            {/* Location */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-900/30 border border-purple-500/30 flex items-center justify-center shrink-0">
                                    <MapPin size={20} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-mono-tech text-slate-500 uppercase mb-1">Location</p>
                                    <p className="text-slate-300">{config.location}</p>
                                </div>
                            </div>

                            {/* Telegram */}
                            {config.social.telegram && (
                                <a
                                    href={config.social.telegram}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-4 group hover:translate-x-2 transition-transform"
                                >
                                    <div className="w-12 h-12 bg-pink-900/30 border border-pink-500/30 flex items-center justify-center shrink-0 group-hover:border-pink-400 group-hover:bg-pink-900/50 transition-colors">
                                        <AtSign size={20} className="text-pink-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-mono-tech text-slate-500 uppercase mb-1">Telegram</p>
                                        <p className="text-slate-300 group-hover:text-pink-400 transition-colors">
                                            @{config.social.telegram.split('/').pop()}
                                        </p>
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Availability */}
                    <div className={`p-6 border ${config.availability.status === 'available'
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : config.availability.status === 'limited'
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-red-950/20 border-red-500/30'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${config.availability.status === 'available' ? 'bg-emerald-500' :
                                config.availability.status === 'limited' ? 'bg-amber-500' : 'bg-red-500'
                                }`}></div>
                            <span className={`font-mono-tech text-sm uppercase tracking-wider ${config.availability.status === 'available' ? 'text-emerald-400' :
                                config.availability.status === 'limited' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                {config.availability.status === 'available' ? 'Available' :
                                    config.availability.status === 'limited' ? 'Limited Availability' : 'Currently Busy'}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm">{config.availability.message}</p>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3">
                        {config.social.github && (
                            <a href={config.social.github} target="_blank" rel="noreferrer"
                                className="flex-1 py-3 bg-slate-800/50 border border-slate-700 hover:border-white/30 hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2">
                                <Github size={18} />
                                <span className="font-mono-tech text-xs uppercase">GitHub</span>
                            </a>
                        )}
                        {config.social.linkedin && (
                            <a href={config.social.linkedin} target="_blank" rel="noreferrer"
                                className="flex-1 py-3 bg-slate-800/50 border border-slate-700 hover:border-blue-500/30 hover:bg-blue-900/20 text-slate-400 hover:text-blue-400 transition-all flex items-center justify-center gap-2">
                                <Linkedin size={18} />
                                <span className="font-mono-tech text-xs uppercase">LinkedIn</span>
                            </a>
                        )}
                        {config.social.twitter && (
                            <a href={config.social.twitter} target="_blank" rel="noreferrer"
                                className="flex-1 py-3 bg-slate-800/50 border border-slate-700 hover:border-cyan-500/30 hover:bg-cyan-900/20 text-slate-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-2">
                                <Twitter size={18} />
                                <span className="font-mono-tech text-xs uppercase">Twitter</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactForm;

