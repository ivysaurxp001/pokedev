import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AboutMe from './components/AboutMe';
import ContactForm from './components/ContactForm';

type ViewType = 'dashboard' | 'create' | 'about' | 'contact';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');

  return (
    <Layout
      onNavigate={(v) => setView(v)}
      currentView={view}
    >
      {view === 'dashboard' && <Dashboard />}
      {view === 'create' && <Dashboard />}
      {view === 'about' && <AboutMe />}
      {view === 'contact' && <ContactForm />}
    </Layout>
  );
};

export default App;