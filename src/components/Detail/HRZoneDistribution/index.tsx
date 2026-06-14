import { useMemo } from 'react';
import { Activity, Clock } from 'lucide-react';
import {
  calculateHRZoneDistribution,
  getZoneColor,
  getHRZoneLabel,
  secondsToTimeString,
  classifyWorkout,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
  maxHR?: number;
}

const ZONE_TARGETS: Record<
  number,
  { ideal: 'recovery' | 'easy' | 'long' | 'tempo' | 'threshold' | 'intervals' | 'race' | 'none'; comment: string }
> = {
  1: { ideal: 'recovery', comment: 'Pure recovery — should be rare in main runs.' },
  2: { ideal: 'easy', comment: 'Easy / long / MAF base mileage sweet spot.' },
  3: { ideal: 'tempo', comment: 'Aerobic-tempo midpoint. Useful for steady marathon-pace work.' },
  4: { ideal: 'threshold', comment: 'Tempo / threshold — controlled discomfort.' },
  5: { ideal: 'intervals', comment: 'VO2 max / intervals — short bursts only.' },
};

export default function HRZoneDistribution({ stream, maxHR = 180 }: Props) {
  const zones = useMemo(
    () => calculateHRZoneDistribution(stream, maxHR),
    [stream, maxHR],
  );
  const classification = useMemo(
    () => classifyWorkout(stream, maxHR),
    [stream, maxHR],
  );

  // If no HR data at all, all zones are zero.
  const hasHR = stream.heartrate && stream.heartrate.length > 0;
  if (!hasHR) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Activity className="text-rose-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">
            HR Zone Distribution
          </h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            No heart rate data in this activity.
          </p>
        </div>
      </div>
    );
  }

  // Find dominant zone (longest time)
  const dominantZone = useMemo(() => {
    let best = 1;
    let bestTime = 0;
    for (let z = 1; z <= 5; z++) {
      if ((zones[z]?.timeSeconds || 0) > bestTime) {
        bestTime = zones[z].timeSeconds;
        best = z;
      }
    }
    return best;
  }, [zones]);

  // Whether the dominant zone matches the classified workout type
  const zoneMatchesWorkout =
    ZONE_TARGETS[dominantZone]?.ideal === classification.type;

  return (
    <div className="bg-linear-to-b space-y-4 rounded-2xl border border-rose-500/40 from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="text-rose-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          HR Zone Distribution
        </h3>
        <span
          className="ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
          style={{
            color: getZoneColor(dominantZone),
            borderColor: `${getZoneColor(dominantZone)}66`,
            backgroundColor: `${getZoneColor(dominantZone)}22`,
          }}
        >
          {classification.label}
        </span>
      </div>

      {/* Stacked horizontal bar */}
      <div className="space-y-2">
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-700/60">
          {([1, 2, 3, 4, 5] as const).map((z) => {
            const pct = zones[z]?.percentage || 0;
            if (pct <= 0) return null;
            return (
              <div
                key={z}
                className="h-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: getZoneColor(z),
                }}
                title={`Z${z} (${getHRZoneLabel(z)}): ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
        {/* Legend rows */}
        <div className="space-y-1">
          {([1, 2, 3, 4, 5] as const).map((z) => {
            const data = zones[z];
            const isDominant = z === dominantZone;
            return (
              <div
                key={z}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                  isDominant
                    ? 'border border-gray-700/60 bg-gray-800/60'
                    : 'bg-transparent'
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: getZoneColor(z) }}
                />
                <span className="font-mono text-xs font-semibold text-gray-200">
                  Z{z}
                </span>
                <span className="text-xs text-gray-400">
                  {getHRZoneLabel(z)}
                </span>
                <div className="ml-auto flex items-center gap-2 text-[11px]">
                  <span className="font-mono text-gray-300">
                    {data.percentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">
                    <Clock size={9} className="mr-0.5 inline" />
                    {secondsToTimeString(data.timeSeconds)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coaching comment */}
      <div
        className="rounded-lg border p-3 text-[11px] leading-relaxed"
        style={{
          borderColor: `${classification.color}40`,
          backgroundColor: `${classification.color}10`,
        }}
      >
        <div className="mb-1 flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: classification.color }}
          />
          <span
            className="font-semibold tracking-wide uppercase"
            style={{ color: classification.color }}
          >
            {classification.label} · {Math.round(classification.confidence * 100)}% confidence
          </span>
        </div>
        <p className="text-gray-300">{classification.message}</p>
        {zoneMatchesWorkout && (
          <p className="mt-1.5 text-emerald-400">
            ✓ Dominant zone matches the classified workout type — pacing and HR are well-aligned.
          </p>
        )}
        {!zoneMatchesWorkout && classification.confidence >= 0.6 && (
          <p className="mt-1.5 text-amber-400">
            ⚠ HR is in {getHRZoneLabel(dominantZone)} (Z{dominantZone}) — that&apos;s
            not the typical zone for a {classification.label.toLowerCase()}.{' '}
            {ZONE_TARGETS[dominantZone]?.comment}
          </p>
        )}
      </div>
    </div>
  );
}
