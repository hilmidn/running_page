import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'running-schedule-progress';

type ProgressMap = Record<string, boolean>; // key: "week-day" e.g. "1-Senin"

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggle = useCallback((week: number, day: string) => {
    const key = `${week}-${day}`;
    setProgress(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const isDone = useCallback((week: number, day: string): boolean => {
    return !!progress[`${week}-${day}`];
  }, [progress]);

  const weekProgress = useCallback((week: number, days: string[]): { done: number; total: number } => {
    const done = days.filter(d => progress[`${week}-${d}`]).length;
    return { done, total: days.length };
  }, [progress]);

  return { toggle, isDone, weekProgress };
}
