import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SettingsPanel } from './components/SettingsPanel';
import { ProfilePanel } from './components/ProfilePanel';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { useAppStore } from './store';
import { useAppInitialize } from './hooks/useAppInitialize';
import './styles.css';

type Tab = 'settings' | 'profiles' | 'diagnostics';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const { loading, error, settings } = useAppStore();

  // Initialize app and sync with IPC
  useAppInitialize();

  // Apply theme to document
  useEffect(() => {
    if (settings) {
      const theme = settings.theme === 'system' ? 'dark' : settings.theme;
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-lg">Loading SnapKey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="alert alert-error max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-200 p-2">
          <button
            className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
          <button
            className={`tab ${activeTab === 'profiles' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('profiles')}
          >
            🎮 Profiles & Keybinds
          </button>
          <button
            className={`tab ${activeTab === 'diagnostics' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('diagnostics')}
          >
            📊 Diagnostics
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'settings' && <SettingsPanel />}
          {activeTab === 'profiles' && <ProfilePanel />}
          {activeTab === 'diagnostics' && <DiagnosticsPanel />}
        </div>
      </div>
    </Layout>
  );
}

export default App;
