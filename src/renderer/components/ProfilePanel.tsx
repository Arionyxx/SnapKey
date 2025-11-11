import { useState } from 'react';
import { useAppStore } from '../store';
import { KeybindEditor } from './KeybindEditor';
import type { KeybindProfile } from '../../shared/ipc';

export function ProfilePanel() {
  const { settings, profiles, setSelectedProfileId, selectedProfileId } = useAppStore();
  const [editingProfile, setEditingProfile] = useState<KeybindProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');

  if (!settings) return null;

  const activeProfile = profiles.find(p => p.id === settings.activeProfileId);
  const selectedProfile = selectedProfileId
    ? profiles.find(p => p.id === selectedProfileId)
    : activeProfile;

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;

    try {
      const profile = await window.api.profile.create({
        name: newProfileName.trim(),
        description: newProfileDescription.trim() || undefined,
        keybinds: [],
      });
      console.log('[Renderer] Profile created:', profile);
      setIsCreating(false);
      setNewProfileName('');
      setNewProfileDescription('');
      setSelectedProfileId(profile.id);
    } catch (err) {
      console.error('Error creating profile:', err);
      alert(`Error creating profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      await window.api.profile.delete(profileId);
      console.log('[Renderer] Profile deleted:', profileId);
      if (selectedProfileId === profileId) {
        setSelectedProfileId(null);
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      alert(`Error deleting profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSetActive = async (profileId: string) => {
    try {
      await window.api.profile.setActive(profileId);
      console.log('[Renderer] Active profile set:', profileId);
    } catch (err) {
      console.error('Error setting active profile:', err);
      alert(
        `Error setting active profile: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleUpdateProfile = async (profileId: string, name: string, description?: string) => {
    try {
      await window.api.profile.update(profileId, { name, description });
      console.log('[Renderer] Profile updated:', profileId);
      setEditingProfile(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(`Error updating profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Profile List Sidebar */}
      <div className="w-80 flex flex-col bg-base-200 shadow-xl rounded-lg overflow-hidden">
        <div className="p-4 bg-base-300">
          <h2 className="text-xl font-bold">Profiles</h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`card bg-base-100 shadow cursor-pointer transition-all ${
                selectedProfileId === profile.id
                  ? 'ring-2 ring-primary'
                  : 'hover:ring-2 hover:ring-base-content/20'
              }`}
              onClick={() => setSelectedProfileId(profile.id)}
            >
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold">{profile.name}</h3>
                    {profile.description && (
                      <p className="text-sm opacity-60 mt-1">{profile.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="badge badge-sm">{profile.keybinds.length} keybinds</div>
                      {settings.activeProfileId === profile.id && (
                        <div className="badge badge-success badge-sm">Active</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Profile Button */}
        <div className="p-4 bg-base-300">
          <button className="btn btn-primary btn-block" onClick={() => setIsCreating(true)}>
            + New Profile
          </button>
        </div>
      </div>

      {/* Profile Details / Editor */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {selectedProfile ? (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingProfile?.id === selectedProfile.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={editingProfile.name}
                          onChange={e =>
                            setEditingProfile({ ...editingProfile, name: e.target.value })
                          }
                          placeholder="Profile name"
                        />
                        <textarea
                          className="textarea textarea-bordered w-full"
                          value={editingProfile.description || ''}
                          onChange={e =>
                            setEditingProfile({ ...editingProfile, description: e.target.value })
                          }
                          placeholder="Profile description (optional)"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              handleUpdateProfile(
                                editingProfile.id,
                                editingProfile.name,
                                editingProfile.description
                              )
                            }
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingProfile(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="card-title">{selectedProfile.name}</h2>
                        {selectedProfile.description && (
                          <p className="opacity-60 mt-1">{selectedProfile.description}</p>
                        )}
                      </>
                    )}
                  </div>
                  {!editingProfile && (
                    <div className="dropdown dropdown-end">
                      <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                        ⋮
                      </button>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                      >
                        {settings.activeProfileId !== selectedProfile.id && (
                          <li>
                            <button onClick={() => handleSetActive(selectedProfile.id)}>
                              Set as Active
                            </button>
                          </li>
                        )}
                        <li>
                          <button onClick={() => setEditingProfile(selectedProfile)}>Edit</button>
                        </li>
                        <li>
                          <button
                            className="text-error"
                            onClick={() => handleDeleteProfile(selectedProfile.id)}
                          >
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Profile Stats */}
                <div className="flex gap-2 mt-4">
                  <div className="badge badge-outline">
                    {selectedProfile.keybinds.length} keybinds
                  </div>
                  {settings.activeProfileId === selectedProfile.id && (
                    <div className="badge badge-success">Active Profile</div>
                  )}
                </div>
              </div>
            </div>

            {/* Keybind Editor */}
            <KeybindEditor profile={selectedProfile} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center opacity-60">
              <p className="text-lg">Select a profile to view details</p>
              <p className="text-sm mt-2">or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Profile Modal */}
      {isCreating && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Create New Profile</h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Profile Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g., WASD Movement"
                className="input input-bordered w-full"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Description (optional)</span>
              </label>
              <textarea
                placeholder="e.g., Default profile for WASD movement keys"
                className="textarea textarea-bordered"
                value={newProfileDescription}
                onChange={e => setNewProfileDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={handleCreateProfile}
                disabled={!newProfileName.trim()}
              >
                Create
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setIsCreating(false);
                  setNewProfileName('');
                  setNewProfileDescription('');
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
