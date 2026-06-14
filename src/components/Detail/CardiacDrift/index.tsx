import { useMemo } from 'react';
import {
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import {
  calculateCardiacDrift,
  getDriftColor,
  type CardiacDriftStatus,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
  maxHR: number;
}

function statusBorderClass(status: CardiacDriftStatus): string {
  switch (status) {
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

function statusBadgeClass(status: CardiacDriftStatus): string {
  switch (status) {
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

function DriftIcon({ value }: { value: number }) {
  if (value < 0) return <TrendingUp size={14} className="text-emerald-400" />;
  if (value < 5) return <Minus size={14} className="text-emerald-400" />;
  if (value < 10) return <TrendingDown size={14} className="text-blue-400" />;
  if (value < 15) return <TrendingDown size={14} className="text-amber-400" />;
  return <TrendingDown size={14} className="text-red-400" />;
}

function HalfCard({
  title,
  distanceKm,
  paceFormatted,
  avgHR,
  hrPercent,
}: {
  title: string;
  distanceKm: number;
  paceFormatted: string;
  avgHR: number;
  hrPercent: number;
}) {
  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-800/60 p-3">
      <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        {title}
      </div>
      <div className="mt-2 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Dist</span>
          <span className="font-mono text-gray-200">
            {distanceKm.toFixed(2)} km
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Pace</span>
          <span className="font-mono text-gray-200">{paceFormatted}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Avg HR</span>
          <span className="font-mono text-gray-200">
            {avgHR}
            <span className="ml-1 text-[10px] text-gray-500">
              ({hrPercent.toFixed(0)}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CardiacDrift({ stream, maxHR }: Props) {
  const data = useMemo(
    () => calculateCardiacDrift(stream, maxHR),
    [stream, maxHR]
  );

  // Hide entire card when analysis isn't meaningful — short run, no HR, etc.
  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Activity className="text-pink-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">Cardiac Drift</h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason || 'Cardiac drift analysis not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  const { firstHalf, secondHalf, decoupling, status, label, message } = data;
  const driftColor = getDriftColor(status);
  const hrChange = secondHalf!.avgHR - firstHalf!.avgHR;
  const paceChange = secondHalf!.avgPace - firstHalf!.avgPace; // +ve = slower
  const efChange =
    ((secondHalf!.efficiencyFactor - firstHalf!.efficiencyFactor) /
      firstHalf!.efficiencyFactor) *
    100;

  return (
    <div
      className={`bg-linear-to-b space-y-4 rounded-2xl border from-gray-900 to-gray-800 p-6 text-white shadow-lg ${statusBorderClass(status)}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Heart className="text-pink-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Cardiac Drift</h3>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${statusBadgeClass(status)}`}
        >
          {label}
        </span>
      </div>

      {/* Decoupling big number */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${driftColor}22` }}
        >
          <DriftIcon value={decoupling} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-3xl font-bold leading-none"
              style={{ color: driftColor }}
            >
              {decoupling > 0 ? '+' : ''}
              {decoupling.toFixed(1)}%
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              Aerobic Decoupling
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{message}</p>
        </div>
      </div>

      {/* Half comparison */}
      <div className="grid grid-cols-2 gap-3">
        <HalfCard
          title="1st Half"
          distanceKm={firstHalf!.distanceKm}
          paceFormatted={firstHalf!.paceFormatted}
          avgHR={firstHalf!.avgHR}
          hrPercent={(firstHalf!.avgHR / maxHR) * 100}
        />
        <HalfCard
          title="2nd Half"
          distanceKm={secondHalf!.distanceKm}
          paceFormatted={secondHalf!.paceFormatted}
          avgHR={secondHalf!.avgHR}
          hrPercent={(secondHalf!.avgHR / maxHR) * 100}
        />
      </div>

      {/* Delta breakdown */}
      <div className="space-y-1.5 rounded-xl bg-gray-800/40 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">HR change</span>
          <span
            className={`font-mono font-semibold ${
              hrChange > 0
                ? 'text-amber-400'
                : hrChange < 0
                  ? 'text-emerald-400'
                  : 'text-gray-300'
            }`}
          >
            {hrChange > 0 ? '+' : ''}
            {hrChange.toFixed(0)} bpm
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Pace change</span>
          <span
            className={`font-mono font-semibold ${
              paceChange > 5
                ? 'text-amber-400'
                : paceChange < -5
                  ? 'text-emerald-400'
                  : 'text-gray-300'
            }`}
          >
            {paceChange > 0 ? '+' : ''}
            {paceChange.toFixed(1)} s/km
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Efficiency Factor</span>
          <span
            className={`font-mono font-semibold ${
              efChange < 0
                ? 'text-amber-400'
                : efChange > 0
                  ? 'text-emerald-400'
                  : 'text-gray-300'
            }`}
          >
            {efChange > 0 ? '+' : ''}
            {efChange.toFixed(1)}%
          </span>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        EF = speed ÷ avg HR. Lower decoupling (&lt;5%) = stronger aerobic
        efficiency. Test weekly on a steady 30–60 min run to track aerobic
        base.
      </p>
    </div>
  );
}
