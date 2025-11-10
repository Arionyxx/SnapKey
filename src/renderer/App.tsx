import React from 'react';
import './App.css';

declare global {
  interface Window {
    electron?: {
      platform: string;
      version: string;
    };
  }
}

function App() {
  const platform = window.electron?.platform || 'Loading...';
  const version = window.electron?.version || 'Loading...';

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
              <span className="label">Status:</span>
              <span className="value running">Running</span>
            </div>
            <div className="status-item">
              <span className="label">Platform:</span>
              <span className="value">{platform}</span>
            </div>
            <div className="status-item">
              <span className="label">Electron:</span>
              <span className="value">{version}</span>
            </div>
          </div>
          <div className="features">
            <h3>Features</h3>
            <ul>
              <li>✅ React with TypeScript</li>
              <li>✅ Electron Forge + Vite</li>
              <li>✅ Hot Module Replacement</li>
              <li>✅ ESLint + Prettier</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
