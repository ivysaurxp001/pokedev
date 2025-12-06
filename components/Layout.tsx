import React, { useState } from 'react';
import { config } from '../config';
import Avatar3DViewer from './Avatar3DViewer';
import { Database, LayoutGrid, Plus, Hexagon, User, Mail, Github, Linkedin, Twitter, Send } from 'lucide-react';

type ViewType = 'dashboard' | 'create' | 'about' | 'contact';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
}

// 3D Navigation Button Component
interface NavButton3DProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
  glowColor: string;
}

const NavButton3D: React.FC<NavButton3DProps> = ({ onClick, isActive, icon, label, activeColor, glowColor }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const transform = isHovering && !isActive
    ? `perspective(500px) rotateY(${mousePos.x * 8}deg) rotateX(${-mousePos.y * 8}deg) translateZ(4px)`
    : 'perspective(500px) rotateY(0deg) rotateX(0deg) translateZ(0px)';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setIsHovering(false); setMousePos({ x: 0, y: 0 }); }}
      className={`w-full flex items-center gap-3 px-4 py-3 border-l-2 transition-all duration-200 group relative overflow-hidden ${isActive
        ? `${activeColor} shadow-lg`
        : 'border-transparent hover:bg-slate-900/50 text-slate-400 hover:text-white'
        }`}
      style={{
        transform,
        transformStyle: 'preserve-3d',
        boxShadow: isHovering && !isActive ? `0 8px 20px -8px ${glowColor}40` : 'none'
      }}
    >
      {/* Shine effect */}
      {isHovering && !isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${(mousePos.x + 0.5) * 100}% ${(mousePos.y + 0.5) * 100}%, ${glowColor}15 0%, transparent 50%)`
          }}
        />
      )}

      <span className="relative z-10">{icon}</span>
      <span className="font-tech font-medium tracking-wide relative z-10">{label}</span>
      {isActive && (
        <div className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: glowColor, boxShadow: `0 0 8px ${glowColor}` }}></div>
      )}
    </button>
  );
};
const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentView }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-grid pointer-events-none z-0"></div>

      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-950/80 backdrop-blur-md border-r border-slate-800 flex flex-col fixed md:relative z-20 bottom-0 md:bottom-auto top-0 md:h-screen shadow-2xl shadow-black">
        <div className="p-4 border-b border-slate-800/60 flex items-center gap-3 relative overflow-hidden group">
          {/* Logo Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>

          <div className="relative">
            <Hexagon className="text-cyan-500 fill-cyan-500/10" size={32} strokeWidth={1.5} />
            <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-300" size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-tech font-bold text-xl tracking-tighter text-white truncate">{config.name.split(' ')[0]}</h1>
            <p className="text-[10px] text-cyan-500/80 font-mono-tech tracking-widest uppercase truncate">{config.title}</p>
          </div>
        </div>

        {/* Availability Badge */}
        <div className={`mx-4 mt-4 px-3 py-2 border ${config.availability.status === 'available'
          ? 'bg-emerald-950/30 border-emerald-500/30'
          : config.availability.status === 'limited'
            ? 'bg-amber-950/30 border-amber-500/30'
            : 'bg-red-950/30 border-red-500/30'
          }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${config.availability.status === 'available' ? 'bg-emerald-500' :
              config.availability.status === 'limited' ? 'bg-amber-500' : 'bg-red-500'
              }`}></div>
            <span className={`text-[10px] font-mono-tech uppercase tracking-wider ${config.availability.status === 'available' ? 'text-emerald-400' :
              config.availability.status === 'limited' ? 'text-amber-400' : 'text-red-400'
              }`}>
              {config.availability.status === 'available' ? 'Available for hire' :
                config.availability.status === 'limited' ? 'Limited availability' : 'Currently busy'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2" style={{ perspective: '1000px' }}>
          <div className="px-4 py-2 text-xs font-mono-tech text-slate-500 uppercase tracking-widest">Portfolio</div>

          <NavButton3D
            onClick={() => onNavigate('dashboard')}
            isActive={currentView === 'dashboard'}
            icon={<LayoutGrid size={18} />}
            label="Projects"
            activeColor="bg-cyan-500/10 border-cyan-500 text-cyan-400"
            glowColor="#22d3ee"
          />

          <NavButton3D
            onClick={() => onNavigate('about')}
            isActive={currentView === 'about'}
            icon={<User size={18} />}
            label="About Me"
            activeColor="bg-purple-500/10 border-purple-500 text-purple-400"
            glowColor="#a855f7"
          />

          <NavButton3D
            onClick={() => onNavigate('contact')}
            isActive={currentView === 'contact'}
            icon={<Mail size={18} />}
            label="Contact"
            activeColor="bg-pink-500/10 border-pink-500 text-pink-400"
            glowColor="#ec4899"
          />

          <div className="px-4 py-2 pt-4 text-xs font-mono-tech text-slate-500 uppercase tracking-widest">Admin</div>

          <NavButton3D
            onClick={() => onNavigate('create')}
            isActive={currentView === 'create'}
            icon={<Plus size={18} />}
            label="Add Project"
            activeColor="bg-amber-500/10 border-amber-500 text-amber-400"
            glowColor="#f59e0b"
          />
        </nav>

        {/* 3D Avatar Mascot */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Avatar3DViewer
            modelUrl="/avatar2.glb"
            className="w-40 h-40"
          />
        </div>

        {/* Social Links & Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
          <div className="flex items-center justify-center gap-3 mb-4">
            {config.social.github && (
              <a href={config.social.github} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                <Github size={18} />
              </a>
            )}
            {config.social.linkedin && (
              <a href={config.social.linkedin} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
                <Linkedin size={18} />
              </a>
            )}
            {config.social.twitter && (
              <a href={config.social.twitter} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-sky-400 hover:bg-slate-800 transition-colors">
                <Twitter size={18} />
              </a>
            )}
            {config.social.telegram && (
              <a href={config.social.telegram} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors">
                <Send size={18} />
              </a>
            )}
          </div>
          <div className="text-[10px] text-slate-600 font-mono-tech text-center">
            © {new Date().getFullYear()} {config.name}<br />
            Built with React & Supabase
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative z-10 scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;