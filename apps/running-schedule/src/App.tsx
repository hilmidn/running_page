import { useEffect, useMemo, useState } from 'react';
import type { ScheduleData, Week } from './types';
import { useProgress } from './useProgress';
import rawData from './data.json';

const data = rawData as unknown as ScheduleData;

const TYPE_COLORS: Record<string, string> = {
  run: 'border-l-orange-500 bg-orange-500/5',
  strength: 'border-l-purple-500 bg-purple-500/5',
  mobility: 'border-l-cyan-500 bg-cyan-500/5',
  rest: 'border-l-zinc-600 bg-zinc-800/50',
  race: 'border-l-amber-400 bg-amber-400/10',
  other: 'border-l-zinc-600 bg-zinc-800/50',
};

const TYPE_ACCENT: Record<string, string> = {
  run: 'text-orange-400',
  strength: 'text-purple-400',
  mobility: 'text-cyan-400',
  rest: 'text-zinc-500',
  race: 'text-amber-400',
  other: 'text-zinc-500',
};

const DAY_LABELS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function getTodayDayName(): string {
  try {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  } catch {
    // Fallback mapping
    const map = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return map[new Date().getDay()];
  }
}

function getCurrentWeek(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diff = today.getTime() - start.getTime();
  const week = Math.floor(diff / (7 * 86400000)) + 1;
  return Math.max(1, Math.min(12, week));
}

function typeIcon(type: string): string {
  switch (type) {
    case 'run': return '🏃';
    case 'strength': return '💪';
    case 'mobility': return '🧘';
    case 'rest': return '🛌';
    case 'race': return '🔥';
    default: return '📋';
  }
}

function PhaseIndicator({ week }: { week: Week }) {
  return (
    <div className="text-center mb-2">
      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 tracking-wide uppercase">
        {week.phase.replace('FASE ', 'Fase ')}
      </span>
    </div>
  );
}

function WeekNav({
  week,
  totalWeeks,
  onPrev,
  onNext,
}: {
  week: number;
  totalWeeks: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrev}
        disabled={week <= 1}
        className="w-10 h-10 flex items-center justify-center rounded-full
          bg-zinc-800 text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed
          active:bg-zinc-700 transition-colors"
        aria-label="Previous week"
      >
        ◀
      </button>
      <div className="text-center">
        <div className="text-lg font-bold text-white">Minggu {week}</div>
        <div className="text-xs text-zinc-400">dari {totalWeeks}</div>
      </div>
      <button
        onClick={onNext}
        disabled={week >= totalWeeks}
        className="w-10 h-10 flex items-center justify-center rounded-full
          bg-zinc-800 text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed
          active:bg-zinc-700 transition-colors"
        aria-label="Next week"
      >
        ▶
      </button>
    </div>
  );
}

