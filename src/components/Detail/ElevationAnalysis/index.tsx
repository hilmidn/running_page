import { useMemo } from 'react';
import { Mountain, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import {
  calculateElevationAnalysis,
  type GradeBand,
  type ElevationAnalysis as ElevationAnalysisData,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
}

function hillBadgeClass(
  difficulty: ElevationAnalysisData['hillDifficulty'],
): string {
  switch (difficulty) {
    case 'flat':
      return 'bg-gray-700/40 text-gray-300 border-gray-600';
    case 'easy':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    case 'moderate':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    case 'challenging':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    case 'brutal':
      return 'bg-red-500/20 text-red-400 border-red-500/40';
  }
}

function hillBorderClass(
  difficulty: ElevationAnalysisData['hillDifficulty'],
): string {
  switch (difficulty) {
    case 'flat':
      return 'border-gray-600';
    case 'easy':
      return 'border-emerald-500/60';
    case 'moderate':
      return 'border-blue-500/60';
    case 'challenging':
      return 'border-amber-500/60';
    case 'brutal':
      return 'border-red-500/60';
  }
}

function bandShortLabel(band: GradeBand): string {
  switch (band) {
    case 'steep_up':
      return 'Steep ▲';
    case 'up':
      return 'Up';
    case 'flat':
      return 'Flat';
    case 'down':
      return 'Down';
    case 'steep_down':
      return 'Steep ▼';
  }
}

export default function ElevationAnalysis({ stream }: Props) {
  const data = useMemo(() => calculateElevationAnalysis(stream), [stream]);

  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Mountain className="text-amber-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">Elevation Analysis</h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason || 'Elevation analysis is not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  // Pace delta arrow color: positive (slower GAP) = amber (uphill cost);
  // negative (faster GAP) = emerald (downhill benefit). Small |delta| = blue.
  const deltaColor =
    Math.abs(data.paceDelta) < 2
      ? '#3b82f6'
      : data.paceDelta > 0
        ? '#f59e0b'
        : '#10b981';
  const deltaArrow = data.paceDelta > 0 ? '↑' : data.paceDelta < 0 ? '↓' : '↔';

  return (
    <div
      className={`bg-linear-to-b space-y-4 rounded-2xl border from-gray-900 to-gray-800 p-6 text-white shadow-lg ${hillBorderClass(data.hillDifficulty)}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Mountain className="text-amber-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          Elevation Analysis
        </h3>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${hillBadgeClass(data.hillDifficulty)}`}
        >
          {data.hillDifficulty}
        </span>
      </div>

      {/* GAP pace comparison */}
      <div className="rounded-xl bg-gray-800/60 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
              Actual Pace
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold text-gray-200">
              {data.actualPaceFormatted}
              <span className="ml-1 text-xs text-gray-500">/km</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
              GAP (Flat-eq)
            </div>
            <div
              className="mt-1 font-mono text-2xl font-semibold"
              style={{ color: '#3b82f6' }}
            >
              {data.gapPaceFormatted}
              <span className="ml-1 text-xs text-gray-500">/km</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-gray-700/60 pt-3">
          <span className="text-xs text-gray-400">Pace cost of terrain</span>
          <span
            className="ml-auto font-mono text-sm font-semibold"
            style={{ color: deltaColor }}
          >
            {deltaArrow}{' '}
            {data.paceDelta > 0 ? '+' : ''}
            {data.paceDelta.toFixed(1)} s/km
          </span>
        </div>
      </div>

      {/* Zone stacked bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Layers size={12} />
          <span>Grade distribution</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-700/60">
          {data.zones.map((z) =>
            z.percentage > 0 ? (
              <div
                key={z.band}
                className="h-full transition-all"
                style={{
                  width: `${z.percentage}%`,
                  backgroundColor: z.color,
                }}
                title={`${z.label}: ${z.percentage.toFixed(1)}%`}
              />
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
          {data.zones.map((z) => (
            <div key={z.band} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: z.color }}
              />
              <span className="text-gray-300">{bandShortLabel(z.band)}</span>
              <span className="text-gray-500">
                {z.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Elevation context */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 rounded-lg bg-gray-800/40 px-3 py-2">
          <ArrowUp size={12} className="text-emerald-400" />
          <span className="text-gray-400">Gain</span>
          <span className="ml-auto font-mono font-semibold text-emerald-400">
            +{data.totalElevationGain} m
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-800/40 px-3 py-2">
          <ArrowDown size={12} className="text-red-400" />
          <span className="text-gray-400">Loss</span>
          <span className="ml-auto font-mono font-semibold text-red-400">
            -{data.totalElevationLoss} m
          </span>
        </div>
        <div className="col-span-2 flex items-center gap-2 rounded-lg bg-gray-800/40 px-3 py-2">
          <span className="text-gray-400">Avg grade</span>
          <span className="ml-auto font-mono font-semibold text-gray-200">
            {(data.avgGrade * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        {data.hillMessage} GAP applies Minetti's 1998 energy-cost polynomial
        to convert hilly pace into a flat-equivalent number for fair effort
        comparison.
      </p>
    </div>
  );
}
