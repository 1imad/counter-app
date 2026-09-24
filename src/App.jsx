import React, { useState, useEffect, useCallback } from 'react';
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
  HiFire,
  HiClock,
  HiTrash,
  HiPencilSquare,
  HiXMark,
  HiCheck,
  HiCalendarDays,
  HiBellAlert,
  HiBookOpen,
  HiHeart
} from 'react-icons/hi2';
import { FaHeadphones, FaBookQuran } from 'react-icons/fa6';
import { soundFx } from './utils/audio';
import { earbudController } from './utils/earbudMediaSession';
import { getLocalDateKey, getMsUntilNextMidnight } from './utils/dateUtils';
import DhikrCalendar from './components/DhikrCalendar';
import DhikrRemindersModal from './components/DhikrRemindersModal';
import DhikrPresetsLibrary from './components/DhikrPresetsLibrary';
import DhikrAnalyticsModal from './components/DhikrAnalyticsModal';
import EarbudModal from './components/EarbudModal';
import QuranModal from './components/QuranModal';
import './App.css';

// Default authentic Sunnah Zikr & Askar counters
const DEFAULT_DHIKR_COUNTERS = [
  {
    id: 'z-1',
    title: 'SubhanAllah',
    arabic: 'سُبْحَانَ ٱللَّٰهِ',
    meaning: 'Glory be to Allah',
    category: 'Tasbeeh Fatimah',
    value: 0,
    step: 1,
    target: 33,
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)'
  },
  {
    id: 'z-2',
    title: 'Alhamdulillah',
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
    meaning: 'All praise is due to Allah',
    category: 'Tasbeeh Fatimah',
    value: 0,
    step: 1,
    target: 33,
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
  {
    id: 'z-3',
    title: 'Allahu Akbar',
    arabic: 'ٱللَّٰهُ أَكْبَرُ',
    meaning: 'Allah is the Greatest',
    category: 'Tasbeeh Fatimah',
    value: 0,
    step: 1,
    target: 34,
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)'
  },
  {
    id: 'z-4',
    title: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ',
    meaning: 'I seek forgiveness from Allah',
    category: 'Daily Istighfar',
    value: 0,
    step: 1,
    target: 100,
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'z-5',
    title: 'La ilaha illallah',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
    meaning: 'There is no deity worthy of worship except Allah',
    category: 'Kalimah Tayyibah',
    value: 0,
    step: 1,
    target: 100,
    accentColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.4)'
  },
  {
    id: 'z-6',
    title: 'Durood / Salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    meaning: 'O Allah, send blessings upon Muhammad and his family',
    category: 'Daily Salawat',
    value: 0,
    step: 1,
    target: 100,
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)'
  }
];

