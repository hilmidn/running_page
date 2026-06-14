import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus, Flag } from 'lucide-react';
import {
  detectNegativeSplit,
  type SplitPattern,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
}

function patternBorderClass(p: SplitPattern): string {
  switch (p) {
    case 'negative':
      return 'border-emerald-500/60';
    case 'even':
      return 'border-blue-500/40';
    case 'positive':
      return 'border-amber-500/60';
    default:
      return 'border-gray-600';
  }
}

function patternBadgeClass(p: SplitPattern): string {
  switch (p) {
    case 'negative':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    case 'even':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    case 'positive':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    default:
      return 'bg-gray-700/40 text-gray-400 border-gray-600';
  }
}

function patternIcon(p: SplitPattern) {
  if (p === 'negative') return <TrendingDown size={12} />;
  if (p === 'positive') return <TrendingUp size={12} />;
  return <Minus size={12} />;
}

export default function NegativeSplit({ stream }: Props) {
  const data = useMemo(() => detectNegativeSplit(stream), [stream]);

  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Flag className="text-sky-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">Pacing Pattern</h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason || 'Not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-linear-to-b space-y-4 rounded-2xl border from-gray-900 to-gray-800 p-6 text-white shadow-lg ${patternBorderClass(data.pattern)}`}
    >
      <div className="flex items-center gap-2">
        <Flag className="text-sky-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Pacing Pattern</h3>
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${patternBadgeClass(data.pattern)}`}
        >
          {patternIcon(data.pattern)}
          {data.label}
        </span>
      </div>

      {/* Side-by-side halves */}
      <div className="grid grid-cols-2 gap-3">
        {[data.firstHalf, data.secondHalf].map((half) =>
          half ? (
            <div
              key={half.label}
              className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                  {half.label}
                </div>
                <div className="text-[10px] text-gray-500">
                  {half.distanceKm.toFixed(2)} km
                </div>
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold text-gray-200">
                {half.paceFormatted}
                <span className="ml-1 text-xs text-gray-500">/km</span>
              </div>
              <div className="mt-1 text-[10px] text-gray-500">
                {half.durationFormatted}
                {half.avgHR != null && ` · ${half.avgHR} bpm`}
              </div>
            </div>
          ) : null,
        )}
      </div>

      {/* Delta bar */}
      <div className="rounded-xl bg-gray-800/60 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">2nd half vs 1st half</span>
          <span
            className="font-mono font-semibold"
            style={{ color: data.color }}
          >
            {data.paceDelta > 0 ? '+' : ''}
            {data.paceDelta.toFixed(1)} s/km (
            {data.paceDeltaPct > 0 ? '+' : ''}
            {data.paceDeltaPct.toFixed(1)}%)
          </span>
        </div>
        <div className="relative mt-2 h-1.5 w-full rounded-full bg-gray-700/60">
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              backgroundColor: data.color,
              width: `${Math.min(100, Math.abs(data.paceDeltaPct) * 8)}%`,
              left: data.paceDelta < 0 ? '0' : 'auto',
              right: data.paceDelta >= 0 ? '0' : 'auto',
            }}
          />
        </div>
      </div>

      <p
        className="rounded-lg p-3 text-[11px] leading-relaxed"
        style={{
          backgroundColor: `${data.color}10`,
          color: '#d1d5db',
        }}
      >
        {data.message}
      </p>
    </div>
  );
}
