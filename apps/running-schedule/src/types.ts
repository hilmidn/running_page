export type WorkoutType = 'run' | 'strength' | 'mobility' | 'rest' | 'race' | 'other';

export interface Workout {
  day: string;
  emoji: string;
  type: WorkoutType;
  label: string;
  detail: string;
}

export interface Week {
  week: number;
  phase: string;
  total: string;
  subtext: string;
  days: Workout[];
  notes: string;
}

export interface Phase {
  name: string;
  weeks: [number, number];
}

export interface ScheduleData {
  title: string;
  athlete: string;
  start_date: string;
  total_weeks: number;
  phases: Phase[];
  weeks: Week[];
}
