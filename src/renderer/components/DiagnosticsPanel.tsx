import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import type { HookDiagnostics } from '../../shared/ipc';

export function DiagnosticsPanel() {
  const { hookStatus, windowState, settings } = useAppStore();
  const [diagnostics, setDiagnostics] = useState<HookDiagnostics | null>(null);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const diag = await window.api.hook.getDiagnostics();
        setDiagnostics(diag);
      } catch (err) {
        console.error('Error fetching diagnostics:', err);
      }
    };

    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Hook Status */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Hook Status</h2>
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">State</div>
              <div
                className={`stat-value text-2xl ${hookStatus?.enabled ? 'text-success' : 'text-error'}`}
              >
                {hookStatus?.enabled ? 'Enabled' : 'Disabled'}
              </div>
              <div className="stat-desc">
                {windowState?.conditionsMet ? 'Conditions met' : 'Waiting for conditions'}
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Active Keys</div>
              <div className="stat-value text-2xl">{hookStatus?.activeKeys.length || 0}</div>
              <div className="stat-desc">
                {hookStatus?.activeKeys.length ? hookStatus.activeKeys.join(', ') : 'None'}
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Last Error</div>
              <div className="stat-value text-sm break-all">{hookStatus?.lastError || 'None'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Window State */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Window State</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">Active Process:</span>
              <span className="font-mono">{windowState?.process?.name || 'None'}</span>
            </div>
            {windowState?.process?.title && (
              <div className="flex justify-between">
                <span className="font-semibold">Window Title:</span>
                <span className="text-sm truncate max-w-md">{windowState.process.title}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-semibold">Fullscreen:</span>
              <span className={windowState?.isFullscreen ? 'text-success' : 'text-error'}>
                {windowState?.isFullscreen ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Conditions Met:</span>
              <span className={windowState?.conditionsMet ? 'text-success' : 'text-warning'}>
                {windowState?.conditionsMet ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hook Diagnostics */}
      {diagnostics && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Hook Diagnostics</h2>
            <div className="stats stats-vertical lg:stats-horizontal shadow">
              <div className="stat">
                <div className="stat-title">Total Events</div>
                <div className="stat-value text-2xl">{diagnostics.totalEventsProcessed}</div>
              </div>

              <div className="stat">
                <div className="stat-title">Key Down</div>
                <div className="stat-value text-2xl">{diagnostics.keyDownEvents}</div>
              </div>

              <div className="stat">
                <div className="stat-title">Key Up</div>
                <div className="stat-value text-2xl">{diagnostics.keyUpEvents}</div>
              </div>
            </div>

            <div className="stats stats-vertical lg:stats-horizontal shadow mt-4">
              <div className="stat">
                <div className="stat-title">Simulated Events</div>
                <div className="stat-value text-2xl text-info">{diagnostics.simulatedEvents}</div>
                <div className="stat-desc">Events injected by SnapKey</div>
              </div>

              <div className="stat">
                <div className="stat-title">Conflicts Resolved</div>
                <div className="stat-value text-2xl text-success">
                  {diagnostics.conflictsResolved}
                </div>
                <div className="stat-desc">Opposing keys suppressed</div>
              </div>
            </div>

            {diagnostics.lastError && (
              <div className="alert alert-error mt-4">
                <span>{diagnostics.lastError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Summary */}
      {settings && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Current Settings</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Active Profile:</span>
                <span>
                  {settings.profiles.find(p => p.id === settings.activeProfileId)?.name || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Total Profiles:</span>
                <span>{settings.profiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Fullscreen Only:</span>
                <span className={settings.fullscreenOnly ? 'text-success' : ''}>
                  {settings.fullscreenOnly ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Target Process:</span>
                <span className="font-mono">{settings.targetProcess || 'All'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Theme:</span>
                <span className="capitalize">{settings.theme}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
