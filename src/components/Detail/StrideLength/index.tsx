import { useMemo, type ReactElement } from 'react';
import {
  Ruler,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { analyzeStrideLength } from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
}

function variabilityColor(pct: number): string {
  if (pct < 6) return '#10b981'; // very consistent
  if (pct < 12) return '#3b82f6'; // normal variability
  if (pct < 18) return '#f59e0b'; // a bit erratic
  return '#ef4444'; // very erratic
}

function correlationLabel(r: number): { label: string; color: string; icon: ReactElement } {
  // For stride vs pace: stride should *decrease* as pace slows (sec/km higher).
  // We computed r between pace (sec/km) and stride (m), so a *negative*
  // r is the expected "faster pace = longer stride" relationship.
  if (r <= -0.5)
    return {
      label: 'Strong: faster pace = longer stride',
      color: '#10b981',
      icon: <TrendingDown size={12} />,
    };
  if (r <= -0.25)
    return {
      label: 'Moderate pace-stride coupling',
      color: '#3b82f6',
      icon: <TrendingDown size={12} />,
    };
  if (r < 0.25)
    return {
      label: 'Weak — stride held steady across paces',
      color: '#f59e0b',
      icon: <Minus size={12} />,
    };
  if (r < 0.5)
    return {
      label: 'Counter-intuitive positive — slow pace, long stride?',
      color: '#f59e0b',
      icon: <TrendingUp size={12} />,
    };
  return {
    label: 'Inverse pattern — fatigue or downhill bias likely',
    color: '#ef4444',
    icon: <TrendingUp size={12} />,
  };
}

export default function StrideLength({ stream }: Props) {
  const data = useMemo(() => analyzeStrideLength(stream), [stream]);

  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Ruler className="text-teal-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">Stride Length</h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason || 'Stride length not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  const corr = data.paceStrideCorrelation;
  const corrMeta = corr != null ? correlationLabel(corr) : null;
  const variabilityMetaColor = variabilityColor(data.strideVariabilityPct);

  return (
    <div className="bg-linear-to-b space-y-4 rounded-2xl border border-teal-500/40 from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <Ruler className="text-teal-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Stride Length</h3>
        <span className="ml-auto rounded-full border border-teal-500/40 bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-teal-400 uppercase">
          {data.samples} samples
        </span>
      </div>

      {/* Big number */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-500/20">
          <Ruler size={20} className="text-teal-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold leading-none text-teal-400">
              {data.avgStrideLengthM.toFixed(2)}
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              m / stride
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{data.message}</p>
        </div>
      </div>

      {/* Range bar */}
      <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-3">
        <div className="flex items-center justify-between text-[10px] tracking-wider text-gray-400 uppercase">
          <span>Range</span>
          <span className="font-mono text-gray-300">
            {data.minStrideLengthM.toFixed(2)} –{' '}
            {data.maxStrideLengthM.toFixed(2)} m
          </span>
        </div>
        <div className="relative mt-2 h-2 w-full rounded-full bg-gray-700/60">
          {/* Bar from min to max, with avg marker */}
          {(() => {
            const min = data.minStrideLengthM;
            const max = data.maxStrideLengthM;
            const range = Math.max(0.01, max - min);
            const avgPct = ((data.avgStrideLengthM - min) / range) * 100;
            return (
              <>
                <div
                  className="absolute top-0 h-full rounded-full bg-teal-500/40"
                  style={{ left: 0, width: '100%' }}
                />
                <div
                  className="absolute top-0 h-full w-1 rounded-full bg-teal-300"
                  style={{ left: `${avgPct}%` }}
                />
              </>
            );
          })()}
        </div>
      </div>

      {/* Variability + correlation */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Variability (CoV)
          </div>
          <div
            className="mt-1 font-mono font-semibold"
            style={{ color: variabilityMetaColor }}
          >
            {data.strideVariabilityPct.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Slope
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {data.stridePerPaceSec != null
              ? `${(data.stridePerPaceSec * 1000).toFixed(2)} cm / (min/km)`
              : '—'}
          </div>
        </div>
      </div>

      {corrMeta && corr != null && (
        <div
          className="flex items-center gap-2 rounded-lg border p-2.5 text-[11px]"
          style={{
            borderColor: `${corrMeta.color}40`,
            backgroundColor: `${corrMeta.color}10`,
          }}
        >
          <span style={{ color: corrMeta.color }}>{corrMeta.icon}</span>
          <span className="text-gray-300">
            r = {corr.toFixed(2)} — {corrMeta.label}
          </span>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-gray-500">
        Per-sample stride = horizontal distance ÷ steps over that sample.
        Filters out walking/pause samples and unreasonable paces. Slope
        = linear regression of stride vs. pace (cm gained per 1 min/km
        faster).
      </p>
    </div>
  );
}
