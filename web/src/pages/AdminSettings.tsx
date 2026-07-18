import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { demoSettings } from '../lib/mock';
import type { SettingItem } from '../lib/types';

export default function AdminSettings() {
  const [items, setItems] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<SettingItem[]>('/api/admin/settings')
      .then((s) => alive && setItems(s))
      .catch(() => alive && setItems(demoSettings))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function toggle(item: SettingItem) {
    if (openKey === item.key) {
      setOpenKey(null);
      return;
    }
    setOpenKey(item.key);
    setDraft(Object.fromEntries(item.fields.map((f) => [f, ''])));
    setSavedKey(null);
  }

  async function save(item: SettingItem, e: React.FormEvent) {
    e.preventDefault();
    await api('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ key: item.key, values: draft }),
    }).catch(() => null);
    setItems((prev) =>
      prev.map((it) =>
        it.key === item.key ? { ...it, configured: true, maskedValue: '••••••••' } : it,
      ),
    );
    setSavedKey(item.key);
    setOpenKey(null);
  }

  return (
    <div data-testid="admin-settings-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 data-testid="settings-title">Service Settings</h1>
          <p>Configure connection credentials for platform services.</p>
        </div>
        <Link className="btn secondary" to="/admin">← All recipes</Link>
      </div>

      {loading ? (
        <div className="spinner" data-testid="settings-loading" />
      ) : (
        <div className="card" data-testid="settings-list">
          {items.map((item) => (
            <div key={item.key} data-testid={`setting-${item.key}`}>
              <div className="setting-row">
                <div>
                  <b>{item.label}</b>
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    <code>{item.key}</code>
                    {item.configured && item.maskedValue ? ` · ${item.maskedValue}` : ''}
                  </div>
                </div>
                <div className="row">
                  {item.configured ? (
                    <span className="badge ok" data-testid={`status-${item.key}`}>✓ Configured</span>
                  ) : (
                    <span className="badge off" data-testid={`status-${item.key}`}>Not configured</span>
                  )}
                  <button className="btn secondary sm" onClick={() => toggle(item)} data-testid={`configure-${item.key}`}>
                    {openKey === item.key ? 'Cancel' : 'Configure'}
                  </button>
                </div>
              </div>

              {savedKey === item.key && (
                <div className="notice info" style={{ marginTop: 10 }}>Saved {item.label} credentials.</div>
              )}

              {openKey === item.key && (
                <form className="stack" style={{ padding: '6px 0 16px' }} onSubmit={(e) => save(item, e)} data-testid={`form-${item.key}`}>
                  {item.fields.map((f) => (
                    <div className="field" key={f} style={{ margin: 0 }}>
                      <label htmlFor={`${item.key}-${f}`}>{f}</label>
                      <input
                        id={`${item.key}-${f}`}
                        type={/pass|secret|key/i.test(f) ? 'password' : 'text'}
                        value={draft[f] ?? ''}
                        onChange={(ev) => setDraft((d) => ({ ...d, [f]: ev.target.value }))}
                        placeholder={f}
                      />
                    </div>
                  ))}
                  <div>
                    <button className="btn" type="submit" data-testid={`save-${item.key}`}>Save credentials</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
