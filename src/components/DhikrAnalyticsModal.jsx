import React from 'react';
import {
  HiChartBar,
  HiClock,
  HiXMark,
  HiTrash
} from 'react-icons/hi2';

export default function DhikrAnalyticsModal({
  isOpen = true,
  onClose,
  stats,
  history = [],
  onClearHistory,
  isPage = true
}) {
  if (!isOpen && !isPage) return null;

  return (
    <div className={isPage ? "page-view-container" : "modal-backdrop"} onClick={isPage ? undefined : onClose}>
      <div className={isPage ? "page-view-card analytics-modal" : "modal-content analytics-modal"} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
              <HiChartBar />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>Session Analytics & History</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Live telemetry and recitations log
              </p>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close Analytics">
            <HiXMark />
          </button>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-label">Total Increments</span>
            <span className="stat-val" style={{ color: '#6ee7b7' }}>
              {stats.totalIncrements}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Total Decrements</span>
            <span className="stat-val" style={{ color: '#fda4af' }}>
              {stats.totalDecrements}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Highest Peak</span>
            <span className="stat-val">
              {stats.maxEver}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Lowest Valley</span>
            <span className="stat-val">
              {stats.minEver}
            </span>
          </div>
        </div>

        {/* Activity History Audit Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: 'var(--radius-md)', padding: '0.9rem' }}>
          <div className="sidebar-card-title" style={{ marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
              <HiClock /> Activity History Log
            </span>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                style={{
                  background: 'transparent',
                  color: '#fda4af',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
                title="Clear history log"
              >
                <HiTrash /> Clear Log
              </button>
            )}
          </div>

          <div className="history-list" style={{ maxHeight: '240px' }}>
            {history.length === 0 ? (
              <div className="empty-history" style={{ padding: '1.25rem 0' }}>
                No recitations logged in this session yet.
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-info">
                    <span className={`history-tag ${
                      item.type === 'up' ? 'tag-up' : item.type === 'down' ? 'tag-down' : 'tag-reset'
                    }`}>
                      {item.delta > 0 ? `+${item.delta}` : item.delta}
                    </span>
                    <div className="history-details">
                      <span className="history-action-text">{item.counterTitle}</span>
                      <span className="history-time">{item.time}</span>
                    </div>
                  </div>
                  <span className="history-new-val">→ {item.nextVal}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '0.25rem' }}>
          <button type="button" className="modal-btn-confirm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
