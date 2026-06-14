import { useMemo } from 'react';
import { Flame, Gauge, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  detectLactateThreshold,
  type LTMethod,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
  maxHR?: number;
}

function methodBadgeClass(m: LTMethod): string {
  switch (m) {
    case 'fastest_30min':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    case 'fastest_20min':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    case 'hr_inflection':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    default:
      return 'bg-gray-700/40 text-gray-400 border-gray-600';
  }
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return '#10b981';
  if (c >= 0.65) return '#3b82f6';
  return '#f59e0b';
}

function confidenceLabel(c: number): string {
  if (c >= 0.8) return 'High confidence';
  if (c >= 0.65) return 'Medium';
  return 'Low — heuristic only';
}

export default function LactateThreshold({ stream, maxHR = 180 }: Props) {
  const data = useMemo(
    () => detectLactateThreshold(stream, maxHR),
    [stream, maxHR],
  );

  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Flame className="text-orange-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">
            Lactate Threshold
          </h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason || 'Lactate threshold not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  const confColor = confidenceColor(data.confidence);

  return (
    <div className="bg-linear-to-b space-y-4 rounded-2xl border border-orange-500/40 from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <Flame className="text-orange-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          Lactate Threshold
        </h3>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${methodBadgeClass(data.method)}`}
        >
          {data.methodLabel}
        </span>
      </div>

      {/* LT pace big number */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
          <Gauge size={20} className="text-orange-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold leading-none text-orange-400">
              {data.ltPaceFormatted}
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              /km
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{data.message}</p>
        </div>
      </div>

      {/* LT HR + context */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            LT Heart Rate
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {data.ltHR != null ? `${data.ltHR} bpm` : '—'}
          </div>
          {data.ltHRPercent != null && (
            <div className="text-[10px] text-gray-500">
              {data.ltHRPercent.toFixed(0)}% of maxHR
            </div>
          )}
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Velocity at LT
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {data.velocityAtLT != null
              ? `${data.velocityAtLT.toFixed(2)} m/s`
              : '—'}
          </div>
          <div className="text-[10px] text-gray-500">
            Sustained threshold pace
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div
        className="flex items-center gap-2 rounded-lg border p-3 text-[11px]"
        style={{
          borderColor: `${confColor}40`,
          backgroundColor: `${confColor}10`,
        }}
      >
        {data.confidence >= 0.65 ? (
          <CheckCircle2 size={14} style={{ color: confColor }} />
        ) : (
          <AlertCircle size={14} style={{ color: confColor }} />
        )}
        <span
          className="font-semibold tracking-wide uppercase"
          style={{ color: confColor }}
        >
          {confidenceLabel(data.confidence)} · {Math.round(data.confidence * 100)}%
        </span>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        LT is the pace above which lactate accumulates faster than
        clearance. Daniels&apos; canonical method: ≈ the pace you can hold
        for 60 min steady-state, approximated here by the fastest 30-min
        effort. Used to anchor tempo/threshold training zones.
      </p>
    </div>
  );
}
