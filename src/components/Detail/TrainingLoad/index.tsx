import { useMemo } from 'react';
import { Activity as ActivityIcon, Moon, Clock } from 'lucide-react';
import {
  calculateTRIMP,
  type TrainingLoadBand,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
  maxHR?: number;
  restHR?: number;
}

function bandBadgeClass(band: TrainingLoadBand): string {
  switch (band) {
    case 'recovery':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    case 'light':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    case 'moderate':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    case 'hard':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    case 'very_hard':
      return 'bg-red-500/20 text-red-400 border-red-500/40';
  }
}

function bandBorderClass(band: TrainingLoadBand): string {
  switch (band) {
    case 'recovery':
      return 'border-emerald-500/40';
    case 'light':
      return 'border-blue-500/40';
    case 'moderate':
      return 'border-amber-500/40';
    case 'hard':
      return 'border-orange-500/40';
    case 'very_hard':
      return 'border-red-500/40';
  }
}

export default function TrainingLoad({
  stream,
  maxHR = 180,
  restHR = 60,
}: Props) {
  const data = useMemo(
    () => calculateTRIMP(stream, maxHR, restHR),
    [stream, maxHR, restHR],
  );

  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <ActivityIcon className="text-amber-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">
            Training Load (TRIMP)
          </h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason || 'TRIMP not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-linear-to-b space-y-4 rounded-2xl border from-gray-900 to-gray-800 p-6 text-white shadow-lg ${bandBorderClass(data.band)}`}
    >
      <div className="flex items-center gap-2">
        <ActivityIcon className="text-amber-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          Training Load (TRIMP)
        </h3>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${bandBadgeClass(data.band)}`}
        >
          {data.bandLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${data.bandColor}22` }}
        >
          <ActivityIcon size={20} style={{ color: data.bandColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-3xl font-bold leading-none"
              style={{ color: data.bandColor }}
            >
              {data.trimp}
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              TRIMP
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{data.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Duration
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {Math.round(data.durationMin)} min
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Avg HR
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {data.avgHR ?? '—'} bpm
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            HR ratio
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {data.avgHR != null
              ? `${(((data.avgHR - data.restHRUsed) /
                  (data.maxHRUsed - data.restHRUsed)) *
                  100).toFixed(0)}%`
              : '—'}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 rounded-lg border p-3 text-xs"
        style={{
          borderColor: `${data.bandColor}40`,
          backgroundColor: `${data.bandColor}10`,
        }}
      >
        <Moon size={14} style={{ color: data.bandColor }} />
        <span className="text-gray-300">
          Approx. recovery needed:
        </span>
        <span
          className="ml-auto font-mono font-semibold"
          style={{ color: data.bandColor }}
        >
          <Clock size={11} className="mr-1 inline" />
          {data.recoveryHours}h
        </span>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        Banister (1991) TRIMP: D × HR_ratio × e^(1.92·HR_ratio).{' '}
        HR_ratio = (avgHR − {data.restHRUsed}) / ({data.maxHRUsed} −{' '}
        {data.restHRUsed}). Single-session number — full CTL/ATL trend
        needs a multi-activity view.
      </p>
    </div>
  );
}