const COLOR_THEMES = [
  { name: 'Cyan Neon', hex: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
  { name: 'Emerald Glow', hex: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Electric Purple', hex: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
  { name: 'Amber Solar', hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Rose Burst', hex: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' },
  { name: 'Indigo Core', hex: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' }
];

export default function App() {
  // Load counters from local storage or defaults with automatic daily rollover reset
  const [counters, setCounters] = useState(() => {
    const today = getLocalDateKey();
    const lastActiveDate = localStorage.getItem('quantum_last_active_date');
    const isNewDay = lastActiveDate && lastActiveDate !== today;

    try {
      const saved = localStorage.getItem('quantum_counters');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If authentic Dhikr counters
        if (parsed.length > 0 && parsed[0].arabic) {
          // If a new day has arrived since the user last counted, reset daily values to 0
          if (isNewDay) {
            const resetCounters = parsed.map(c => ({ ...c, value: 0 }));
            try {
              localStorage.setItem('quantum_last_active_date', today);
              localStorage.setItem('quantum_counters', JSON.stringify(resetCounters));
            } catch (e) {
              console.error('Failed to save daily reset counters', e);
            }
            return resetCounters;
          }
          if (!lastActiveDate) {
            localStorage.setItem('quantum_last_active_date', today);
          }
          return parsed;
        }
      }
      localStorage.setItem('quantum_last_active_date', today);
      return DEFAULT_DHIKR_COUNTERS;
    } catch {
      localStorage.setItem('quantum_last_active_date', today);
      return DEFAULT_DHIKR_COUNTERS;
    }
  });

  const [activeId, setActiveId] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_active_id');
      if (saved && counters.some(c => c.id === saved)) return saved;
      return counters[0]?.id || 'z-1';
    } catch {
      return counters[0]?.id || 'z-1';
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

  // Calendar Activity Tracking State
  const [calendarData, setCalendarData] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_dhikr_calendar');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Reminder Notification Settings State
  const [reminderSettings, setReminderSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('quantum_dhikr_reminders');
      return saved ? JSON.parse(saved) : {
        enabled: true,
        intervalMinutes: 30,
        morningAdhkarEnabled: true,
        morningAdhkarTime: '06:30',
        eveningAdhkarEnabled: true,
        eveningAdhkarTime: '17:30',
        selectedDhikrType: 'all'
      };
    } catch {
      return {
        enabled: true,
        intervalMinutes: 30,
        morningAdhkarEnabled: true,
        morningAdhkarTime: '06:30',
        eveningAdhkarEnabled: true,
        eveningAdhkarTime: '17:30',
        selectedDhikrType: 'all'
      };
    }
  });

  // Live Toast for Reminders
  const [activeToastReminder, setActiveToastReminder] = useState(null);

  // Modals
  const [isNewCounterModalOpen, setIsNewCounterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isQuranOpen, setIsQuranOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isEarbudActive, setIsEarbudActive] = useState(false);
  const [isEarbudModalOpen, setIsEarbudModalOpen] = useState(false);

  const [modalForm, setModalForm] = useState({
    title: '',
    arabic: '',
    meaning: '',
    category: '',
    target: 33,
    step: 1,
    accentColor: COLOR_THEMES[0].hex,
    glowColor: COLOR_THEMES[0].glow
  });

  // Active counter object
  const currentCounter = counters.find(c => c.id === activeId) || counters[0] || DEFAULT_DHIKR_COUNTERS[0];

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('quantum_counters', JSON.stringify(counters));
    } catch (e) {
      console.error('Failed to save counters', e);
    }
  }, [counters]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_active_id', activeId);
    } catch (e) {
      console.error('Failed to save active id', e);
    }
  }, [activeId]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_stats', JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats', e);
    }
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_dhikr_calendar', JSON.stringify(calendarData));
    } catch (e) {
      console.error('Failed to save calendar data', e);
    }
  }, [calendarData]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_dhikr_reminders', JSON.stringify(reminderSettings));
    } catch (e) {
      console.error('Failed to save reminders', e);
    }
  }, [reminderSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_sound_enabled', JSON.stringify(soundEnabled));
    } catch (e) {
      console.error('Failed to save sound', e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('quantum_autotick_speed', autoTickSpeed.toString());
    } catch (e) {
      console.error('Failed to save speed', e);
    }
  }, [autoTickSpeed]);

  // Automatic Daily Reset at Midnight & on App Wake/Focus
  useEffect(() => {
    let timeoutId;
    let intervalId;

    const performDailyResetCheck = () => {
      const today = getLocalDateKey();
      const storedLastDate = localStorage.getItem('quantum_last_active_date');

      if (storedLastDate && storedLastDate !== today) {
        console.log(`[DailyReset] Day completed (${storedLastDate} -> ${today}). Resetting daily counters to 0.`);

        // Reset all counter values to 0 for the fresh day
        setCounters(prevCounters => {
          const reset = prevCounters.map(c => ({ ...c, value: 0 }));
          try {
            localStorage.setItem('quantum_counters', JSON.stringify(reset));
          } catch (e) {
            console.error('Failed to save reset counters', e);
          }
          return reset;
        });

        localStorage.setItem('quantum_last_active_date', today);

        // Notify user with polite toast
        setActiveToastReminder({
          title: '🌙 New Day Started',
          message: 'Your daily Dhikr counters have refreshed to 0 for today. May Allah accept your remembrance!'
        });

        // Record daily reset event in history
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setHistory(prevHist => [
          {
            id: Math.random().toString(36).substring(2, 9),
            counterId: 'system-reset',
            counterTitle: 'Daily Reset',
            time: timestamp,
            type: 'reset',
            delta: 0,
            prevVal: 0,
            nextVal: 0,
            label: 'New day started — counters refreshed to 0'
          },
          ...prevHist.slice(0, 19)
        ]);
      } else if (!storedLastDate) {
        localStorage.setItem('quantum_last_active_date', today);
      }
    };

    // 1. Timer for exact local midnight
    const setupMidnightTimer = () => {
      const ms = getMsUntilNextMidnight();
      timeoutId = setTimeout(() => {
        performDailyResetCheck();
        setupMidnightTimer(); // Chain to the next midnight
      }, ms + 500); // 500ms buffer past 00:00:00
    };

    setupMidnightTimer();

    // 2. Fallback periodic check every 15 seconds (catches OS wake/sleep and system clock adjustments)
    intervalId = setInterval(performDailyResetCheck, 15000);

    // 3. Check immediately when phone unlocks, app un-minimizes, or tab regains focus
    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        performDailyResetCheck();
      }
    };
    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', performDailyResetCheck);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', performDailyResetCheck);
    };
  }, []);

  // Toggle sound
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundFx.toggleSound(nextState);
    if (nextState) soundFx.playClick('up');
  };

  const triggerPulse = (dir) => {
    setPulseDirection(dir);
    setTimeout(() => setPulseDirection(null), 180);
  };

  const checkMilestone = (prevVal, nextVal, target) => {
    if (target > 0 && prevVal < target && nextVal >= target) {
      soundFx.playCelebration();
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b']
        });
      } catch (e) {
        // Optional
      }
    }
  };

  // General update value function
  const updateValue = useCallback((delta, label = 'Step') => {
    const todayKey = getLocalDateKey();
    localStorage.setItem('quantum_last_active_date', todayKey);

    setCounters(prevCounters =>
      prevCounters.map(item => {
        if (item.id !== activeId) return item;

        const prevVal = item.value;
        const nextVal = prevVal + delta;
        const dir = delta >= 0 ? 'up' : 'down';

        triggerPulse(dir);
        soundFx.playClick(dir);
        checkMilestone(prevVal, nextVal, item.target);

        // Update calendar tracking data
        setCalendarData(prevCal => {
          const existing = prevCal[todayKey] || { total: 0, breakdown: {} };
          const prevDhikrCount = existing.breakdown[item.title] || 0;
          const newTotal = Math.max(0, existing.total + delta);
          const newDhikrCount = Math.max(0, prevDhikrCount + delta);

          return {
            ...prevCal,
            [todayKey]: {
              total: newTotal,
              breakdown: {
                ...existing.breakdown,
                [item.title]: newDhikrCount
              }
            }
          };
        });

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

  const handleIncrement = () => {
    updateValue(currentCounter.step || 1, `+${currentCounter.step} Step`);
  };

  const handleDecrement = () => {
    updateValue(-(currentCounter.step || 1), `-${currentCounter.step} Step`);
  };

  const handleQuickAdjust = (amount) => {
    updateValue(amount, `${amount > 0 ? '+' : ''}${amount} Quick Tally`);
  };

  // Toggle wireless earbud tap mode
  const handleToggleEarbudMode = () => {
    if (isEarbudActive) {
      earbudController.deactivate();
      setIsEarbudActive(false);
    } else {
      const activated = earbudController.activate({
        onIncrement: () => updateValue(currentCounter.step || 1, 'Earbud Tap'),
        onDecrement: () => updateValue(-(currentCounter.step || 1), 'Earbud Tap'),
        onFastJump: (amount) => updateValue(amount, 'Earbud Gesture'),
        currentTitle: currentCounter.title
      });
      if (activated) {
        setIsEarbudActive(true);
      }
    }
  };

  // Sync MediaSession metadata whenever active counter or value changes
  useEffect(() => {
    if (isEarbudActive) {
      earbudController.updateMetadata(currentCounter.title, currentCounter.value, currentCounter.target);
    }
  }, [isEarbudActive, currentCounter.title, currentCounter.value, currentCounter.target]);

  const handleStepChange = (newStep) => {
    const num = Math.max(1, parseInt(newStep) || 1);
    setCounters(prev =>
      prev.map(c => (c.id === activeId ? { ...c, step: num } : c))
    );
  };

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

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[0];

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

  // Auto-pulse
  useEffect(() => {
    let interval = null;
    if (isAutoTicking) {
      interval = setInterval(() => {
        updateValue(currentCounter.step || 1, 'Auto-Pulse');
      }, autoTickSpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoTicking, autoTickSpeed, currentCounter.step, updateValue]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
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

  // Send Notification Helper
  const sendDhikrNotification = useCallback((dhikrType = 'all', customTitle = null, customBody = null) => {
    const dhikrList = [
      { name: 'SubhanAllah', arabic: 'سُبْحَانَ ٱللَّٰهِ', meaning: 'Glory be to Allah' },
      { name: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', meaning: 'All praise is due to Allah' },
      { name: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', meaning: 'Allah is the Greatest' },
      { name: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ', meaning: 'I seek forgiveness from Allah' },
      { name: 'La ilaha illallah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', meaning: 'There is no deity worthy of worship except Allah' },
      { name: 'Salawat on Prophet ﷺ', arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', meaning: 'O Allah, send blessings upon Muhammad' }
    ];

    let chosen = dhikrList[0];
    if (dhikrType === 'all') {
      chosen = dhikrList[Math.floor(Math.random() * dhikrList.length)];
    } else {
      const match = dhikrList.find(d => d.name.toLowerCase().includes(dhikrType.toLowerCase()));
      if (match) chosen = match;
    }

    const title = customTitle || 'Time for Zikr & Askar ✨';
    const body = customBody || `Take a moment to recite ${chosen.name} (${chosen.arabic}) • ${chosen.meaning}`;

    soundFx.playChime();

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg'
        });
      } catch (e) {
        console.error('Notification error', e);
      }
    }

    setActiveToastReminder({
      title,
      body,
      dhikrName: chosen.name
    });
  }, []);

  // Background Reminder Scheduler
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      // 1. Morning Adhkar
      if (
        reminderSettings.morningAdhkarEnabled &&
        currentTimeStr === reminderSettings.morningAdhkarTime &&
        sessionStorage.getItem('morning_dhikr_sent') !== now.toDateString()
      ) {
        sessionStorage.setItem('morning_dhikr_sent', now.toDateString());
        sendDhikrNotification(
          'all',
          '🌅 Morning Adhkar Reminder (أذكار الصباح)',
          'Begin your morning with peaceful remembrance and protection from Allah.'
        );
      }

      // 2. Evening Adhkar
      if (
        reminderSettings.eveningAdhkarEnabled &&
        currentTimeStr === reminderSettings.eveningAdhkarTime &&
        sessionStorage.getItem('evening_dhikr_sent') !== now.toDateString()
      ) {
        sessionStorage.setItem('evening_dhikr_sent', now.toDateString());
        sendDhikrNotification(
          'all',
          '🌇 Evening Adhkar Reminder (أذكار المساء)',
          'End your day with heartfelt gratitude and remembrance of Allah.'
        );
      }

      // 3. Interval recurring
      const lastNotified = Number(localStorage.getItem('quantum_last_notified_ts') || 0);
      const intervalMs = (reminderSettings.intervalMinutes || 30) * 60 * 1000;
      if (Date.now() - lastNotified >= intervalMs) {
        localStorage.setItem('quantum_last_notified_ts', Date.now().toString());
        sendDhikrNotification(reminderSettings.selectedDhikrType);
      }
    };

    const intervalTimer = setInterval(checkReminders, 30000);
    return () => clearInterval(intervalTimer);
  }, [reminderSettings, sendDhikrNotification]);

  // Target progress percentage
  const targetPct = currentCounter.target > 0
    ? Math.min(100, Math.max(0, Math.round((currentCounter.value / currentCounter.target) * 100)))
    : 0;

  // Add counter modal
  const openNewCounterModal = () => {
    setModalForm({
      title: 'New Dhikr',
      arabic: '',
      meaning: '',
      category: 'Personal Askar',
      target: 33,
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
      id: `z-${Date.now()}`,
      title: modalForm.title.trim(),
      arabic: modalForm.arabic.trim(),
      meaning: modalForm.meaning.trim(),
      category: modalForm.category.trim() || 'General Dhikr',
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

  // Add from Sunnah library
  const handleAddPreset = (preset) => {
    const newCounter = {
      id: `z-${Date.now()}`,
      title: preset.title,
      arabic: preset.arabic,
      meaning: preset.meaning,
      category: preset.category,
      value: 0,
      step: preset.step || 1,
      target: preset.target || 33,
      accentColor: preset.accentColor,
      glowColor: preset.glowColor
    };

    setCounters(prev => [...prev, newCounter]);
    setActiveId(newCounter.id);
    setIsLibraryOpen(false);
    soundFx.playClick('up');
  };

  // Add from Quran Ayah
  const handleAddDhikrFromAyah = (ayahDhikr) => {
    const newCounter = {
      id: `quran-${Date.now()}`,
      title: ayahDhikr.title,
      arabic: ayahDhikr.arabic,
      meaning: ayahDhikr.meaning,
      category: ayahDhikr.category || 'Quranic Ayah',
      value: 0,
      step: 1,
      target: ayahDhikr.target || 33,
      accentColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.4)'
    };

    setCounters(prev => [newCounter, ...prev]);
    setActiveId(newCounter.id);
    setIsQuranOpen(false);
    soundFx.playCelebration();
  };

  // Edit Counter
  const openEditModal = () => {
    setModalForm({
      title: currentCounter.title,
      arabic: currentCounter.arabic || '',
      meaning: currentCounter.meaning || '',
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
            arabic: modalForm.arabic.trim(),
            meaning: modalForm.meaning.trim(),
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
    if (window.confirm('Reset all counters and data back to authentic Dhikr defaults?')) {
      localStorage.removeItem('quantum_counters');
      localStorage.removeItem('quantum_active_id');
      localStorage.removeItem('quantum_history');
      localStorage.removeItem('quantum_stats');
      localStorage.removeItem('quantum_sound_enabled');
      localStorage.removeItem('quantum_autotick_speed');
      localStorage.removeItem('quantum_dhikr_calendar');
      localStorage.removeItem('quantum_dhikr_reminders');
      localStorage.removeItem('quantum_last_active_date');
      setCounters(DEFAULT_DHIKR_COUNTERS);
      setActiveId(DEFAULT_DHIKR_COUNTERS[0].id);
      setHistory([]);
      setCalendarData({});
      setStats({
        totalIncrements: 0,
        totalDecrements: 0,
        maxEver: 0,
        minEver: 0
      });
      soundFx.playClick('reset');
    }
  };

  return (
    <div className="app-container" style={{ '--card-glow': currentCounter.glowColor }}>
      {/* Interactive In-App Reminder Toast Banner */}
      {activeToastReminder && (
        <div className="dhikr-reminder-toast">
          <div className="toast-content">
            <div className="toast-bell-icon">
              <HiBellAlert />
            </div>
            <div>
              <span className="toast-title">{activeToastReminder.title}</span>
              <p className="toast-msg">{activeToastReminder.body}</p>
            </div>
          </div>
          <div className="toast-actions">
            <button
              className="toast-action-btn"
              onClick={() => {
                // Find matching counter or active, add 33
                updateValue(33, '+33 Dhikr Reminder');
                setActiveToastReminder(null);
              }}
            >
              Recite (+33)
            </button>
            <button
              className="toast-close-btn"
              onClick={() => setActiveToastReminder(null)}
              aria-label="Dismiss Reminder"
            >
              <HiXMark />
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-box" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <HiHeart />
          </div>
          <div>
            <h1 className="brand-title">NoorTasbih</h1>
            <p className="brand-subtitle">Digital Tasbeeh & Adhkar Tracker</p>
          </div>
        </div>

        <div className="header-controls">
          {/* Feature Navigation Pill Group */}
          <nav className="nav-pill-group" aria-label="Feature navigation">
            {/* Calendar */}
            <button
              className="nav-item-btn"
              onClick={() => setIsCalendarOpen(true)}
              aria-label="Open Adhkar Calendar"
              title="Adhkar Calendar & Daily Habits"
            >
              <HiCalendarDays className="nav-icon" style={{ color: '#38bdf8' }} />
              <span className="nav-item-label">Calendar</span>
            </button>

            {/* Reminders */}
            <button
              className="nav-item-btn"
              onClick={() => setIsRemindersOpen(true)}
              aria-label="Open Zikr Reminders"
              title="Daily Zikr & Askar Reminders"
            >
              <HiBellAlert className="nav-icon" style={{ color: '#f59e0b' }} />
              <span className="nav-item-label">Reminders</span>
              {reminderSettings.enabled && <span className="nav-dot-indicator green" title="Reminders active" />}
            </button>

            {/* Earbuds Tap Trigger */}
            <button
              className={`nav-item-btn ${isEarbudActive ? 'active-earbud' : ''}`}
              onClick={() => setIsEarbudModalOpen(true)}
              aria-label="Wireless Earbud Tap Mode"
              title={isEarbudActive ? "Earbud Tap Mode: Active" : "Connect Wireless Earbuds"}
            >
              <FaHeadphones className="nav-icon" style={{ color: isEarbudActive ? '#67e8f9' : '#38bdf8' }} />
              <span className="nav-item-label">{isEarbudActive ? 'Earbuds ON' : 'Earbuds'}</span>
              {isEarbudActive && <span className="nav-dot-indicator cyan pulse" />}
            </button>

            {/* The Noble Quran */}
            <button
              className="nav-item-btn"
              onClick={() => setIsQuranOpen(true)}
              aria-label="Open The Noble Quran"
              title="The Noble Quran (Arabic, Translation & Transliteration)"
            >
              <FaBookQuran className="nav-icon" style={{ color: '#10b981' }} />
              <span className="nav-item-label">Quran</span>
            </button>

            {/* Sunnah Library */}
            <button
              className="nav-item-btn"
              onClick={() => setIsLibraryOpen(true)}
              aria-label="Open Sunnah Adhkar Library"
              title="Sunnah Adhkar Presets Library"
            >
              <HiBookOpen className="nav-icon" style={{ color: '#a78bfa' }} />
              <span className="nav-item-label">Library</span>
            </button>

            {/* Analytics Trigger */}
            <button
              className="nav-item-btn"
              onClick={() => setIsAnalyticsOpen(true)}
              aria-label="View Session Analytics"
              title="Session Analytics & Recitation History"
            >
              <HiChartBar className="nav-icon" style={{ color: '#ec4899' }} />
              <span className="nav-item-label">Analytics</span>
            </button>
          </nav>

          <div className="nav-divider" aria-hidden="true" />

          {/* Quick Utility Actions */}
          <div className="nav-util-group">
            {/* Sound Toggle */}
            <button
              className={`icon-circle-btn ${soundEnabled ? 'sound-on' : ''}`}
              onClick={handleToggleSound}
              aria-label="Toggle Audio Sound Haptics"
              title={soundEnabled ? "Audio Click: Sound ON" : "Audio Click: Muted"}
            >
              {soundEnabled ? <HiSpeakerWave /> : <HiSpeakerXMark />}
            </button>

            {/* Reset Storage */}
            <button
              className="icon-circle-btn danger-hover"
              onClick={handleClearStorage}
              aria-label="Reset Storage to Defaults"
              title="Reset counters to Sunnah defaults"
            >
              <HiArrowPath />
            </button>
          </div>
        </div>
      </header>

      {/* Multi-Counter Tab Switcher */}
      <nav className="counter-tabs-wrapper" aria-label="Dhikr Switcher">
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

        <div className="counter-tabs-actions">
          <button className="new-counter-btn" onClick={openNewCounterModal} title="Create Custom Dhikr Counter">
            <HiPlus /> <span className="new-btn-text">Custom Zikr</span>
          </button>
        </div>
      </nav>

      {/* Main App Grid */}
      <main className="app-grid">
        {/* Center: Interactive Counter Panel */}
        <section className="counter-hero-card">
          {/* Card Top Information */}
          <div className="hero-header">
            <div className="counter-info">
              <span className="counter-category-label">
                <HiSparkles /> {currentCounter.category}
              </span>
              <div className="counter-title-group">
                <h2 className="counter-heading">{currentCounter.title}</h2>
                <button
                  className="edit-btn"
                  onClick={openEditModal}
                  title="Edit Dhikr settings & target"
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

          {/* Authentic Arabic Script Display */}
          {currentCounter.arabic && (
            <div className="counter-arabic-text" lang="ar">
              {currentCounter.arabic}
            </div>
          )}

          {/* Meaning / Translation */}
          {currentCounter.meaning && (
            <p className="counter-meaning-text">
              "{currentCounter.meaning}"
            </p>
          )}

          {/* Tasbeeh Fatimah Quick Step Switcher */}
          {['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar'].includes(currentCounter.title) && (
            <div className="tasbeeh-quick-switch">
              {counters.filter(c => ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar'].includes(c.title)).map(c => (
                <button
                  key={c.id}
                  className={`tasbeeh-chip ${c.id === activeId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveId(c.id);
                    soundFx.playClick('up');
                  }}
                >
                  {c.title} ({c.value}/{c.target})
                </button>
              ))}
            </div>
          )}

          {/* Giant Value Display */}
          <div className="counter-display-wrapper">
            {isEarbudActive && (
              <button
                type="button"
                className="display-label-pill"
                onClick={() => setIsEarbudModalOpen(true)}
                style={{
                  background: 'rgba(6, 182, 212, 0.2)',
                  borderColor: 'rgba(6, 182, 212, 0.5)',
                  color: '#67e8f9',
                  cursor: 'pointer',
                  marginBottom: '0.45rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
                title="Earbud Tap Mode is active. Click to view controls."
              >
                <FaHeadphones /> Earbud Tap Active (Tap/Squeeze Earbud to Count)
              </button>
            )}

            <div className="display-label-pill">
              <HiClock /> Recitation Count
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
                  <HiFlag /> Target Goal: <strong className="target-val">{currentCounter.target}x</strong>
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
                  <HiSparkles /> Milestone Complete! بارك الله فيك
                </div>
              )}
            </div>
          )}

          {/* Step Size Selector */}
          <div className="step-control-section">
            <span className="step-label">
              Active Step Increment: <strong>±{currentCounter.step}</strong>
            </span>
            <div className="step-button-group">
              {[1, 5, 10, 33, 100].map(val => (
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
            <span className="quick-adjust-label">Quick Recitation Adjustments</span>
            <div className="quick-adjust-chips">
              <button className="chip-btn chip-minus" onClick={() => handleQuickAdjust(-33)}>-33</button>
              <button className="chip-btn chip-minus" onClick={() => handleQuickAdjust(-10)}>-10</button>
              <button className="chip-btn chip-minus" onClick={() => handleQuickAdjust(-5)}>-5</button>
              <button className="chip-btn chip-plus" onClick={() => handleQuickAdjust(5)}>+5</button>
              <button className="chip-btn chip-plus" onClick={() => handleQuickAdjust(10)}>+10</button>
              <button className="chip-btn chip-plus" onClick={() => handleQuickAdjust(33)}>+33</button>
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
              <span>{isAutoTicking ? 'Pause Auto' : 'Auto Pulse'}</span>
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
                <option value={2000}>Every 2.0s</option>
                <option value={1000}>Every 1.0s</option>
                <option value={500}>Every 0.5s</option>
                <option value={250}>Every 0.25s</option>
              </select>
            )}

            <button
              className="util-btn"
              onClick={() => setIsAnalyticsOpen(true)}
              title="View session analytics & recitations history"
            >
              <HiChartBar />
              <span>Analytics</span>
            </button>

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
          <span>Toggle Audio Mute</span>
        </div>
      </footer>

      {/* 📅 Dhikr Calendar Modal */}
      <DhikrCalendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        calendarData={calendarData}
      />

      {/* 🔔 Reminders Settings Modal */}
      <DhikrRemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        reminderSettings={reminderSettings}
        onSaveSettings={newSettings => setReminderSettings(newSettings)}
        onTriggerTestNotification={dhikrType => sendDhikrNotification(dhikrType)}
      />

      {/* 📖 Sunnah Presets Library Modal */}
      <DhikrPresetsLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAddPreset={handleAddPreset}
      />

      {/* 📖 The Noble Quran Modal */}
      <QuranModal
        isOpen={isQuranOpen}
        onClose={() => setIsQuranOpen(false)}
        onAddDhikrFromAyah={handleAddDhikrFromAyah}
      />

      {/* 📊 Session Analytics Modal */}
      <DhikrAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        stats={stats}
        history={history}
        onClearHistory={() => setHistory([])}
      />

      {/* 🎧 Wireless Earbud Tasbeeh Modal */}
      <EarbudModal
        isOpen={isEarbudModalOpen}
        onClose={() => setIsEarbudModalOpen(false)}
        isEarbudActive={isEarbudActive}
        onToggleEarbudMode={handleToggleEarbudMode}
        onTestClick={() => updateValue(currentCounter.step || 1, 'Simulated Earbud Tap')}
      />

      {/* Modal: Create Custom Counter */}
      {isNewCounterModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewCounterModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Custom Zikr</h3>
              <button className="close-modal-btn" onClick={() => setIsNewCounterModalOpen(false)}>
                <HiXMark />
              </button>
            </div>

            <form onSubmit={saveNewCounter} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Dhikr Name (English / Transliteration)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HasbunAllahu wa ni'mal wakeel"
                  value={modalForm.title}
                  onChange={e => setModalForm({ ...modalForm, title: e.target.value })}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Arabic Text (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ"
                  value={modalForm.arabic}
                  onChange={e => setModalForm({ ...modalForm, arabic: e.target.value })}
                  className="form-input"
                  dir="rtl"
                  style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meaning / Translation (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Allah is sufficient for us..."
                  value={modalForm.meaning}
                  onChange={e => setModalForm({ ...modalForm, meaning: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Istighfar, Morning Askar"
                  value={modalForm.category}
                  onChange={e => setModalForm({ ...modalForm, category: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Goal (e.g. 33, 100)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 33"
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
                <button type="button" className="modal-btn-cancel" onClick={() => setIsNewCounterModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-confirm">
                  Create Dhikr
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
              <h3 className="modal-title">Edit Dhikr Settings</h3>
              <button className="close-modal-btn" onClick={() => setIsEditModalOpen(false)}>
                <HiXMark />
              </button>
            </div>

            <form onSubmit={saveEditCounter} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Dhikr Name</label>
                <input
                  type="text"
                  required
                  value={modalForm.title}
                  onChange={e => setModalForm({ ...modalForm, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Arabic Text</label>
                <input
                  type="text"
                  value={modalForm.arabic}
                  onChange={e => setModalForm({ ...modalForm, arabic: e.target.value })}
                  className="form-input"
                  dir="rtl"
                  style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meaning / Translation</label>
                <input
                  type="text"
                  value={modalForm.meaning}
                  onChange={e => setModalForm({ ...modalForm, meaning: e.target.value })}
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
                  <label className="form-label">Target Goal</label>
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