function DayCard({
  day,
  type,
  emoji,
  label,
  detail,
  isToday,
  isDone,
  onToggle,
}: {
  day: string;
  type: string;
  emoji: string;
  label: string;
  detail: string;
  isToday: boolean;
  isDone: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = TYPE_COLORS[type] || TYPE_COLORS.other;

  return (
    <div
      className={`
        rounded-xl border-l-4 p-4 mb-3 transition-all duration-200
        ${colorClass}
        ${isToday ? 'ring-1 ring-zinc-500' : ''}
        ${isDone ? 'opacity-40' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {day}
              {isToday && <span className="ml-2 text-xs text-zinc-400">• Hari ini</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji || typeIcon(type)}</span>
            <span className="font-medium text-white text-sm leading-tight">{label}</span>
          </div>
          {detail && expanded && (
            <div className="mt-2 text-xs text-zinc-400 leading-relaxed ml-9 border-l border-zinc-700 pl-3">
              {detail.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          {detail && !expanded && (
            <div className="text-xs text-zinc-500 ml-9 truncate mt-0.5">
              {detail.replace(/\*\*/g, '').slice(0, 60)}
              {detail.length > 60 ? '…' : ''}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`
            w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
            text-sm transition-all duration-200
            ${isDone
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-700 text-zinc-400 active:bg-zinc-600'
            }
          `}
          aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
        >
          {isDone ? '✓' : '○'}
        </button>
      </div>
    </div>
  );
}

function WeekProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
        <span>Progress</span>
        <span>{done}/{total} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WeekNotes({ notes }: { notes: string }) {
  if (!notes) return null;
  return (
    <div className="mb-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
      <div className="text-xs text-zinc-300 leading-relaxed">
        {notes.split(/\*\*(.*?)\*\*/).map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="text-orange-300">{part}</strong> : part
        )}
      </div>
    </div>
  );
}

function WeekView({
  week,
  todayDay,
  progress,
  onToggle,
}: {
  week: Week;
  todayDay: string;
  progress: ReturnType<typeof useProgress>;
  onToggle: (day: string) => void;
}) {
  const { done, total } = progress.weekProgress(week.week, week.days.map(d => d.day));

  return (
    <div className="px-4 pb-8">
      <PhaseIndicator week={week} />
      {week.total && (
        <div className="text-center mb-4">
          <span className="inline-block text-xs font-mono text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">
            Total ~{week.total}
          </span>
        </div>
      )}
      {week.subtext && (
        <div className="text-center mb-4">
          <span className="text-xs text-amber-400/80 italic">{week.subtext}</span>
        </div>
      )}
      <WeekProgress done={done} total={total} />
      <WeekNotes notes={week.notes} />
      <div>
        {week.days.map((day) => (
          <DayCard
            key={day.day}
            day={day.day}
            type={day.type}
            emoji={day.emoji}
            label={day.label}
            detail={day.detail}
            isToday={day.day === todayDay}
            isDone={progress.isDone(week.week, day.day)}
            onToggle={() => onToggle(day.day)}
          />
        ))}
      </div>
      <div className="text-center mt-6 text-xs text-zinc-600">
        Tandai latihan selesai • Data tersimpan di browser
      </div>
    </div>
  );
}

export default function App() {
  const startDate = data.start_date || '2026-06-08';
  const [currentWeek, setCurrentWeek] = useState(() => getCurrentWeek(startDate));
  const todayDay = useMemo(() => getTodayDayName(), []);
  const progress = useProgress();

  const week = data.weeks.find(w => w.week === currentWeek);

  useEffect(() => {
    document.title = `Minggu ${currentWeek} — Program Lari`;
  }, [currentWeek]);

  const goToWeek = (w: number) => {
    setCurrentWeek(Math.max(1, Math.min(data.total_weeks, w)));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">🏃 Lari</h1>
            <p className="text-[10px] text-zinc-500">{data.athlete}</p>
          </div>
          <div className="flex gap-1">
            {data.phases.map((phase, i) => {
              const [s, e] = phase.weeks;
              const active = currentWeek >= s && currentWeek <= e;
              return (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded text-[10px] leading-tight transition-colors ${
                    active ? 'bg-orange-500/20 text-orange-300' : 'text-zinc-600'
                  }`}
                >
                  F{i + 1}
                </span>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto pt-4">
        {/* Week selector as dots */}
        <div className="px-4 mb-2">
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: data.total_weeks }, (_, i) => i + 1).map((w) => (
              <button
                key={w}
                onClick={() => goToWeek(w)}
                className={`w-2 h-2 rounded-full transition-all ${
                  w === currentWeek
                    ? 'bg-orange-400 scale-125'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                }`}
                aria-label={`Go to week ${w}`}
              />
            ))}
          </div>
        </div>

        {week ? (
          <WeekView
            week={week}
            todayDay={todayDay}
            progress={progress}
            onToggle={(day) => progress.toggle(week.week, day)}
          />
        ) : (
          <div className="text-center py-12 text-zinc-500">
            Data tidak ditemukan
          </div>
        )}

        {/* Week nav */}
        <div className="sticky bottom-0 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <WeekNav
              week={currentWeek}
              totalWeeks={data.total_weeks}
              onPrev={() => goToWeek(currentWeek - 1)}
              onNext={() => goToWeek(currentWeek + 1)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
