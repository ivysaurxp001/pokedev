import React from 'react';
import { Database, LayoutGrid, Plus, Hexagon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: 'dashboard' | 'create') => void;
  currentView: 'dashboard' | 'create';
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentView }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-grid pointer-events-none z-0"></div>
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-950/80 backdrop-blur-md border-r border-slate-800 flex flex-col fixed md:relative z-20 bottom-0 md:bottom-auto top-0 md:h-screen shadow-2xl shadow-black">
        <div className="p-6 border-b border-slate-800/60 flex items-center gap-3 relative overflow-hidden group">
            {/* Logo Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>
            
            <div className="relative">
                <Hexagon className="text-cyan-500 fill-cyan-500/10" size={32} strokeWidth={1.5} />
                <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-300" size={14} />
            </div>
            <div>
                <h1 className="font-tech font-bold text-2xl tracking-tighter text-white">DevDex</h1>
                <p className="text-[10px] text-cyan-500/80 font-mono-tech tracking-widest uppercase">System Online</p>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="px-4 py-2 text-xs font-mono-tech text-slate-500 uppercase tracking-widest">Modules</div>
          
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none border-l-2 transition-all group ${
              currentView === 'dashboard'
                ? 'bg-cyan-500/5 border-cyan-500 text-cyan-400'
                : 'border-transparent hover:bg-slate-900/50 hover:border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={18} className={currentView === 'dashboard' ? 'text-cyan-400' : 'group-hover:text-cyan-200'} />
            <span className="font-tech font-medium tracking-wide">Project Grid</span>
            {currentView === 'dashboard' && <div className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
          </button>

          <button
            onClick={() => onNavigate('create')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none border-l-2 transition-all group ${
              currentView === 'create'
                ? 'bg-purple-500/5 border-purple-500 text-purple-400'
                : 'border-transparent hover:bg-slate-900/50 hover:border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Plus size={18} className={currentView === 'create' ? 'text-purple-400' : 'group-hover:text-purple-200'} />
            <span className="font-tech font-medium tracking-wide">Ingest Data</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-mono-tech text-green-500">LINK ESTABLISHED</span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono-tech">
            DevDex v1.0.4<br/>
            Gemini Core Active
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