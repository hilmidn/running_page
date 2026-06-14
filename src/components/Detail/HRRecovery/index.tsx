import { useMemo } from 'react';
import { HeartPulse, Timer, Zap } from 'lucide-react';
import {
  calculateHRRecovery,
  secondsToTimeString,
  getHRRecoveryColor,
  type HRRecoveryGrade,
  type HRRecoveryEffort,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
  maxHR?: number;
}

function gradeBadgeClass(grade: HRRecoveryGrade): string {
  switch (grade) {
    case 'excellent':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    case 'good':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    case 'fair':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    case 'poor':
      return 'bg-red-500/20 text-red-400 border-red-500/40';
    default:
      return 'bg-gray-700/40 text-gray-400 border-gray-600';
  }
}

function gradeBorderClass(grade: HRRecoveryGrade): string {
  switch (grade) {
    case 'excellent':
      return 'border-emerald-500/60';
    case 'good':
      return 'border-blue-500/60';
    case 'fair':
      return 'border-amber-500/60';
    case 'poor':
      return 'border-red-500/60';
    default:
      return 'border-gray-600';
  }
}

/**
 * One recovery interval — a labelled row with the bpm drop, % drop,
 * and a thin bar that fills proportionally to the bpm drop (max 60 bpm
 * saturates the bar).
 */
function RecoveryRow({
  label,
  drop,
  pct,
  grade,
  peak,
}: {
  label: string;
  drop: number | null;
  pct: number | null;
  grade: HRRecoveryGrade;
  peak: number;
}) {
  const color = getHRRecoveryColor(grade);
  const display = drop != null ? Math.abs(drop) : null;
  const directionArrow = drop == null ? '' : drop >= 0 ? '↓' : '↑';
  const barWidth = display == null ? 0 : Math.min(100, (display / 60) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 shrink-0 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        {label}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span
            className="font-mono text-lg font-semibold"
            style={{ color: drop != null ? color : '#6b7280' }}
          >
            {display != null ? `${directionArrow}${display}` : '—'}
          </span>
          <span className="text-[10px] text-gray-500">bpm</span>
          {pct != null && (
            <span className="ml-auto text-[10px] text-gray-500">
              {pct.toFixed(1)}% of peak
            </span>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700/60">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${barWidth}%`,
              backgroundColor: drop != null ? color : '#374151',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function HRRecovery({ stream, maxHR = 180 }: Props) {
  const data = useMemo(
    () => calculateHRRecovery(stream, maxHR),
    [stream, maxHR],
  );

  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <HeartPulse className="text-red-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">HR Recovery</h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason || 'HR recovery analysis is not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  const gradeColor = getHRRecoveryColor(data.grade);

  // Effort-context overrides the visual label. The clinical HRR-1
  // thresholds (≥18 Excellent, etc.) were derived from high-intensity
  // efforts — applying them to easy Z2 runs is meaningless and
  // misleads the user into thinking their cardiovascular system is
  // "Poor". The pill colour tracks the underlying grade, but the
  // *label* is contextualised.
  const effortBadgeMeta: Record<
    HRRecoveryEffort,
    { label: string; className: string }
  > = {
    high: {
      label: data.label,
      className: gradeBadgeClass(data.grade),
    },
    moderate: {
      label: 'Moderate effort',
      className:
        'bg-blue-500/20 text-blue-400 border-blue-500/40',
    },
    low: {
      label: 'Low-intensity context',
      className:
        'bg-gray-700/40 text-gray-300 border-gray-600',
    },
  };
  const effortMeta = effortBadgeMeta[data.effort];

  // Effort-aware message: re-frames the grade when peak HR was below the
  // clinical threshold so the user doesn't misread "Poor" as cardiac.
  const effortMessage =
    data.effort === 'low'
      ? `Peak HR was ${data.peakHRPercent?.toFixed(0)}% of maxHR — below the 75% threshold for a meaningful HRR-1 measurement. The drop looks small because the body wasn't stressed enough to mount a parasympathetic rebound. The numbers are still useful for tracking trends; use a tempo or interval session to get a clinical HRR-1 reading.`
      : data.effort === 'moderate'
        ? `Peak HR was ${data.peakHRPercent?.toFixed(0)}% of maxHR — close to the 75% clinical threshold. HRR-1 reading is directional; for a definitive answer use a high-intensity effort.`
        : data.message;

  return (
    <div
      className={`bg-linear-to-b space-y-4 rounded-2xl border from-gray-900 to-gray-800 p-6 text-white shadow-lg ${gradeBorderClass(data.grade)}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <HeartPulse className="text-red-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">HR Recovery</h3>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${effortMeta.className}`}
        >
          {effortMeta.label}
        </span>
      </div>

      {/* Peak HR card */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${gradeColor}22` }}
        >
          <Zap size={20} style={{ color: gradeColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-3xl font-bold leading-none"
              style={{ color: gradeColor }}
            >
              {data.hrr1 != null ? `−${data.hrr1}` : '—'}
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              bpm @ +1 min
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{effortMessage}</p>
        </div>
      </div>

      {/* Recovery progression rows */}
      <div className="space-y-3 rounded-xl bg-gray-800/40 p-3">
        <RecoveryRow
          label="+1 min"
          drop={data.hrr1}
          pct={data.pct1}
          grade={data.grade}
          peak={data.peakHR}
        />
        <RecoveryRow
          label="+2 min"
          drop={data.hrr2}
          pct={data.pct2}
          grade={data.grade}
          peak={data.peakHR}
        />
        <RecoveryRow
          label="+3 min"
          drop={data.hrr3}
          pct={data.pct3}
          grade={data.grade}
          peak={data.peakHR}
        />
      </div>

      {/* Peak context */}
      <div className="flex items-center justify-between rounded-xl bg-gray-800/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <Timer size={12} />
          <span>Peak HR</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-gray-200">
            {data.peakHR} bpm
          </span>
          {data.peakHRPercent != null && (
            <span
              className="rounded-md border px-1.5 py-0.5 text-[10px] font-mono"
              style={{
                color:
                  data.effort === 'high'
                    ? '#10b981'
                    : data.effort === 'moderate'
                      ? '#3b82f6'
                      : '#9ca3af',
                borderColor:
                  data.effort === 'high'
                    ? '#10b98140'
                    : data.effort === 'moderate'
                      ? '#3b82f640'
                      : '#6b728040',
                backgroundColor:
                  data.effort === 'high'
                    ? '#10b98115'
                    : data.effort === 'moderate'
                      ? '#3b82f615'
                      : '#6b728015',
              }}
            >
              {data.peakHRPercent.toFixed(0)}% maxHR
            </span>
          )}
          <span className="text-[10px] text-gray-500">
            @ {secondsToTimeString(data.peakTimeSec)} ·{' '}
            {data.peakDistanceKm.toFixed(2)} km
          </span>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        HRR-1 ≥ 18 bpm is a strong indicator of cardiovascular fitness.
        Clinical thresholds assume peak HR ≥ 85% of maxHR (high-intensity
        effort). For easy / moderate runs the grade is contextualised —
        use a tempo or interval session to get a definitive HRR-1
        reading.
      </p>
    </div>
  );
}
