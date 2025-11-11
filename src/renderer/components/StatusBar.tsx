import { useAppStore } from '../store';

export function StatusBar() {
  const { hookStatus, windowState, settings } = useAppStore();

  const isHookActive = hookStatus?.enabled && windowState?.conditionsMet;

  return (
    <div className="flex items-center gap-4">
      {/* Hook Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className={`h-3 w-3 rounded-full ${
              isHookActive ? 'bg-success' : hookStatus?.enabled ? 'bg-warning' : 'bg-error'
            }`}
          />
          {isHookActive && (
            <div className="absolute inset-0 h-3 w-3 rounded-full bg-success animate-ping opacity-75" />
          )}
        </div>
        <span className="text-sm">
          {isHookActive ? 'Active' : hookStatus?.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Fullscreen Indicator */}
      {settings?.fullscreenOnly && (
        <div
          className="tooltip tooltip-bottom"
          data-tip={windowState?.isFullscreen ? 'Fullscreen detected' : 'Waiting for fullscreen'}
        >
          <div className="badge badge-sm gap-1">
            <span>{windowState?.isFullscreen ? '🖥️' : '⏸️'}</span>
            <span>Fullscreen</span>
          </div>
        </div>
      )}

      {/* Target Process Indicator */}
      {settings?.targetProcess && (
        <div
          className="tooltip tooltip-bottom"
          data-tip={windowState?.process ? `Active: ${windowState.process.name}` : 'No process'}
        >
          <div className="badge badge-sm gap-1">
            <span>{windowState?.process ? '🎯' : '⏸️'}</span>
            <span className="max-w-[100px] truncate">{settings.targetProcess}</span>
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      <button
        className="btn btn-ghost btn-sm btn-circle"
        onClick={async () => {
          if (!settings) return;
          const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
          await window.api.settings.set({ theme: newTheme });
        }}
      >
        {settings?.theme === 'dark' ? '🌙' : '☀️'}
      </button>
    </div>
  );
}
