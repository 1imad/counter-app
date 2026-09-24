/**
 * Date and midnight time calculation utilities for NoorTasbih
 * Guarantees local timezone accuracy for daily Dhikr counters & calendar tracking.
 */

/**
 * Returns date string in local YYYY-MM-DD format
 * @param {Date} [d=new Date()]
 * @returns {string} e.g. "2026-09-24"
 */
export function getLocalDateKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns milliseconds remaining until the upcoming local midnight (00:00:00.000)
 * @param {Date} [now=new Date()]
 * @returns {number}
 */
export function getMsUntilNextMidnight(now = new Date()) {
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    100
  );
  return Math.max(1000, nextMidnight.getTime() - now.getTime());
}

/**
 * Formats a YYYY-MM-DD date key into a user-friendly string
 * @param {string} dateKey
 * @returns {string} e.g. "Thursday, Sep 24, 2026"
 */
export function formatFriendlyDate(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
