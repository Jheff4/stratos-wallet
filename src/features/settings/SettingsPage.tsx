import { useState } from 'react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your profile and preferences</p>
      </div>

      <div className="page-body flex-col gap-5" style={{ maxWidth: 620 }}>
        {/* Profile */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Profile</div>
              <div className="card-subtitle">Your personal information</div>
            </div>
          </div>
          <div className="card-body flex-col gap-4">
            <div className="flex gap-4 items-center">
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                E
              </div>
              <div>
                <div className="font-semibold">Etinosa</div>
                <div className="text-sm text-muted">etinosa@example.com</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-control" defaultValue="Etinosa" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-control" defaultValue="" placeholder="—" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" defaultValue="etinosa@example.com" />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Preferences</div>
              <div className="card-subtitle">Notification and display settings</div>
            </div>
          </div>
          <div className="card-body flex-col gap-4">
            {[
              { label: 'Live transaction notifications', sub: 'Show a toast when new transactions arrive via WebSocket', defaultChecked: true },
              { label: 'Sound alerts', sub: 'Play a sound on new high-value transactions', defaultChecked: false },
              { label: 'Compact view', sub: 'Show more rows per page in tables', defaultChecked: false },
            ].map(({ label, sub, defaultChecked }) => (
              <label key={label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
                  <div className="text-sm text-muted" style={{ marginTop: 2 }}>{sub}</div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={defaultChecked}
                  style={{ accentColor: 'var(--color-brand)', width: 16, height: 16, marginTop: 2, cursor: 'pointer', flexShrink: 0 }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Security</div>
              <div className="card-subtitle">Authentication and access</div>
            </div>
          </div>
          <div className="card-body flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Two-factor authentication</div>
                <div className="text-sm text-muted">Add an extra layer of security</div>
              </div>
              <span className="badge badge-neutral">Not enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Active sessions</div>
                <div className="text-sm text-muted">1 device currently active</div>
              </div>
              <button className="btn btn-secondary btn-sm">Manage</button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
          {saved && <span style={{ fontSize: 13, color: 'var(--color-success)' }}>✓ Saved</span>}
        </div>
      </div>
    </>
  );
}
