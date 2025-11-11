import { create } from 'zustand';
import type { Settings, HookStatus, WindowState, KeybindProfile, ProcessInfo } from '../shared/ipc';

interface AppState {
  // Core state
  settings: Settings | null;
  hookStatus: HookStatus | null;
  windowState: WindowState | null;
  profiles: KeybindProfile[];
  processList: ProcessInfo[];

  // UI state
  loading: boolean;
  error: string | null;
  selectedProfileId: string | null;

  // Actions
  setSettings: (settings: Settings) => void;
  setHookStatus: (status: HookStatus) => void;
  setWindowState: (state: WindowState) => void;
  setProfiles: (profiles: KeybindProfile[]) => void;
  setProcessList: (processes: ProcessInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedProfileId: (id: string | null) => void;

  // Helper methods
  getActiveProfile: () => KeybindProfile | undefined;
  getProfileById: (id: string) => KeybindProfile | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  settings: null,
  hookStatus: null,
  windowState: null,
  profiles: [],
  processList: [],
  loading: true,
  error: null,
  selectedProfileId: null,

  // Actions
  setSettings: settings => set({ settings }),
  setHookStatus: hookStatus => set({ hookStatus }),
  setWindowState: windowState => set({ windowState }),
  setProfiles: profiles => set({ profiles }),
  setProcessList: processList => set({ processList }),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
  setSelectedProfileId: selectedProfileId => set({ selectedProfileId }),

  // Helper methods
  getActiveProfile: () => {
    const { settings, profiles } = get();
    if (!settings) return undefined;
    return profiles.find(p => p.id === settings.activeProfileId);
  },

  getProfileById: id => {
    const { profiles } = get();
    return profiles.find(p => p.id === id);
  },
}));
