import { useEffect } from 'react';
import { useAppStore } from '../store';

export function useAppInitialize() {
  const {
    setSettings,
    setHookStatus,
    setWindowState,
    setProfiles,
    setProcessList,
    setLoading,
    setError,
  } = useAppStore();

  useEffect(() => {
    console.log('[Renderer] Initializing app...');

    const initializeApp = async () => {
      try {
        // Fetch initial data in parallel
        const [settings, hookStatus, windowState, processList] = await Promise.all([
          window.api.settings.get(),
          window.api.hook.getStatus(),
          window.api.process.getFullscreenState(),
          window.api.process.list().catch(() => []), // Optional, don't fail if unavailable
        ]);

        console.log('[Renderer] Initial settings:', settings);
        console.log('[Renderer] Initial hook status:', hookStatus);
        console.log('[Renderer] Initial window state:', windowState);
        console.log('[Renderer] Process list:', processList.length, 'processes');

        setSettings(settings);
        setHookStatus(hookStatus);
        setWindowState(windowState);
        setProfiles(settings.profiles);
        setProcessList(processList);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Renderer] Error initializing app:', errorMessage);
        setError(errorMessage);
        setLoading(false);
      }
    };

    initializeApp();

    // Subscribe to real-time updates
    console.log('[Renderer] Subscribing to updates...');

    const unsubscribeSettings = window.api.settings.onUpdated(updatedSettings => {
      console.log('[Renderer] Settings updated:', updatedSettings);
      setSettings(updatedSettings);
      setProfiles(updatedSettings.profiles);
    });

    const unsubscribeHook = window.api.hook.onStatusUpdated(updatedStatus => {
      console.log('[Renderer] Hook status updated:', updatedStatus);
      setHookStatus(updatedStatus);
    });

    const unsubscribeWindowState = window.api.windowState.onUpdated(updatedState => {
      console.log('[Renderer] Window state updated:', updatedState);
      setWindowState(updatedState);
    });

    // Refresh process list periodically
    const processListInterval = setInterval(async () => {
      try {
        const processes = await window.api.process.list();
        setProcessList(processes);
      } catch (err) {
        console.error('[Renderer] Error refreshing process list:', err);
      }
    }, 5000); // Every 5 seconds

    return () => {
      console.log('[Renderer] Cleaning up subscriptions...');
      unsubscribeSettings();
      unsubscribeHook();
      unsubscribeWindowState();
      clearInterval(processListInterval);
    };
  }, [
    setSettings,
    setHookStatus,
    setWindowState,
    setProfiles,
    setProcessList,
    setLoading,
    setError,
  ]);
}
