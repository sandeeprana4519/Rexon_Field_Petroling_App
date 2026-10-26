import { useState, useEffect } from 'react';

/**
 * Rexon Patrolling App - Unified Live Date & Real-Time Utilities
 * Ensures dynamic, real-time date/time across Field Officer Mode,
 * Reporting sessions, Assignments, and Dashboard filters.
 */

/**
 * Returns YYYY-MM-DD in local time
 */
export const getTodayDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns YYYY-MM-DD for yesterday
 */
export const getYesterdayDateString = (d: Date = new Date()): string => {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  return getTodayDateString(prev);
};

/**
 * Returns YYYY-MM-DD with given days offset (+/-)
 */
export const getOffsetDateString = (daysOffset: number, baseDate: Date = new Date()): string => {
  const target = new Date(baseDate);
  target.setDate(target.getDate() + daysOffset);
  return getTodayDateString(target);
};

/**
 * Formats a Date or YYYY-MM-DD string into header uppercase format:
 * e.g. "FRIDAY, OCT 23, 2026"
 */
export const formatFullLiveHeader = (d: Date | string = new Date()): string => {
  let dateObj: Date;
  if (typeof d === 'string') {
    const parts = d.split('-');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(d);
    }
  } else {
    dateObj = d;
  }

  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj).toUpperCase();
};

/**
 * Formats a Date or YYYY-MM-DD string into Title case:
 * e.g. "Friday, Oct 23, 2026"
 */
export const formatDateDisplay = (d: Date | string = new Date()): string => {
  let dateObj: Date;
  if (typeof d === 'string') {
    const parts = d.split('-');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(d);
    }
  } else {
    dateObj = d;
  }

  if (isNaN(dateObj.getTime())) {
    return String(d || '');
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Formats a Date or YYYY-MM-DD string into short:
 * e.g. "Oct 23, 2026"
 */
export const formatShortDate = (d: Date | string = new Date()): string => {
  let dateObj: Date;
  if (typeof d === 'string') {
    const parts = d.split('-');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(d);
    }
  } else {
    dateObj = d;
  }

  if (isNaN(dateObj.getTime())) {
    return String(d || '');
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Formats current clock time:
 * e.g. "10:45 AM" or "10:45:32 AM"
 */
export const formatLiveClockTime = (d: Date = new Date(), includeSeconds: boolean = false): string => {
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {})
  });
};

/**
 * Custom React Hook that ticks every 1000ms providing live Date & Time
 */
export const useLiveClock = (intervalMs: number = 1000) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  const todayDateStr = getTodayDateString(now);
  const yesterdayDateStr = getYesterdayDateString(now);
  const liveTimeWithSeconds = formatLiveClockTime(now, true);
  const liveTimeShort = formatLiveClockTime(now, false);
  const headerDateFormatted = formatFullLiveHeader(now);
  const displayDateFormatted = formatDateDisplay(now);

  return {
    now,
    todayDateStr,
    yesterdayDateStr,
    liveTimeWithSeconds,
    liveTimeShort,
    headerDateFormatted,
    displayDateFormatted
  };
};
