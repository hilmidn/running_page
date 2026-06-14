import { useMemo } from 'react';
import { Trophy, Flag, Sparkles } from 'lucide-react';
import {
  findPersonalBests,
  predictRaceTimes,
  secondsToTimeString,
  formatPace,
  type PBCandidate,
  type RacePrediction,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
}

function predictionConfidenceLabel(distanceMeters: number): {
  level: 'high' | 'medium' | 'low';
  color: string;
  text: string;
} {
  if (distanceMeters <= 5000) {
    return { level: 'high', color: '#10b981', text: 'High confidence' };
  }
  if (distanceMeters <= 10000) {
    return { level: 'medium', color: '#3b82f6', text: 'Medium' };
  }
  return { level: 'low', color: '#f59e0b', text: 'Low — extrapolation' };
}

export default function PerformanceEstimates({ stream }: Props) {
  const pbs: PBCandidate[] = useMemo(() => findPersonalBests(stream), [stream]);
  const predictions: RacePrediction[] = useMemo(
    () => predictRaceTimes(pbs),
    [pbs],
  );

  const hasAnyPB = pbs.some((p) => p.achievable);
  const hasPredictions = predictions.length > 0;

  if (!hasAnyPB && !hasPredictions) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">Performance</h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            Not enough data to estimate personal bests in this run.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-b space-y-4 rounded-2xl border border-amber-500/40 from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="text-amber-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Performance</h3>
        <span className="ml-auto rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-400 uppercase">
          PRs · Predictions
        </span>
      </div>

      {/* Fastest efforts inside this run */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
          <Flag size={12} />
          <span>Fastest efforts in this run</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {pbs.map((pb) =>
            pb.achievable && pb.timeSec != null ? (
              <div
                key={pb.label}
                className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-3"
              >
                <div className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
                  {pb.label}
                </div>
                <div className="mt-1 font-mono text-lg font-semibold text-gray-200">
                  {secondsToTimeString(pb.timeSec)}
                </div>
                <div className="mt-0.5 text-[10px] text-gray-500">
                  {pb.paceSecPerKm != null
                    ? `${formatPace(pb.paceSecPerKm)}/km`
                    : ''}
                </div>
              </div>
            ) : (
              <div
                key={pb.label}
                className="rounded-xl border border-gray-700/40 bg-gray-800/20 p-3 opacity-50"
              >
                <div className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                  {pb.label}
                </div>
                <div className="mt-1 font-mono text-lg text-gray-500">—</div>
                <div className="mt-0.5 text-[10px] text-gray-600">
                  Too short
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Riegel predictions */}
      {hasPredictions && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
            <Sparkles size={12} />
            <span>Predicted race times (Riegel T₂ = T₁ × (D₂/D₁)^1.06)</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-700/60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700/60 bg-gray-800/60 text-[10px] tracking-wider text-gray-400 uppercase">
                  <th className="px-3 py-2 text-left font-semibold">Distance</th>
                  <th className="px-3 py-2 text-right font-semibold">Time</th>
                  <th className="px-3 py-2 text-right font-semibold">Pace</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => {
                  const conf = predictionConfidenceLabel(p.distanceMeters);
                  return (
                    <tr
                      key={p.label}
                      className="border-b border-gray-800/40 last:border-b-0"
                    >
                      <td className="px-3 py-2 text-gray-200">{p.label}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-gray-100">
                        {secondsToTimeString(p.timeSec)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-300">
                        {formatPace(p.paceSecPerKm)}/km
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            color: conf.color,
                            backgroundColor: `${conf.color}22`,
                          }}
                        >
                          {conf.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-gray-500">
        Riegel's 1977 formula assumes a smooth endurance curve. Predictions
        beyond the run's length are extrapolations — confidence drops with
        distance. Treat them as ceiling estimates, not race plans.
      </p>
    </div>
  );
}
