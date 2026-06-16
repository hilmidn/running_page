import { useMemo } from 'react';
import { Trophy, Target, Zap, ChevronRight } from 'lucide-react';
import {
  findPersonalBests,
  predictRaceTimes,
  formatPace,
  type PBCandidate,
  type RacePrediction,
} from '@/utils/activityAnalytics';
import type {
  Activity,
  ActivityStream,
} from '@/utils/activityAnalytics';

interface Props {
  activities: Activity[];
  streamMap: Map<number, ActivityStream | null>;
  weeksBack?: number;
  /** Highlight this distance in the hero card (e.g. 'Half Marathon') */
  focusLabel?: string;
}

function formatRaceTime(sec: number): string {
  if (sec <= 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Aggregate the best (lowest timeSec) PBCandidate per label across all
 * runs in the recency window. Falls back to activity summary distance
 * (with Riegel-style handicap) when no streams are available so the
 * predictor still has something to work with.
 */
function aggregatePBs(
  activities: Activity[],
  streamMap: Map<number, ActivityStream | null>,
  weeksBack: number,
): PBCandidate[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksBack * 7);
  const cutoffMs = cutoff.getTime();

  const runs = activities
    .filter((a) => a.type === 'Run' || a.type === 'running')
    .filter((a) => a.distance && a.distance >= 1000)
    .filter((a) => new Date(a.start_date_local).getTime() >= cutoffMs);

  const byLabel: Record<string, PBCandidate> = {};

  for (const a of runs) {
    const stream = streamMap.get(a.run_id);
    if (stream && stream.distance && stream.time) {
      const candidates = findPersonalBests(stream);
      for (const c of candidates) {
        if (!c.achievable || c.timeSec == null) continue;
        const prev = byLabel[c.label];
        if (!prev || (c.timeSec ?? Infinity) < (prev.timeSec ?? Infinity)) {
          byLabel[c.label] = { ...c };
        }
      }
    } else {
      // No stream — fall back to Riegel handicap from average pace
      const movingSec =
        typeof a.moving_time === 'number'
          ? a.moving_time
          : (() => {
              const parts = a.moving_time.split(':').map(Number);
              if (parts.length === 3) {
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
              }
              if (parts.length === 2) return parts[0] * 60 + parts[1];
              return 0;
            })();
      if (movingSec <= 0) continue;
      const distM = a.distance;
      const targets: { label: string; meters: number }[] = [
        { label: '1K', meters: 1000 },
        { label: '1 mile', meters: 1609.34 },
        { label: '5K', meters: 5000 },
        { label: '10K', meters: 10000 },
      ];
      for (const t of targets) {
        if (distM < t.meters) continue;
        const riegel = movingSec * Math.pow(t.meters / distM, 1.06);
        const candidate: PBCandidate = {
          label: t.label,
          distanceMeters: t.meters,
          timeSec: riegel,
          paceSecPerKm: riegel / (t.meters / 1000),
          startIdx: null,
          endIdx: null,
          achievable: true,
        };
        const prev = byLabel[t.label];
        if (!prev || (prev.timeSec ?? Infinity) > riegel) {
          byLabel[t.label] = candidate;
        }
      }
    }
  }

  return Object.values(byLabel);
}

export default function RaceTimePredictor({
  activities,
  streamMap,
  weeksBack = 26,
  focusLabel = 'Half Marathon',
}: Props) {
  const pbs: PBCandidate[] = useMemo(
    () => aggregatePBs(activities, streamMap, weeksBack),
    [activities, streamMap, weeksBack],
  );

  const predictions: RacePrediction[] = useMemo(
    () => predictRaceTimes(pbs),
    [pbs],
  );

  if (predictions.length === 0) return null;

  const focus = predictions.find((p) => p.label === focusLabel) ?? predictions[0];
  const fastest5K = predictions.find((p) => p.label === '5K');
  const longestAchieved = pbs.reduce(
    (a, b) =>
      (a.distanceMeters || 0) >= (b.distanceMeters || 0) ? a : b,
    pbs[0],
  );

  return (
    <div className="space-y-4 rounded-2xl border border-yellow-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Trophy className="text-yellow-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Race Time Predictor</h3>
        <span className="rounded-full border border-yellow-500/40 bg-yellow-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-yellow-400 uppercase">
          Riegel · {weeksBack}w window
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <Target size={11} className="text-yellow-400" />
          Anchor: {longestAchieved?.label ?? '—'}
        </div>
      </div>

      {/* Hero focus card */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
          <Trophy size={20} className="text-yellow-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Predicted {focus.label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold leading-none text-yellow-400">
              {formatRaceTime(focus.timeSec)}
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              @ {formatPace(focus.paceSecPerKm)}/km
            </span>
          </div>
        </div>
      </div>

      {/* HM/5K split row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-gray-800/40 p-3">
          <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            <Zap size={10} className="text-orange-400" /> 5K
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-orange-300">
            {fastest5K ? formatRaceTime(fastest5K.timeSec) : '—'}
          </div>
          <div className="text-[10px] text-gray-500">
            {fastest5K ? `${formatPace(fastest5K.paceSecPerKm)}/km` : '—'}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 p-3">
          <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            <Zap size={10} className="text-pink-400" /> Half Marathon
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-pink-300">
            {(() => {
              const hm = predictions.find(
                (p) => p.label === 'Half Marathon',
              );
              return hm ? formatRaceTime(hm.timeSec) : '—';
            })()}
          </div>
          <div className="text-[10px] text-gray-500">
            {(() => {
              const hm = predictions.find(
                (p) => p.label === 'Half Marathon',
              );
              return hm ? `${formatPace(hm.paceSecPerKm)}/km` : '—';
            })()}
          </div>
        </div>
      </div>

      {/* Full table */}
      <div className="overflow-hidden rounded-lg border border-gray-700/50">
        <table className="w-full text-xs">
          <thead className="bg-gray-800/60 text-[10px] tracking-wider text-gray-400 uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Distance</th>
              <th className="px-3 py-2 text-right font-semibold">Time</th>
              <th className="px-3 py-2 text-right font-semibold">Pace</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((p) => {
              const isFocus = p.label === focus.label;
              return (
                <tr
                  key={p.label}
                  className={`border-t border-gray-700/40 ${
                    isFocus ? 'bg-yellow-500/10' : 'hover:bg-gray-800/40'
                  }`}
                >
                  <td className="px-3 py-2 text-gray-200">
                    <div className="flex items-center gap-1.5">
                      {isFocus && (
                        <ChevronRight
                          size={11}
                          className="text-yellow-400"
                        />
                      )}
                      <span
                        className={
                          isFocus
                            ? 'font-semibold text-yellow-300'
                            : 'font-medium'
                        }
                      >
                        {p.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-gray-200">
                    {formatRaceTime(p.timeSec)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-400">
                    {formatPace(p.paceSecPerKm)}/km
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        Uses Riegel's formula (T₂ = T₁ × (D₂/D₁)^1.06) projected from the
        longest achievable PR in the {weeksBack}-week window. Predictions
        are conservative — actual race fitness is usually a bit better with
        proper taper and pacing.
      </p>
    </div>
  );
}
