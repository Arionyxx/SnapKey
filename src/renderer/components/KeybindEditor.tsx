import { useState, useEffect } from 'react';
import { vkCodeToName } from '../utils/keycodes';
import type { KeybindProfile, KeybindCombo } from '../../shared/ipc';

interface KeybindEditorProps {
  profile: KeybindProfile;
}

interface KeyCaptureState {
  active: boolean;
  keys: number[];
  keybindId?: string;
}

export function KeybindEditor({ profile }: KeybindEditorProps) {
  const [keyCaptureState, setKeyCaptureState] = useState<KeyCaptureState>({
    active: false,
    keys: [],
  });
  const [editingKeybind, setEditingKeybind] = useState<KeybindCombo | null>(null);
  const [newGroupId, setNewGroupId] = useState('');
  const [newAllowSimultaneous, setNewAllowSimultaneous] = useState(false);

  // Handle key capture
  useEffect(() => {
    if (!keyCaptureState.active) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Convert browser keyCode to VK code (they're mostly the same)
      const vkCode = e.keyCode || e.which;

      // Don't capture modifier keys alone
      if ([16, 17, 18, 91, 93].includes(vkCode)) return;

      setKeyCaptureState(prev => {
        if (!prev.keys.includes(vkCode)) {
          return { ...prev, keys: [...prev.keys, vkCode] };
        }
        return prev;
      });
    };

    const handleKeyUp = () => {
      // Optional: could auto-finish capture on first key release
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [keyCaptureState.active]);

  const startKeyCapture = (keybindId?: string) => {
    setKeyCaptureState({ active: true, keys: [], keybindId });
  };

  const finishKeyCapture = async () => {
    const { keys, keybindId } = keyCaptureState;

    if (keys.length === 0) {
      setKeyCaptureState({ active: false, keys: [] });
      return;
    }

    try {
      if (keybindId) {
        // Update existing keybind
        await window.api.keybind.update(profile.id, keybindId, { keys });
      } else if (editingKeybind) {
        // Finish creating new keybind
        await window.api.keybind.create(profile.id, {
          keys,
          groupId: newGroupId || 'default',
          allowSimultaneous: newAllowSimultaneous,
        });
        setEditingKeybind(null);
        setNewGroupId('');
        setNewAllowSimultaneous(false);
      }
    } catch (err) {
      console.error('Error saving keybind:', err);
      alert(`Error saving keybind: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    setKeyCaptureState({ active: false, keys: [] });
  };

  const cancelKeyCapture = () => {
    setKeyCaptureState({ active: false, keys: [] });
  };

  const handleDeleteKeybind = async (keybindId: string) => {
    if (!confirm('Are you sure you want to delete this keybind?')) return;

    try {
      await window.api.keybind.delete(profile.id, keybindId);
      console.log('[Renderer] Keybind deleted:', keybindId);
    } catch (err) {
      console.error('Error deleting keybind:', err);
      alert(`Error deleting keybind: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleToggleAllowSimultaneous = async (keybindId: string, current: boolean) => {
    try {
      await window.api.keybind.update(profile.id, keybindId, {
        allowSimultaneous: !current,
      });
    } catch (err) {
      console.error('Error updating keybind:', err);
    }
  };

  // Future feature: Update group ID for a keybind
  // const handleUpdateGroupId = async (keybindId: string, groupId: string) => {
  //   try {
  //     await window.api.keybind.update(profile.id, keybindId, { groupId });
  //   } catch (err) {
  //     console.error('Error updating keybind:', err);
  //   }
  // };

  // Group keybinds by groupId
  const groupedKeybinds = profile.keybinds.reduce(
    (acc, keybind) => {
      if (!acc[keybind.groupId]) {
        acc[keybind.groupId] = [];
      }
      acc[keybind.groupId].push(keybind);
      return acc;
    },
    {} as Record<string, KeybindCombo[]>
  );

  const uniqueGroups = Object.keys(groupedKeybinds);

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Keybinds</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setEditingKeybind({} as KeybindCombo)}
          >
            + Add Keybind
          </button>
        </div>

        {/* Keybind Groups */}
        {uniqueGroups.length > 0 ? (
          <div className="space-y-4">
            {uniqueGroups.map(groupId => (
              <div key={groupId} className="card bg-base-100 shadow">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm uppercase opacity-60">{groupId}</h4>
                    <div className="badge badge-sm">
                      {groupedKeybinds[groupId][0].allowSimultaneous ? 'Simultaneous' : 'Exclusive'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {groupedKeybinds[groupId].map(keybind => (
                      <div
                        key={keybind.id}
                        className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {keybind.keys.map((vkCode, idx) => (
                            <span key={idx}>
                              <span className="key-badge">{vkCodeToName(vkCode)}</span>
                              {idx < keybind.keys.length - 1 && (
                                <span className="mx-1 opacity-60">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => startKeyCapture(keybind.id)}
                          >
                            ⌨️ Remap
                          </button>
                          <div className="dropdown dropdown-end">
                            <button tabIndex={0} className="btn btn-ghost btn-xs">
                              ⚙️
                            </button>
                            <ul
                              tabIndex={0}
                              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                            >
                              <li>
                                <button
                                  onClick={() =>
                                    handleToggleAllowSimultaneous(
                                      keybind.id,
                                      keybind.allowSimultaneous
                                    )
                                  }
                                >
                                  {keybind.allowSimultaneous
                                    ? 'Make Exclusive'
                                    : 'Allow Simultaneous'}
                                </button>
                              </li>
                              <li>
                                <button
                                  className="text-error"
                                  onClick={() => handleDeleteKeybind(keybind.id)}
                                >
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 opacity-60">
            <p>No keybinds configured</p>
            <p className="text-sm mt-2">Click &quot;Add Keybind&quot; to get started</p>
          </div>
        )}
      </div>

      {/* Key Capture Modal */}
      {keyCaptureState.active && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Press Keys</h3>
            <p className="py-4">Press the keys you want to bind. Press ESC to cancel.</p>

            <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-base-200 rounded-lg">
              {keyCaptureState.keys.length > 0 ? (
                keyCaptureState.keys.map((vkCode, idx) => (
                  <span key={idx}>
                    <span className="key-badge text-lg">{vkCodeToName(vkCode)}</span>
                    {idx < keyCaptureState.keys.length - 1 && (
                      <span className="mx-2 text-lg opacity-60">+</span>
                    )}
                  </span>
                ))
              ) : (
                <span className="opacity-60">Waiting for input...</span>
              )}
            </div>

            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={finishKeyCapture}
                disabled={keyCaptureState.keys.length === 0}
              >
                Save
              </button>
              <button className="btn btn-ghost" onClick={cancelKeyCapture}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Keybind Modal */}
      {editingKeybind && !keyCaptureState.active && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Create Keybind</h3>

            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Group ID</span>
              </label>
              <input
                type="text"
                placeholder="e.g., vertical, horizontal, actions"
                className="input input-bordered w-full"
                value={newGroupId}
                onChange={e => setNewGroupId(e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt">
                  Keys in the same group will be managed together
                </span>
              </label>
            </div>

            <div className="form-control mt-4">
              <label className="label cursor-pointer">
                <span className="label-text">Allow Simultaneous Press</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={newAllowSimultaneous}
                  onChange={e => setNewAllowSimultaneous(e.target.checked)}
                />
              </label>
              <label className="label">
                <span className="label-text-alt">
                  {newAllowSimultaneous
                    ? 'Keys can be pressed at the same time'
                    : 'Pressing one key will release others in the group'}
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={() => startKeyCapture()}
                disabled={!newGroupId.trim()}
              >
                Capture Keys
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditingKeybind(null);
                  setNewGroupId('');
                  setNewAllowSimultaneous(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
