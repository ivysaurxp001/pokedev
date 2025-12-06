import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, ProjectType } from '../types';
import { ExternalLink, Github, Network, Clock, Terminal, Check, Globe } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onTagClick?: (tag: string) => void;
  index?: number; // For staggered animation
}

const statusStyles: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  [ProjectStatus.PAUSED]: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  [ProjectStatus.ARCHIVED]: 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  [ProjectStatus.IDEA]: 'text-violet-400 border-violet-500/30 bg-violet-500/5',
};

// Color coding by project type
const typeColors: Record<ProjectType, { border: string; gradient: string; accent: string }> = {
  [ProjectType.DAPP]: {
    border: 'hover:border-purple-500/50',
    gradient: 'group-hover:from-purple-500/5 group-hover:to-pink-500/5',
    accent: 'group-hover:border-purple-400'
  },
  [ProjectType.WEB]: {
    border: 'hover:border-cyan-500/50',
    gradient: 'group-hover:from-cyan-500/5 group-hover:to-blue-500/5',
    accent: 'group-hover:border-cyan-400'
  },
  [ProjectType.TOOL]: {
    border: 'hover:border-amber-500/50',
    gradient: 'group-hover:from-amber-500/5 group-hover:to-orange-500/5',
    accent: 'group-hover:border-amber-400'
  },
  [ProjectType.LIB]: {
    border: 'hover:border-emerald-500/50',
    gradient: 'group-hover:from-emerald-500/5 group-hover:to-teal-500/5',
    accent: 'group-hover:border-emerald-400'
  },
  [ProjectType.OTHER]: {
    border: 'hover:border-slate-500/50',
    gradient: 'group-hover:from-slate-500/5 group-hover:to-gray-500/5',
    accent: 'group-hover:border-slate-400'
  },
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onTagClick, index = 0 }) => {
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const stack = project.stack_ai.slice(0, 3);
  const chains = project.chains_ai.slice(0, 2);
  const images = project.images || [];
  const colors = typeColors[project.type] || typeColors[ProjectType.OTHER];

  // 3D tilt effect on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition({ x: 0, y: 0 });
  };

  // Calculate 3D transform
  const transform3D = isHovering
    ? `perspective(1000px) rotateY(${mousePosition.x * 10}deg) rotateX(${-mousePosition.y * 10}deg) scale(1.02)`
    : 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Staggered delay based on index
          setTimeout(() => setIsVisible(true), index * 100);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  // Auto-cycle images on hover
  useEffect(() => {
    if (isHovering && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovering, images.length]);

  const confidenceColor =
    (project.confidence_score || 0) > 0.8 ? 'bg-emerald-500' :
      (project.confidence_score || 0) > 0.5 ? 'bg-amber-500' : 'bg-red-500';

  const deployStatusIcon = () => {
    switch (project.deploy_status_ai) {
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
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative bg-slate-900/60 border border-slate-800 ${colors.border} backdrop-blur-sm cursor-pointer flex flex-col h-full overflow-hidden
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        transition-[opacity,transform,box-shadow] duration-300 ease-out
      `}
      style={{
        transitionDelay: isVisible ? '0ms' : `${index * 50}ms`,
        transform: isVisible ? transform3D : 'translateY(32px)',
        boxShadow: isHovering
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px -5px rgba(6, 182, 212, 0.3)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Shine effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: isHovering
            ? `radial-gradient(circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, rgba(255,255,255,0.1) 0%, transparent 50%)`
            : 'none'
        }}
      />

      {/* Holographic Hover Effect - Type colored */}
      <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent ${colors.gradient} transition-all duration-500`}></div>

      {/* Decorative Corner Markers - Type colored */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-700 ${colors.accent} transition-colors`}></div>
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-700 ${colors.accent} transition-colors`}></div>
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-700 ${colors.accent} transition-colors`}></div>
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-700 ${colors.accent} transition-colors`}></div>

      {/* Project Image Banner with Carousel - Expands on hover */}
      {images.length > 0 && (
        <div
          className={`relative overflow-hidden transition-all duration-500 ease-out ${isHovering ? 'h-40' : 'h-28'
            }`}
        >
          {/* Image slides with zoom + fade effect */}
          {images.map((img, imgIndex) => (
            <div
              key={imgIndex}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${imgIndex === currentImageIndex
                ? 'opacity-100 scale-100'
                : imgIndex === (currentImageIndex - 1 + images.length) % images.length
                  ? 'opacity-0 scale-110 -translate-x-full'
                  : 'opacity-0 scale-110 translate-x-full'
                }`}
            >
              <img
                src={img}
                alt={`${project.name} - ${imgIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent pointer-events-none"></div>

          {/* Image counter badge */}
          {images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] font-mono-tech text-white border border-white/20">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Progress bar for auto-cycle */}
          {images.length > 1 && isHovering && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-none"
                style={{
                  animation: 'progress 1s linear infinite',
                  width: '100%'
                }}
              />
            </div>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, imgIndex) => (
                <div
                  key={imgIndex}
                  className={`h-1.5 rounded-full transition-all duration-300 ${imgIndex === currentImageIndex
                    ? 'bg-white w-4 shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                    : 'bg-white/40 w-1.5 hover:bg-white/60'
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tech);
                  }}
                  className="text-[10px] font-mono-tech px-2 py-1 bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors cursor-pointer"
                >
                  {tech}
                </button>
              ))}
            </div>
          )}

          {chains.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
              <Network size={12} className="text-cyan-500" />
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

      {/* Fullscreen Preview Popup - Rendered as Portal */}
      {isHovering && images.length > 0 && cardRef.current && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: cardRef.current.getBoundingClientRect().left + cardRef.current.offsetWidth / 2,
            top: cardRef.current.getBoundingClientRect().top - 10,
            transform: 'translate(-50%, -100%)',
            animation: 'fadeInUp 0.2s ease-out'
          }}
        >
          <div className="w-[500px] max-w-[90vw] bg-slate-900 border-2 border-cyan-500/70 shadow-2xl shadow-cyan-500/20 overflow-hidden rounded-lg">
            {/* Large Image */}
            <div className="aspect-video relative bg-black">
              {images.map((img, imgIndex) => (
                <img
                  key={imgIndex}
                  src={img}
                  alt={`${project.name} preview - ${imgIndex + 1}`}
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${imgIndex === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                />
              ))}

              {/* Progress indicators on top */}
              {images.length > 1 && (
                <div className="absolute top-3 left-3 right-3 flex gap-1">
                  {images.map((_, imgIndex) => (
                    <div
                      key={imgIndex}
                      className={`h-1 flex-1 rounded-full transition-all ${imgIndex === currentImageIndex
                        ? 'bg-cyan-400'
                        : imgIndex < currentImageIndex
                          ? 'bg-cyan-600'
                          : 'bg-white/30'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Image info bar */}
            <div className="bg-slate-900 p-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-white font-tech text-base truncate">{project.name}</span>
                {images.length > 1 && (
                  <span className="text-cyan-400 font-mono-tech text-sm bg-cyan-900/30 px-2 py-0.5 rounded">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Arrow pointing down */}
          <div className="flex justify-center -mt-px">
            <div className="w-4 h-4 bg-slate-900 border-r-2 border-b-2 border-cyan-500/70 rotate-45 -translate-y-2"></div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectCard;