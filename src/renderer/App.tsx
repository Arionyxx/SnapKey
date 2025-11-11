import { useEffect, useState } from 'react';
import './App.css';
import type { Settings, HookStatus } from '../shared/ipc';

function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hookStatus, setHookStatus] = useState<HookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Renderer] App mounted, initializing...');

    const initializeApp = async () => {
      try {
        console.log('[Renderer] Fetching initial settings...');
        const initialSettings = await window.api.settings.get();
        console.log('[Renderer] Received settings:', initialSettings);
        setSettings(initialSettings);

        console.log('[Renderer] Fetching hook status...');
        const initialStatus = await window.api.hook.getStatus();
        console.log('[Renderer] Received hook status:', initialStatus);
        setHookStatus(initialStatus);

        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Renderer] Error initializing app:', errorMessage);
        setError(errorMessage);
        setLoading(false);
      }
    };

    initializeApp();

    // Subscribe to settings updates
    console.log('[Renderer] Subscribing to settings updates...');
    const unsubscribeSettings = window.api.settings.onUpdated(updatedSettings => {
      console.log('[Renderer] Settings updated:', updatedSettings);
      setSettings(updatedSettings);
    });

    // Subscribe to hook status updates
    console.log('[Renderer] Subscribing to hook status updates...');
    const unsubscribeHook = window.api.hook.onStatusUpdated(updatedStatus => {
      console.log('[Renderer] Hook status updated:', updatedStatus);
      setHookStatus(updatedStatus);
    });

    return () => {
      console.log('[Renderer] App unmounting, cleaning up subscriptions...');
      unsubscribeSettings();
      unsubscribeHook();
    };
  }, []);

  const handleToggleHook = async () => {
    try {
      console.log('[Renderer] Toggling hook...');
      const newStatus = await window.api.hook.toggle();
      console.log('[Renderer] Hook toggled:', newStatus);
      setHookStatus(newStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Renderer] Error toggling hook:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleToggleTheme = async () => {
    if (!settings) return;

    try {
      console.log('[Renderer] Toggling theme...');
      const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
      const updatedSettings = await window.api.settings.set({ theme: newTheme });
      console.log('[Renderer] Theme updated:', updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Renderer] Error updating theme:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleResetSettings = async () => {
    try {
      console.log('[Renderer] Resetting settings...');
      const resetSettings = await window.api.settings.reset();
      console.log('[Renderer] Settings reset:', resetSettings);
      setSettings(resetSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Renderer] Error resetting settings:', errorMessage);
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <h1>🎮 SnapKey</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="container">
          <h1>🎮 SnapKey</h1>
          <div className="info-card">
            <h2>Error</h2>
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <h1>🎮 SnapKey</h1>
        <div className="info-card">
          <h2>Welcome to SnapKey 2.0</h2>
          <p className="description">
            A lightweight, open-source tool that prevents simultaneous movement key conflicts.
          </p>
          <div className="status">
            <div className="status-item">
              <span className="label">Hook Status:</span>
              <span className={`value ${hookStatus?.enabled ? 'running' : ''}`}>
                {hookStatus?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Platform:</span>
              <span className="value">{window.api.platform}</span>
            </div>
            <div className="status-item">
              <span className="label">Electron:</span>
              <span className="value">{window.api.version}</span>
            </div>
          </div>

          <div className="features">
            <h3>Current Settings</h3>
            {settings && (
              <ul>
                <li>Theme: {settings.theme}</li>
                <li>
                  Active Profile:{' '}
                  {settings.profiles.find(p => p.id === settings.activeProfileId)?.name || 'None'}
                </li>
                <li>Total Profiles: {settings.profiles.length}</li>
                <li>Fullscreen Only: {settings.fullscreenOnly ? 'Yes' : 'No'}</li>
                <li>Target Process: {settings.targetProcess || 'None'}</li>
                <li>Start on Boot: {settings.startOnBoot ? 'Yes' : 'No'}</li>
                <li>Minimize to Tray: {settings.minimizeToTray ? 'Yes' : 'No'}</li>
                <li>Show Notifications: {settings.showNotifications ? 'Yes' : 'No'}</li>
                <li>Hotkey: {settings.hotkey}</li>
              </ul>
            )}
          </div>

          <div className="features">
            <h3>IPC Test Controls</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleToggleHook}>
                {hookStatus?.enabled ? 'Disable Hook' : 'Enable Hook'}
              </button>
              <button onClick={handleToggleTheme}>Toggle Theme</button>
              <button onClick={handleResetSettings}>Reset Settings</button>
            </div>
          </div>

          <div className="features">
            <h3>Features</h3>
            <ul>
              <li>✅ React with TypeScript</li>
              <li>✅ Electron Forge + Vite</li>
              <li>✅ Hot Module Replacement</li>
              <li>✅ ESLint + Prettier</li>
              <li>✅ Typed IPC with Zod validation</li>
              <li>✅ Settings persistence</li>
              <li>✅ Hook management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
