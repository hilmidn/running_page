import { useMemo } from 'react';
import { Gauge, TrendingUp, Timer } from 'lucide-react';
import {
  estimateVO2max,
  getVO2maxColor,
  formatPace,
  secondsToTimeString,
  type VO2maxGrade,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
}

function gradeBadgeClass(grade: VO2maxGrade): string {
  switch (grade) {
    case 'elite':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'excellent':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    case 'good':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    case 'fair':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    case 'beginner':
      return 'bg-gray-700/40 text-gray-300 border-gray-600';
    default:
      return 'bg-gray-700/40 text-gray-400 border-gray-600';
  }
}

function gradeBorderClass(grade: VO2maxGrade): string {
  switch (grade) {
    case 'elite':
      return 'border-purple-500/60';
    case 'excellent':
      return 'border-emerald-500/60';
    case 'good':
      return 'border-blue-500/60';
    case 'fair':
      return 'border-amber-500/60';
    case 'beginner':
      return 'border-gray-600';
    default:
      return 'border-gray-600';
  }
}

export default function VO2maxEstimate({ stream }: Props) {
  const data = useMemo(() => estimateVO2max(stream), [stream]);

  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Gauge className="text-blue-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">VO2max Estimate</h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason || 'VO2max estimation is not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  const primary = data.fromBestEffort ?? data.fromAverage;
  const primaryColor = getVO2maxColor(data.grade);

  // Best-effort pace for context
  let bestEffortPace: number | null = null;
  if (data.bestEffortSpeed && data.bestEffortSpeed > 0) {
    bestEffortPace = 1000 / data.bestEffortSpeed; // sec/km
  }

  return (
    <div
      className={`bg-linear-to-b space-y-4 rounded-2xl border from-gray-900 to-gray-800 p-6 text-white shadow-lg ${gradeBorderClass(data.grade)}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gauge className="text-blue-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">VO2max Estimate</h3>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${gradeBadgeClass(data.grade)}`}
        >
          {data.label}
        </span>
      </div>

      {/* Primary VO2max big number */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${primaryColor}22` }}
        >
          <TrendingUp size={20} style={{ color: primaryColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-3xl font-bold leading-none"
              style={{ color: primaryColor }}
            >
              {primary.toFixed(1)}
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              mL/kg/min
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{data.message}</p>
        </div>
      </div>

      {/* Two estimates side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-3">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            From Average
          </div>
          <div className="mt-2 font-mono text-xl font-semibold text-gray-200">
            {data.fromAverage.toFixed(1)}
          </div>
          <div className="mt-1 text-[10px] text-gray-500">
            Whole-activity effort
          </div>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-3">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Best 5-min
          </div>
          {data.fromBestEffort != null ? (
            <>
              <div className="mt-2 font-mono text-xl font-semibold text-gray-200">
                {data.fromBestEffort.toFixed(1)}
              </div>
              <div className="mt-1 text-[10px] text-gray-500">
                {bestEffortPace != null
                  ? `${formatPace(bestEffortPace)}/km`
                  : ''}
                {data.bestEffortTimeWindow && (
                  <>
                    {' · '}
                    {secondsToTimeString(data.bestEffortTimeWindow.startSec)}–
                    {secondsToTimeString(data.bestEffortTimeWindow.endSec)}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-2 font-mono text-xl text-gray-500">—</div>
              <div className="mt-1 text-[10px] text-gray-500">
                Run is under 5 min
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        <Timer size={10} className="mr-1 inline" />
        Daniels/Gilbert formula:{' '}
        <code className="text-gray-400">VO₂ = -4.60 + 0.18·v + 0.0001·v²</code>{' '}
        (v in m/min). Best 5-min effort is the better race-fitness proxy —
        average is diluted by warm-up and cooldown.
      </p>
    </div>
  );
}
