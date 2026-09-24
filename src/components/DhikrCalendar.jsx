import React, { useState } from 'react';
import {
  HiChevronLeft,
  HiChevronRight,
  HiFire,
  HiSparkles,
  HiXMark,
  HiCalendarDays,
  HiCheckCircle
} from 'react-icons/hi2';

import { getLocalDateKey } from '../utils/dateUtils';

export default function DhikrCalendar({ isOpen = true, onClose, calendarData = {}, isPage = true }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(() => {
    return getLocalDateKey();
  });

  if (!isOpen && !isPage) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month and total days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Previous month total days
  const prevMonthDays = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calculate Streak & Monthly Stats
  const calculateStats = () => {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);

    // Check consecutive days starting today or yesterday
    for (let i = 0; i < 365; i++) {
      const key = getLocalDateKey(checkDate);
      if (calendarData[key] && calendarData[key].total > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Maybe today hasn't started yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Monthly total
    let monthTotal = 0;
    let daysActiveInMonth = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (calendarData[dateKey] && calendarData[dateKey].total > 0) {
        monthTotal += calendarData[dateKey].total;
        daysActiveInMonth++;
      }
    }

    return { streak, monthTotal, daysActiveInMonth };
  };

  const { streak, monthTotal, daysActiveInMonth } = calculateStats();

  // Build days grid
  const calendarCells = [];

  // Pad previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      dayNumber: prevMonthDays - i,
      isCurrentMonth: false,
      dateKey: null
    });
  }

  // Current month days
  const todayStr = getLocalDateKey();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayData = calendarData[dateKey];
    const totalCount = dayData ? dayData.total : 0;

    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateKey,
      totalCount,
      breakdown: dayData ? dayData.breakdown : {},
      isToday: dateKey === todayStr,
      isSelected: dateKey === selectedDayKey
    });
  }

  // Selected Day Details
  const selectedDayData = calendarData[selectedDayKey] || null;

  return (
    <div className={isPage ? "page-view-container" : "modal-backdrop"} onClick={isPage ? undefined : onClose}>
      <div className={isPage ? "page-view-card calendar-modal" : "modal-content calendar-modal"} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>
              <HiCalendarDays />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>Adhkar & Zikr Calendar</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Track daily recurring Dhikr consistency & habits
              </p>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close Calendar">
            <HiXMark />
          </button>
        </div>

        {/* Top Summary Stats Bar */}
        <div className="calendar-stats-row">
          <div className="cal-stat-card">
            <span className="cal-stat-icon" style={{ color: '#f59e0b' }}><HiFire /></span>
            <div>
              <span className="cal-stat-num">{streak} {streak === 1 ? 'Day' : 'Days'}</span>
              <span className="cal-stat-lbl">Active Streak</span>
            </div>
          </div>

          <div className="cal-stat-card">
            <span className="cal-stat-icon" style={{ color: '#06b6d4' }}><HiSparkles /></span>
            <div>
              <span className="cal-stat-num">{monthTotal.toLocaleString()}</span>
              <span className="cal-stat-lbl">{monthNames[month]} Dhikr</span>
            </div>
          </div>

          <div className="cal-stat-card">
            <span className="cal-stat-icon" style={{ color: '#10b981' }}><HiCheckCircle /></span>
            <div>
              <span className="cal-stat-num">{daysActiveInMonth} / {daysInMonth}</span>
              <span className="cal-stat-lbl">Days Completed</span>
            </div>
          </div>
        </div>

        {/* Daily Auto-Reset Confirmation Badge */}
        <div className="calendar-reset-indicator">
          <span style={{ fontWeight: 600 }}>🌙 Daily Reset Active</span>
          <span className="reset-subtext">• Counters refresh to 0 each midnight while streak & history are saved</span>
        </div>

        {/* Month Navigation */}
        <div className="calendar-month-nav">
          <button className="month-nav-btn" onClick={handlePrevMonth} title="Previous Month">
            <HiChevronLeft />
          </button>
          <span className="current-month-heading">
            {monthNames[month]} {year}
          </span>
          <button className="month-nav-btn" onClick={handleNextMonth} title="Next Month">
            <HiChevronRight />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-label">{day}</div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="calendar-days-grid">
          {calendarCells.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return <div key={`prev-${idx}`} className="cal-day-cell pad-day">{cell.dayNumber}</div>;
            }

            // Intensity based on count
            let intensityClass = 'intensity-0';
            if (cell.totalCount >= 300) intensityClass = 'intensity-high';
            else if (cell.totalCount >= 100) intensityClass = 'intensity-med';
            else if (cell.totalCount > 0) intensityClass = 'intensity-low';

            return (
              <button
                key={cell.dateKey}
                className={`cal-day-cell current-month ${intensityClass} ${cell.isToday ? 'is-today' : ''} ${cell.isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelectedDayKey(cell.dateKey)}
                title={`${cell.dateKey}: ${cell.totalCount} Adhkar`}
              >
                <span className="day-number">{cell.dayNumber}</span>
                {cell.totalCount > 0 && (
                  <span className="day-count-badge">
                    {cell.totalCount > 999 ? `${(cell.totalCount / 1000).toFixed(1)}k` : cell.totalCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Activity Log */}
        <div className="selected-day-card">
          <div className="selected-day-header">
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#e2e8f0' }}>
              Activity for {selectedDayKey === todayStr ? 'Today' : selectedDayKey}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#38bdf8' }}>
              Total: {selectedDayData ? selectedDayData.total : 0} Dhikr
            </span>
          </div>

          {selectedDayData && selectedDayData.breakdown && Object.keys(selectedDayData.breakdown).length > 0 ? (
            <div className="breakdown-chips-list">
              {Object.entries(selectedDayData.breakdown).map(([name, count]) => (
                <div key={name} className="breakdown-chip">
                  <span className="chip-name">{name}</span>
                  <span className="chip-val">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.4rem 0 0' }}>
              No Dhikr logged for this day. Recite with the counter to fill this day!
            </p>
          )}
        </div>

        {/* Hadith / Spiritual Reflection of the Day */}
        <div className="calendar-quote-box">
          <p className="quote-arabic" style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem', direction: 'rtl', color: '#93c5fd' }}>
            أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
          </p>
          <p className="quote-translation" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0.2rem 0 0' }}>
            "Unquestionably, by the remembrance of Allah hearts are assured." [Surah Ar-Ra'd: 28]
          </p>
        </div>
      </div>
    </div>
  );
}
