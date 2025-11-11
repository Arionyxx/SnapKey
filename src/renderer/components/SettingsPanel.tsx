import { useState } from 'react';
import { useAppStore } from '../store';

export function SettingsPanel() {
  const { settings, hookStatus, processList } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showProcessList, setShowProcessList] = useState(false);

  if (!settings) return null;

  const filteredProcesses = processList.filter(
    p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSetting = async (key: keyof typeof settings, value: unknown) => {
    try {
      await window.api.settings.set({ [key]: value });
    } catch (err) {
      console.error(`Error updating ${key}:`, err);
    }
  };

  const handleToggleHook = async () => {
    try {
      await window.api.hook.toggle();
    } catch (err) {
      console.error('Error toggling hook:', err);
    }
  };

  const handleSelectProcess = async (processName: string) => {
    try {
      await window.api.settings.set({ targetProcess: processName });
      setShowProcessList(false);
      setSearchTerm('');
    } catch (err) {
      console.error('Error setting target process:', err);
    }
  };

  const handleClearProcess = async () => {
    try {
      await window.api.settings.set({ targetProcess: null });
    } catch (err) {
      console.error('Error clearing target process:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hook Control */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Hook Control</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Enable Keyboard Hook</p>
              <p className="text-sm opacity-60">
                {hookStatus?.enabled ? 'Hook is currently active' : 'Hook is currently disabled'}
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-success"
              checked={hookStatus?.enabled || false}
              onChange={handleToggleHook}
            />
          </div>
        </div>
      </div>

      {/* Global Toggles */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Global Settings</h2>
          <div className="space-y-4">
            {/* Fullscreen Only */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Fullscreen Only</p>
                <p className="text-sm opacity-60">
                  Only activate hook when target is in fullscreen mode
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={settings.fullscreenOnly}
                onChange={e => handleToggleSetting('fullscreenOnly', e.target.checked)}
              />
            </div>

            {/* Start on Boot */}
            <div className="divider" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Start on Boot</p>
                <p className="text-sm opacity-60">Launch SnapKey when Windows starts</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={settings.startOnBoot}
                onChange={e => handleToggleSetting('startOnBoot', e.target.checked)}
              />
            </div>

            {/* Minimize to Tray */}
            <div className="divider" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Minimize to Tray</p>
                <p className="text-sm opacity-60">Keep app running in system tray</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={settings.minimizeToTray}
                onChange={e => handleToggleSetting('minimizeToTray', e.target.checked)}
              />
            </div>

            {/* Show Notifications */}
            <div className="divider" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Show Notifications</p>
                <p className="text-sm opacity-60">Display system notifications</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={settings.showNotifications}
                onChange={e => handleToggleSetting('showNotifications', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Target Process */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Target Process</h2>
          <p className="text-sm opacity-60 mb-2">
            Select a specific process to target. Leave empty to target all processes.
          </p>

          {/* Current Target */}
          {settings.targetProcess ? (
            <div className="alert">
              <div className="flex-1">
                <span className="font-semibold">Current Target:</span>{' '}
                <span className="font-mono">{settings.targetProcess}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleClearProcess}>
                Clear
              </button>
            </div>
          ) : (
            <div className="alert alert-info">
              <span>No target process selected. Hook will work for all processes.</span>
            </div>
          )}

          {/* Process Selection */}
          <div className="relative">
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search processes..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setShowProcessList(true)}
                />
                <button
                  className="btn btn-square"
                  onClick={() => setShowProcessList(!showProcessList)}
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Process List Dropdown */}
            {showProcessList && searchTerm.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-base-100 shadow-xl rounded-lg border border-base-300 max-h-64 overflow-y-auto scrollbar-thin">
                {filteredProcesses.length > 0 ? (
                  <ul className="menu">
                    {filteredProcesses.map(process => (
                      <li key={process.pid}>
                        <button
                          className="flex flex-col items-start"
                          onClick={() => handleSelectProcess(process.name)}
                        >
                          <span className="font-semibold font-mono">{process.name}</span>
                          {process.title && (
                            <span className="text-xs opacity-60 truncate w-full">
                              {process.title}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center opacity-60">No processes found</div>
                )}
              </div>
            )}
          </div>

          {/* Running Processes Count */}
          <div className="text-sm opacity-60 mt-2">
            {processList.length} running processes detected
          </div>
        </div>
      </div>
    </div>
  );
}
