import React from 'react';
import { HiXMark } from 'react-icons/hi2';
import { FaHeadphones, FaBluetooth } from 'react-icons/fa6';
import { soundFx } from '../utils/audio';

export default function EarbudModal({
  isOpen = true,
  onClose,
  isEarbudActive,
  onToggleEarbudMode,
  onTestClick,
  isPage = true
}) {
  if (!isOpen && !isPage) return null;

  return (
    <div className={isPage ? "page-view-container" : "modal-backdrop"} onClick={isPage ? undefined : onClose}>
      <div className={isPage ? "page-view-card earbud-modal" : "modal-content earbud-modal"} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
              <FaHeadphones />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>Wireless Earbud Tasbeeh</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Count Zikr by tapping your AirPods or Bluetooth Earbuds
              </p>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close Earbud Modal">
            <HiXMark />
          </button>
        </div>

        {/* Live Status Card */}
        <div className="earbud-status-card" style={{
          background: isEarbudActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.7)',
          borderColor: isEarbudActive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: isEarbudActive ? '#6ee7b7' : '#94a3b8' }}>
              <FaBluetooth style={{ color: isEarbudActive ? '#38bdf8' : '#64748b' }} />
              {isEarbudActive ? 'Earbud Tap Mode: ACTIVE 🎧' : 'Earbud Tap Mode: Disconnected'}
            </span>

            <button
              type="button"
              className={`earbud-toggle-btn ${isEarbudActive ? 'active' : ''}`}
              onClick={() => {
                soundFx.playClick('up');
                onToggleEarbudMode();
              }}
            >
              {isEarbudActive ? 'Turn Off' : 'Connect & Start'}
            </button>
          </div>

          <p style={{ fontSize: '0.76rem', color: isEarbudActive ? '#a7f3d0' : 'var(--text-muted)', margin: '0.5rem 0 0' }}>
            {isEarbudActive
              ? '✓ Ready! Squeeze or tap your earbud now. Every tap will advance your Dhikr count with an audio click in your ear.'
              : 'Turn on to forward Play/Pause and Next-Track gestures from your wireless earbuds directly to NoorTasbih.'}
          </p>
        </div>

        {/* Gesture Controls Guide */}
        <div className="gesture-guide-list">
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
            Supported Earbud Gestures
          </h4>

          <div className="gesture-item">
            <span className="gesture-badge">Single Tap / Stem Squeeze</span>
            <div className="gesture-details">
              <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>Count +1 (Increment)</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Press or tap either left or right earbud</span>
            </div>
          </div>

          <div className="gesture-item">
            <span className="gesture-badge">Double Tap / Double Squeeze</span>
            <div className="gesture-details">
              <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>Count +1 (Next Track)</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Advances count smoothly</span>
            </div>
          </div>

          <div className="gesture-item">
            <span className="gesture-badge">Triple Tap</span>
            <div className="gesture-details">
              <strong style={{ color: '#fda4af', fontSize: '0.82rem' }}>Subtract -1 (Previous Track)</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Corrects an accidental extra count</span>
            </div>
          </div>

          <div className="gesture-item">
            <span className="gesture-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe' }}>Pocket Mode 📱</span>
            <div className="gesture-details">
              <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>Works with Screen Off / Pocket</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Keep your phone in your pocket while walking or commuting</span>
            </div>
          </div>
        </div>

        {/* Test Tap Button */}
        <button
          type="button"
          className="test-notification-btn"
          style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#67e8f9' }}
          onClick={() => {
            soundFx.playClick('up');
            if (onTestClick) onTestClick();
          }}
        >
          <FaHeadphones /> Test Simulated Earbud Tap (+1)
        </button>

        <div className="modal-footer" style={{ marginTop: '0.25rem' }}>
          <button type="button" className="modal-btn-confirm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
