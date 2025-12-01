import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';

// Mock routing logic since we can't use React Router DOM properly in this environment
// In a real app, use React Router or Next.js routing

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');

  return (
    <Layout 
      onNavigate={(v) => setView(v)} 
      currentView={view}
    >
      {view === 'dashboard' && <Dashboard />}
      {view === 'create' && (
        // Trick to open dashboard but trigger create modal immediately
        // For the sake of this demo, we just render dashboard which handles its own modal state usually, 
        // but here we can just reset to dashboard and let the user click add, OR render a standalone form.
        // Let's render dashboard and auto-trigger create via props if we were passing them,
        // but to keep it simple, I'll just redirect to dashboard in this demo logic 
        // because the Dashboard component has the "Add Project" button prominent.
        <Dashboard /> 
      )}
    </Layout>
  );
};

export default App;