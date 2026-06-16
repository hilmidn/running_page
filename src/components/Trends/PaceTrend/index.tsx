import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Gauge, TrendingDown, Target } from 'lucide-react';
import {
  computePaceTrend,
  formatPace,
  type PaceTrendPoint,
} from '@/utils/activityAnalytics';
import type { Activity } from '@/utils/activityAnalytics';

interface Props {
  activities: Activity[];
  weeksBack?: number;
  /** Target pace sec/km (e.g. for MAF / Z2 upper bound) */
  targetPaceSecKm?: number;
}

/**
 * Color a pace bar relative to a target. Green = faster than target,
 * yellow = close (±3%), red = slower.
 */
function paceColor(pace: number, target: number): string {
  if (pace === 0) return '#374151';
  const ratio = pace / target;
  if (ratio <= 0.95) return '#10b981'; // >=5% faster
  if (ratio <= 1.0) return '#3b82f6'; // within target
  if (ratio <= 1.05) return '#f59e0b'; // slightly slower
  return '#ef4444'; // >5% slower
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload as PaceTrendPoint;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-gray-200">{d.weekLabel}</div>
      <div className="text-gray-300">
        Avg pace:{' '}
        <span className="font-mono font-semibold text-amber-400">
          {formatPace(d.avgPaceSecKm)}
        </span>
      </div>
      {d.medianPaceSecKm > 0 && (
        <div className="text-gray-300">
          Median:{' '}
          <span className="font-mono text-gray-200">
            {formatPace(d.medianPaceSecKm)}
          </span>
        </div>
      )}
      {d.bestPaceSecKm > 0 && (
        <div className="text-gray-300">
          Best run:{' '}
          <span className="font-mono text-gray-200">
            {formatPace(d.bestPaceSecKm)}
          </span>
        </div>
      )}
      <div className="text-gray-300">
        Distance:{' '}
        <span className="font-mono font-semibold text-gray-200">
          {d.totalDistanceKm.toFixed(1)} km
        </span>
        <span className="ml-1 text-gray-500">
          · {d.runCount} run{d.runCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

export default function PaceTrend({
  activities,
  weeksBack = 12,
  targetPaceSecKm,
}: Props) {
  const data: PaceTrendPoint[] = useMemo(
    () => computePaceTrend(activities, weeksBack),
    [activities, weeksBack],
  );

  if (data.length === 0) return null;

  // Infer target from the slowest week (easy runs) if not provided
  const effectiveTarget =
    targetPaceSecKm ??
    data.reduce(
      (fastest, w) =>
        w.avgPaceSecKm > 0 && w.avgPaceSecKm < fastest
          ? w.avgPaceSecKm
          : fastest,
      Infinity,
    );

  const latest = data.findLast((w) => w.avgPaceSecKm > 0);
  const first = data.find((w) => w.avgPaceSecKm > 0);
  const best = data.reduce(
    (b, w) => (w.avgPaceSecKm > 0 && w.avgPaceSecKm < b.avgPaceSecKm ? w : b),
    data[0],
  );

  const delta = latest && first ? latest.avgPaceSecKm - first.avgPaceSecKm : 0;
  const paceTargetKm = targetPaceSecKm ? formatPace(targetPaceSecKm) : null;
  // Pace to km/h for display
  const avgKmh = latest
    ? (3600 / latest.avgPaceSecKm).toFixed(1)
    : '—';

  return (
    <div className="space-y-4 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Gauge className="text-amber-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Pace Trend</h3>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-400 uppercase">
          {data.length} weeks
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          fast
          <span className="ml-2 h-2 w-2 rounded-full bg-[#3b82f6]" />
          on target
          <span className="ml-2 h-2 w-2 rounded-full bg-[#f59e0b]" />
          slightly slow
        </div>
      </div>

      {/* Key stat block */}
      {latest && (
        <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <Target size={20} className="text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold leading-none text-amber-400">
                {formatPace(latest.avgPaceSecKm)}
              </span>
              <span className="text-[10px] tracking-wider text-gray-500 uppercase">
                /km avg · {avgKmh} km/h
              </span>
            </div>
            {paceTargetKm && (
              <p className="mt-1.5 text-xs text-gray-400">
                Target: <span className="font-mono text-gray-300">{paceTargetKm}/km</span>
                {' · '}
                <span
                  className={
                    latest.avgPaceSecKm <= targetPaceSecKm!
                      ? 'text-emerald-400'
                      : 'text-orange-400'
                  }
                >
                  {latest.avgPaceSecKm <= targetPaceSecKm!
                    ? 'on pace ✓'
                    : `+${formatPace(latest.avgPaceSecKm - targetPaceSecKm!)} behind`}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            <XAxis
              dataKey="weekLabel"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatPace(v)}
              domain={['dataMin - 8', 'dataMax + 8']}
              width={52}
              reversed // lower = faster, make it intuitive
            />
            {targetPaceSecKm && (
              <ReferenceLine
                y={targetPaceSecKm}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'target',
                  fill: '#f59e0b',
                  fontSize: 9,
                  position: 'insideTopRight',
                }}
              />
            )}
            <Tooltip
              cursor={{ fill: '#1f2937' }}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#9ca3af' }}
              content={<CustomTooltip />}
            />
            <Bar dataKey="avgPaceSecKm" radius={[4, 4, 0, 0]}>
              {data.map((w) => (
                <Cell
                  key={w.weekStart}
                  fill={paceColor(w.avgPaceSecKm, effectiveTarget)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Latest
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {latest ? formatPace(latest.avgPaceSecKm) : '—'}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Best week
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {formatPace(best.avgPaceSecKm)}
          </div>
          <div className="text-[10px] text-gray-500">{best.weekLabel}</div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Window Δ
          </div>
          <div
            className="mt-1 font-mono font-semibold"
            style={{ color: delta <= 0 ? '#10b981' : '#f59e0b' }}
          >
            {delta <= 0 ? '' : '+'}
            {formatPace(Math.abs(delta))}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Speed avg
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {avgKmh} km/h
          </div>
        </div>
      </div>
    </div>
  );
}
