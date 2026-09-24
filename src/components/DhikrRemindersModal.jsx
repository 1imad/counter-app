import React, { useState } from 'react';
import {
  HiBellAlert,
  HiXMark,
  HiClock,
  HiSun,
  HiMoon,
  HiSparkles,
  HiSpeakerWave
} from 'react-icons/hi2';
import { soundFx } from '../utils/audio';

export default function DhikrRemindersModal({
  isOpen = true,
  onClose,
  reminderSettings,
  onSaveSettings,
  onTriggerTestNotification,
  isPage = true
}) {
  const [form, setForm] = useState(() => ({
    enabled: reminderSettings?.enabled ?? true,
    intervalMinutes: reminderSettings?.intervalMinutes ?? 30,
    morningAdhkarEnabled: reminderSettings?.morningAdhkarEnabled ?? true,
    morningAdhkarTime: reminderSettings?.morningAdhkarTime ?? '06:30',
    eveningAdhkarEnabled: reminderSettings?.eveningAdhkarEnabled ?? true,
    eveningAdhkarTime: reminderSettings?.eveningAdhkarTime ?? '17:30',
    selectedDhikrType: reminderSettings?.selectedDhikrType ?? 'all'
  }));

  const [permStatus, setPermStatus] = useState(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  });

  if (!isOpen && !isPage) return null;

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('This browser does not support system notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermStatus(permission);
      if (permission === 'granted') {
        soundFx.playChime();
      }
    } catch (err) {
      console.error('Error requesting notification permission', err);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings(form);
    soundFx.playClick('up');
    onClose();
  };

  const handleTest = () => {
    soundFx.playChime();
    onTriggerTestNotification(form.selectedDhikrType);
  };

  return (
    <div className={isPage ? "page-view-container" : "modal-backdrop"} onClick={isPage ? undefined : onClose}>
      <div className={isPage ? "page-view-card reminders-modal" : "modal-content reminders-modal"} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
              <HiBellAlert />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>Zikr & Askar Reminders</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Never miss your daily spiritual remembrance
              </p>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close Reminders">
            <HiXMark />
          </button>
        </div>

        {/* Browser Permission Banner */}
        <div className="permission-banner">
          <div className="perm-info">
            <span className="perm-status-badge" style={{
              background: permStatus === 'granted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: permStatus === 'granted' ? '#6ee7b7' : '#fcd34d',
              border: `1px solid ${permStatus === 'granted' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
            }}>
              System Push: {permStatus === 'granted' ? '✓ Allowed' : permStatus === 'denied' ? '✗ Blocked' : 'Action Required'}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {permStatus === 'granted'
                ? 'System alerts & audio chimes are fully active.'
                : 'Enable system notifications to receive alerts even while browsing other tabs.'}
            </span>
          </div>

          {permStatus !== 'granted' && (
            <button
              type="button"
              className="req-perm-btn"
              onClick={requestNotificationPermission}
            >
              Enable Notifications
            </button>
          )}
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Toggle Reminders Master */}
          <div className="reminder-toggle-row">
            <div>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ffffff' }}>
                Enable Adhkar Reminders
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                Receive gentle alerts with pleasant chime audio
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm({ ...form, enabled: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          {form.enabled && (
            <>
              {/* Recurring Interval */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <HiClock /> Regular Recurring Interval
                </label>
                <div className="interval-selector-grid">
                  {[15, 30, 60, 120].map(mins => (
                    <button
                      type="button"
                      key={mins}
                      className={`interval-btn ${form.intervalMinutes === mins ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, intervalMinutes: mins })}
                    >
                      {mins < 60 ? `Every ${mins}m` : `Every ${mins / 60}h`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Morning & Evening Adhkar Timers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="adhkar-time-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <HiSun /> Morning Adhkar
                    </span>
                    <input
                      type="checkbox"
                      checked={form.morningAdhkarEnabled}
                      onChange={e => setForm({ ...form, morningAdhkarEnabled: e.target.checked })}
                    />
                  </div>
                  <input
                    type="time"
                    value={form.morningAdhkarTime}
                    disabled={!form.morningAdhkarEnabled}
                    onChange={e => setForm({ ...form, morningAdhkarTime: e.target.value })}
                    className="form-input"
                    style={{ opacity: form.morningAdhkarEnabled ? 1 : 0.4 }}
                  />
                </div>

                <div className="adhkar-time-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <HiMoon /> Evening Adhkar
                    </span>
                    <input
                      type="checkbox"
                      checked={form.eveningAdhkarEnabled}
                      onChange={e => setForm({ ...form, eveningAdhkarEnabled: e.target.checked })}
                    />
                  </div>
                  <input
                    type="time"
                    value={form.eveningAdhkarTime}
                    disabled={!form.eveningAdhkarEnabled}
                    onChange={e => setForm({ ...form, eveningAdhkarTime: e.target.value })}
                    className="form-input"
                    style={{ opacity: form.eveningAdhkarEnabled ? 1 : 0.4 }}
                  />
                </div>
              </div>

              {/* Remind me with which Dhikr */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <HiSparkles /> Dhikr Focus
                </label>
                <select
                  value={form.selectedDhikrType}
                  onChange={e => setForm({ ...form, selectedDhikrType: e.target.value })}
                  className="form-input"
                  style={{ background: 'rgba(15, 23, 42, 0.9)' }}
                >
                  <option value="all">Rotating Sunnah Adhkar (Random inspiration)</option>
                  <option value="subhanallah">SubhanAllah • سُبْحَانَ ٱللَّٰهِ</option>
                  <option value="alhamdulillah">Alhamdulillah • ٱلْحَمْدُ لِلَّٰهِ</option>
                  <option value="allahuakbar">Allahu Akbar • ٱللَّٰهُ أَكْبَرُ</option>
                  <option value="istighfar">Astaghfirullah (Seeking Forgiveness)</option>
                  <option value="salawat">Durood / Salawat on the Prophet ﷺ</option>
                  <option value="tahlil">La ilaha illallah (The Best Remembrance)</option>
                </select>
              </div>

              {/* Test Notification Row */}
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="test-notification-btn"
                  onClick={handleTest}
                  title="Send an immediate test notification with sound"
                >
                  <HiSpeakerWave /> Send Test Reminder
                </button>
              </div>
            </>
          )}

          <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-confirm">
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
