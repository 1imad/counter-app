import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  HiPlus,
  HiMinus,
  HiArrowPath,
  HiPlay,
  HiPause,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiSparkles,
  HiArrowUturnLeft,
  HiChartBar,
  HiFlag,
  HiPlusCircle,
  HiBolt,
  HiFire,
  HiClock,
  HiTrash,
  HiPencilSquare,
  HiXMark,
  HiCheck
} from 'react-icons/hi2';
import { soundFx } from './utils/audio';
import './App.css';

const DEFAULT_COUNTERS = [
  {
    id: 'c-1',
    title: 'Daily Water Tracker',
    category: 'Wellness & Habit',
    value: 5,
    step: 1,
    target: 8,
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)'
  },
  {
    id: 'c-2',
    title: 'Pushups & Reps',
    category: 'Fitness Routine',
    value: 35,
    step: 5,
    target: 50,
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)'
  },
  {
    id: 'c-3',
    title: 'Deep Work Focus Sessions',
    category: 'Productivity',
    value: 4,
    step: 1,
    target: 6,
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  }
];

const COLOR_THEMES = [
  { name: 'Cyan Neon', hex: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
  { name: 'Electric Purple', hex: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
  { name: 'Emerald Glow', hex: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Amber Solar', hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Rose Burst', hex: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
  { name: 'Indigo Core', hex: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' }
];

export default function App() {
  // Load counters from local storage or defaults
  const [counters, setCounters] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_counters');
      return saved ? JSON.parse(saved) : DEFAULT_COUNTERS;
    } catch {
      return DEFAULT_COUNTERS;
    }
  });

  const [activeId, setActiveId] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_active_id');
      if (saved && counters.some(c => c.id === saved)) return saved;
      return counters[0]?.id || 'c-1';
    } catch {
      return counters[0]?.id || 'c-1';
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_sound_enabled');
      const isSound = saved !== null ? JSON.parse(saved) : true;
      soundFx.toggleSound(isSound);
      return isSound;
    } catch {
      return true;
    }
  });

  const [pulseDirection, setPulseDirection] = useState(null);
  const [isAutoTicking, setIsAutoTicking] = useState(false);

  const [autoTickSpeed, setAutoTickSpeed] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_autotick_speed');
      return saved ? Number(saved) : 1000;
    } catch {
      return 1000;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_stats');
      return saved ? JSON.parse(saved) : {
        totalIncrements: 0,
        totalDecrements: 0,
        maxEver: counters[0]?.value || 0,
        minEver: counters[0]?.value || 0
      };
    } catch {
      return {
        totalIncrements: 0,
        totalDecrements: 0,
        maxEver: counters[0]?.value || 0,
        minEver: counters[0]?.value || 0
      };
    }
  });

  // Modal states
  const [isNewCounterModalOpen, setIsNewCounterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    title: '',
    category: '',
    target: 20,
    step: 1,
    accentColor: COLOR_THEMES[0].hex,
    glowColor: COLOR_THEMES[0].glow
  });

  // Active counter object
  const currentCounter = counters.find(c => c.id === activeId) || counters[0] || {
    id: 'default',
    title: 'Counter',
    category: 'General',
    value: 0,
    step: 1,
    target: 50,
    accentColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.4)'
  };

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem('quantum_counters', JSON.stringify(counters));
    } catch (e) {
      console.error('Failed to save counters to local storage', e);
    }
  }, [counters]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_active_id', activeId);
    } catch (e) {
      console.error('Failed to save active id to local storage', e);
    }
  }, [activeId]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history to local storage', e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_stats', JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats to local storage', e);
    }
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_sound_enabled', JSON.stringify(soundEnabled));
    } catch (e) {
      console.error('Failed to save sound preference to local storage', e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_autotick_speed', autoTickSpeed.toString());
    } catch (e) {
      console.error('Failed to save speed to local storage', e);
    }
  }, [autoTickSpeed]);

  // Update sound engine state
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundFx.toggleSound(nextState);
    if (nextState) soundFx.playClick('up');
  };

  // Trigger visual pulse
  const triggerPulse = (dir) => {
    setPulseDirection(dir);
    setTimeout(() => setPulseDirection(null), 180);
  };

  // Check target celebration
  const checkMilestone = (prevVal, nextVal, target) => {
    if (target > 0 && prevVal < target && nextVal >= target) {
      soundFx.playCelebration();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b']
        });
      } catch (e) {
        // Confetti optional
      }
    }
  };

  // General update value function
  const updateValue = useCallback((delta, label = 'Step') => {
    setCounters(prevCounters =>
      prevCounters.map(item => {
        if (item.id !== activeId) return item;

        const prevVal = item.value;
        const nextVal = prevVal + delta;
        const dir = delta >= 0 ? 'up' : 'down';

        triggerPulse(dir);
        soundFx.playClick(dir);
        checkMilestone(prevVal, nextVal, item.target);

        // Record history
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory(prevHist => [
          {
            id: Math.random().toString(36).substring(2, 9),
            counterId: item.id,
            counterTitle: item.title,
            time: timestamp,
            type: dir,
            delta,
            prevVal,
            nextVal,
            label
          },
          ...prevHist.slice(0, 19)
        ]);

        // Update stats
        setStats(prevStats => ({
          totalIncrements: delta > 0 ? prevStats.totalIncrements + 1 : prevStats.totalIncrements,
          totalDecrements: delta < 0 ? prevStats.totalDecrements + 1 : prevStats.totalDecrements,
          maxEver: Math.max(prevStats.maxEver, nextVal),
          minEver: Math.min(prevStats.minEver, nextVal)
        }));

        return { ...item, value: nextVal };
      })
    );
  }, [activeId]);

  // Main Increment & Decrement handlers
  const handleIncrement = () => {
    updateValue(currentCounter.step || 1, `+${currentCounter.step} Step`);
  };

  const handleDecrement = () => {
    updateValue(-(currentCounter.step || 1), `-${currentCounter.step} Step`);
  };

  // Quick jump adjustments
  const handleQuickAdjust = (amount) => {
    updateValue(amount, `${amount > 0 ? '+' : ''}${amount} Quick Jump`);
  };

  // Change Step
  const handleStepChange = (newStep) => {
    const num = Math.max(1, parseInt(newStep) || 1);
    setCounters(prev =>
      prev.map(c => (c.id === activeId ? { ...c, step: num } : c))
    );
  };

  // Reset current counter
  const handleReset = () => {
    const prevVal = currentCounter.value;
    if (prevVal === 0) return;

    soundFx.playClick('reset');
    setCounters(prev =>
      prev.map(c => (c.id === activeId ? { ...c, value: 0 } : c))
    );

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prevHist => [
      {
        id: Math.random().toString(36).substring(2, 9),
        counterId: currentCounter.id,
        counterTitle: currentCounter.title,
        time: timestamp,
        type: 'reset',
        delta: -prevVal,
        prevVal,
        nextVal: 0,
        label: 'Reset to 0'
      },
      ...prevHist.slice(0, 19)
    ]);
  };

  // Undo Last Action
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[0];

    // Find the counter to revert
    setCounters(prev =>
      prev.map(c => {
        if (c.id === lastAction.counterId) {
          return { ...c, value: lastAction.prevVal };
        }
        return c;
      })
    );

    soundFx.playClick('down');
    setHistory(prev => prev.slice(1));
  };

  // Auto-Tick Timer
  useEffect(() => {
    let interval = null;
    if (isAutoTicking) {
      interval = setInterval(() => {
        updateValue(currentCounter.step || 1, 'Auto-Pulse');
      }, autoTickSpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoTicking, autoTickSpeed, currentCounter.step, updateValue]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture when typing in modal inputs
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setIsAutoTicking(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleIncrement, handleDecrement, currentCounter]);

  // Calculate Target Percentage
  const targetPct = currentCounter.target > 0
    ? Math.min(100, Math.max(0, Math.round((currentCounter.value / currentCounter.target) * 100)))
    : 0;

  // New Counter Modal Actions
  const openNewCounterModal = () => {
    setModalForm({
      title: 'New Counter',
      category: 'General',
      target: 20,
      step: 1,
      accentColor: COLOR_THEMES[0].hex,
      glowColor: COLOR_THEMES[0].glow
    });
    setIsNewCounterModalOpen(true);
  };

  const saveNewCounter = (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) return;

    const newCounter = {
      id: `c-${Date.now()}`,
      title: modalForm.title.trim(),
      category: modalForm.category.trim() || 'General',
      value: 0,
      step: Number(modalForm.step) || 1,
      target: Number(modalForm.target) || 0,
      accentColor: modalForm.accentColor,
      glowColor: modalForm.glowColor
    };

    setCounters(prev => [...prev, newCounter]);
    setActiveId(newCounter.id);
    setIsNewCounterModalOpen(false);
    soundFx.playClick('up');
  };

  // Edit Counter Actions
  const openEditModal = () => {
    setModalForm({
      title: currentCounter.title,
      category: currentCounter.category,
      target: currentCounter.target,
      step: currentCounter.step,
      accentColor: currentCounter.accentColor,
      glowColor: currentCounter.glowColor
    });
    setIsEditModalOpen(true);
  };

  const saveEditCounter = (e) => {
    e.preventDefault();
    setCounters(prev =>
      prev.map(c => {
        if (c.id === activeId) {
          return {
            ...c,
            title: modalForm.title.trim() || c.title,
            category: modalForm.category.trim() || c.category,
            target: Number(modalForm.target) || 0,
            step: Number(modalForm.step) || 1,
            accentColor: modalForm.accentColor,
            glowColor: modalForm.glowColor
          };
        }
        return c;
      })
    );
    setIsEditModalOpen(false);
    soundFx.playClick('up');
  };

  const deleteCounter = (id) => {
    if (counters.length <= 1) {
      alert('You must keep at least one counter!');
      return;
    }
    const filtered = counters.filter(c => c.id !== id);
    setCounters(filtered);
    if (activeId === id) {
      setActiveId(filtered[0].id);
    }
    soundFx.playClick('down');
  };

  const handleClearStorage = () => {
    if (window.confirm('Reset all counters and data back to defaults?')) {
      localStorage.removeItem('quantum_counters');
      localStorage.removeItem('quantum_active_id');
      localStorage.removeItem('quantum_history');
      localStorage.removeItem('quantum_stats');
      localStorage.removeItem('quantum_sound_enabled');
      localStorage.removeItem('quantum_autotick_speed');
      setCounters(DEFAULT_COUNTERS);
      setActiveId(DEFAULT_COUNTERS[0].id);
      setHistory([]);
      setStats({
        totalIncrements: 0,
        totalDecrements: 0,
        maxEver: DEFAULT_COUNTERS[0].value,
        minEver: DEFAULT_COUNTERS[0].value
      });
      soundFx.playClick('reset');
    }
  };

  return (
    <div className="app-container" style={{ '--card-glow': currentCounter.glowColor }}>
      {/* Header Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-box">
            <HiBolt />
          </div>
          <div>
            <h1 className="brand-title">QuantumCount</h1>
            <p className="brand-subtitle">Pro Interactive Counter</p>
          </div>
        </div>

        <div className="header-controls">
          <button
            className={`icon-btn ${soundEnabled ? 'active' : ''}`}
            onClick={handleToggleSound}
            aria-label="Toggle Sound Effects"
            title={soundEnabled ? "Audio Haptics: ON (Click to Mute)" : "Audio Haptics: OFF"}
          >
            {soundEnabled ? <HiSpeakerWave className="btn-icon" /> : <HiSpeakerXMark className="btn-icon" />}
            <span className="btn-text">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          <button
            className="icon-btn"
            onClick={openNewCounterModal}
            aria-label="Add New Counter"
            title="Create a new custom counter"
          >
            <HiPlusCircle className="btn-icon" />
            <span className="btn-text">New Counter</span>
          </button>

          <button
            className="icon-btn"
            onClick={handleClearStorage}
            aria-label="Reset Storage to Defaults"
            title="Reset storage to default counters"
          >
            <HiArrowPath className="btn-icon" />
            <span className="btn-text">Reset Data</span>
          </button>
        </div>
      </header>

      {/* Multi-Counter Tab Switcher */}
      <nav className="counter-tabs-wrapper" aria-label="Counter Switcher">
        <div className="counter-tabs-list">
          {counters.map(counter => (
            <button
              key={counter.id}
              className={`counter-tab ${counter.id === activeId ? 'selected' : ''}`}
              onClick={() => {
                setActiveId(counter.id);
                soundFx.playClick('up');
              }}
              style={{
                borderLeftColor: counter.accentColor,
                borderLeftWidth: '3px'
              }}
            >
              <span>{counter.title}</span>
              <span className="tab-badge">{counter.value}</span>
            </button>
          ))}
        </div>

        <button className="new-counter-btn" onClick={openNewCounterModal}>
          <HiPlus /> Add Tab
        </button>
      </nav>

      {/* Main App Grid */}
      <main className="app-grid">
        {/* Left / Center: Interactive Counter Panel */}
        <section className="counter-hero-card">
          {/* Card Top Information */}
          <div className="hero-header">
            <div className="counter-info">
              <span className="counter-category-label">
                <HiFire /> {currentCounter.category}
              </span>
              <div className="counter-title-group">
                <h2 className="counter-heading">{currentCounter.title}</h2>
                <button
                  className="edit-btn"
                  onClick={openEditModal}
                  title="Edit counter details & target"
                  aria-label="Edit Counter Settings"
                >
                  <HiPencilSquare />
                </button>
              </div>
            </div>

            <div className="counter-actions-top">
              {counters.length > 1 && (
                <button
                  className="mini-action-btn danger"
                  onClick={() => deleteCounter(currentCounter.id)}
                  title="Delete this counter"
                  aria-label="Delete counter"
                >
                  <HiTrash /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Value Display */}
          <div className="counter-display-wrapper">
            <div className="display-label-pill">
              <HiClock /> Current Total
            </div>
            <div
              className={`count-number-glow ${
                pulseDirection === 'up' ? 'pulse-up' : pulseDirection === 'down' ? 'pulse-down' : ''
              }`}
              style={{ color: currentCounter.value < 0 ? '#fda4af' : '#ffffff' }}
            >
              {currentCounter.value.toLocaleString()}
            </div>
          </div>

          {/* Target & Milestone Progress Bar */}
          {currentCounter.target > 0 && (
            <div className="target-progress-box">
              <div className="target-progress-header">
                <span className="target-label">
                  <HiFlag /> Target Goal: <strong className="target-val">{currentCounter.target}</strong>
                </span>
                <span className="target-val">{targetPct}% Completed</span>
              </div>
              <div className="progress-track" role="progressbar" aria-valuenow={targetPct} aria-valuemin="0" aria-valuemax="100">
                <div
                  className="progress-fill"
                  style={{
                    width: `${targetPct}%`,
                    background: targetPct >= 100
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : `linear-gradient(90deg, ${currentCounter.accentColor}, #818cf8)`
                  }}
                />
              </div>
              {targetPct >= 100 && (
                <div className="target-reached-pill">
                  <HiSparkles /> Milestone Achieved! Excellent job!
                </div>
              )}
            </div>
          )}

          {/* Step Size Selector with Clear Labels */}
          <div className="step-control-section">
            <span className="step-label">
              Active Step Increment: <strong>±{currentCounter.step}</strong>
            </span>
            <div className="step-button-group">
              {[1, 5, 10, 25, 100].map(val => (
                <button
                  key={val}
                  className={`step-btn ${currentCounter.step === val ? 'active' : ''}`}
                  onClick={() => handleStepChange(val)}
                  title={`Set step size to ${val}`}
                >
                  {val}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="1000"
                value={currentCounter.step}
                onChange={e => handleStepChange(e.target.value)}
                className="custom-step-input"
                title="Custom step size"
                aria-label="Custom step size"
              />
            </div>
          </div>

          {/* Primary Action Buttons (+ and -) */}
          <div className="primary-controls-container">
            {/* Decrement Action */}
            <div className="action-btn-wrapper">
              <button
                id="btn-decrement"
                className="main-action-btn btn-decrement"
                onClick={handleDecrement}
                title={`Subtract ${currentCounter.step}`}
                aria-label={`Decrement count by ${currentCounter.step}`}
              >
                <HiMinus />
              </button>
              <div className="action-btn-label">
                <span>Subtract ({currentCounter.step})</span>
                <span className="key-hint">↓ Down</span>
              </div>
            </div>

            {/* Increment Action */}
            <div className="action-btn-wrapper">
              <button
                id="btn-increment"
                className="main-action-btn btn-increment"
                onClick={handleIncrement}
                title={`Add ${currentCounter.step}`}
                aria-label={`Increment count by ${currentCounter.step}`}
              >
                <HiPlus />
              </button>
              <div className="action-btn-label">
                <span>Add ({currentCounter.step})</span>
                <span className="key-hint">Space / ↑</span>
              </div>
            </div>
          </div>

          {/* Quick Adjustments Section */}
          <div className="quick-adjust-section">
            <span className="quick-adjust-label">Quick Jump Adjustments</span>
            <div className="quick-adjust-chips">
              <button className="chip-btn chip-minus" onClick={() => handleQuickAdjust(-50)}>-50</button>
              <button className="chip-btn chip-minus" onClick={() => handleQuickAdjust(-10)}>-10</button>
              <button className="chip-btn chip-minus" onClick={() => handleQuickAdjust(-5)}>-5</button>
              <button className="chip-btn chip-plus" onClick={() => handleQuickAdjust(5)}>+5</button>
              <button className="chip-btn chip-plus" onClick={() => handleQuickAdjust(10)}>+10</button>
              <button className="chip-btn chip-plus" onClick={() => handleQuickAdjust(50)}>+50</button>
              <button className="chip-btn chip-plus" onClick={() => handleQuickAdjust(100)}>+100</button>
            </div>
          </div>

          {/* Utility Action Bar */}
          <div className="utility-bar">
            <button
              className="util-btn util-danger"
              onClick={handleReset}
              title="Reset current counter to 0 (Key: R)"
              aria-label="Reset counter to zero"
            >
              <HiArrowPath />
              <span>Reset to 0</span>
            </button>

            <button
              className={`util-btn ${isAutoTicking ? 'util-active' : ''}`}
              onClick={() => setIsAutoTicking(prev => !prev)}
              title="Automate pulse counter (Key: A)"
              aria-label="Toggle auto-pulse timer"
            >
              {isAutoTicking ? <HiPause /> : <HiPlay />}
              <span>{isAutoTicking ? 'Pause Auto-Pulse' : 'Start Auto-Pulse'}</span>
            </button>

            {isAutoTicking && (
              <select
                value={autoTickSpeed}
                onChange={e => setAutoTickSpeed(Number(e.target.value))}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.8rem'
                }}
                aria-label="Auto pulse speed interval"
              >
                <option value={2000}>Every 2.0s (Slow)</option>
                <option value={1000}>Every 1.0s (Normal)</option>
                <option value={500}>Every 0.5s (Fast)</option>
                <option value={250}>Every 0.25s (Turbo)</option>
              </select>
            )}

            <button
              className="util-btn"
              onClick={handleUndo}
              disabled={history.length === 0}
              style={{ opacity: history.length === 0 ? 0.45 : 1 }}
              title="Undo last action"
              aria-label="Undo last count action"
            >
              <HiArrowUturnLeft />
              <span>Undo Last</span>
            </button>
          </div>
        </section>

        {/* Right Column: Telemetry Stats & Activity Log */}
        <aside className="side-column">
          {/* Metrics Card */}
          <div className="sidebar-card">
            <div className="sidebar-card-title">
              <span><HiChartBar /> Live Telemetry</span>
            </div>

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
          </div>

          {/* Activity History Audit Card */}
          <div className="sidebar-card">
            <div className="sidebar-card-title">
              <span><HiClock /> Activity History</span>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                  title="Clear history log"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="history-list">
              {history.length === 0 ? (
                <div className="empty-history">
                  No actions yet. Click + or - to start counting!
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
                        <span className="history-action-text">{item.label}</span>
                        <span className="history-time">{item.time}</span>
                      </div>
                    </div>
                    <span className="history-new-val">→ {item.nextVal}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Keyboard Shortcuts Helper Banner */}
      <footer className="keyboard-guide-banner">
        <div className="key-guide-item">
          <span className="key-badge">Space</span> or <span className="key-badge">↑</span>
          <span>Increment</span>
        </div>
        <div className="key-guide-item">
          <span className="key-badge">↓</span>
          <span>Decrement</span>
        </div>
        <div className="key-guide-item">
          <span className="key-badge">R</span>
          <span>Reset</span>
        </div>
        <div className="key-guide-item">
          <span className="key-badge">A</span>
          <span>Toggle Auto-Pulse</span>
        </div>
        <div className="key-guide-item">
          <span className="key-badge">M</span>
          <span>Toggle Mute</span>
        </div>
      </footer>

      {/* Modal: Create New Counter */}
      {isNewCounterModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewCounterModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Counter</h3>
              <button className="close-modal-btn" onClick={() => setIsNewCounterModalOpen(false)}>
                <HiXMark />
              </button>
            </div>

            <form onSubmit={saveNewCounter} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Counter Name / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Espresso Shots"
                  value={modalForm.title}
                  onChange={e => setModalForm({ ...modalForm, title: e.target.value })}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Health, Inventory, Gaming"
                  value={modalForm.category}
                  onChange={e => setModalForm({ ...modalForm, category: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Goal</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={modalForm.target}
                    onChange={e => setModalForm({ ...modalForm, target: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Default Step</label>
                  <input
                    type="number"
                    min="1"
                    value={modalForm.step}
                    onChange={e => setModalForm({ ...modalForm, step: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Theme Color Accent</label>
                <div className="color-options">
                  {COLOR_THEMES.map(theme => (
                    <button
                      type="button"
                      key={theme.name}
                      className={`color-dot ${modalForm.accentColor === theme.hex ? 'active' : ''}`}
                      style={{ background: theme.hex }}
                      onClick={() => setModalForm({ ...modalForm, accentColor: theme.hex, glowColor: theme.glow })}
                      title={theme.name}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="modal-btn-cancel" onClick={() => setIsNewCounterModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-confirm">
                  Create Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Counter Settings */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Counter Settings</h3>
              <button className="close-modal-btn" onClick={() => setIsEditModalOpen(false)}>
                <HiXMark />
              </button>
            </div>

            <form onSubmit={saveEditCounter} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Counter Name</label>
                <input
                  type="text"
                  required
                  value={modalForm.title}
                  onChange={e => setModalForm({ ...modalForm, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  value={modalForm.category}
                  onChange={e => setModalForm({ ...modalForm, category: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Milestone</label>
                  <input
                    type="number"
                    min="0"
                    value={modalForm.target}
                    onChange={e => setModalForm({ ...modalForm, target: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Step Size</label>
                  <input
                    type="number"
                    min="1"
                    value={modalForm.step}
                    onChange={e => setModalForm({ ...modalForm, step: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Theme Color</label>
                <div className="color-options">
                  {COLOR_THEMES.map(theme => (
                    <button
                      type="button"
                      key={theme.name}
                      className={`color-dot ${modalForm.accentColor === theme.hex ? 'active' : ''}`}
                      style={{ background: theme.hex }}
                      onClick={() => setModalForm({ ...modalForm, accentColor: theme.hex, glowColor: theme.glow })}
                      title={theme.name}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="modal-btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-confirm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
