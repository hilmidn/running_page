import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Target, TrendingUp } from 'lucide-react';
import {
  computeHRZoneTrend,
  secondsToTimeString,
  type HRZonePoint,
} from '@/utils/activityAnalytics';
import type { Activity as RunActivity, ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  activities: RunActivity[];
  streamMap: Map<number, ActivityStream | null>;
  maxHR?: number;
  weeksBack?: number;
  /** Target Z2 share for easy/base weeks (0-1). Default 0.70 (70%). */
  targetZ2Share?: number;
}

const ZONE_COLORS = [
  '#10b981', // Z1 Recovery
  '#3b82f6', // Z2 Endurance
  '#f59e0b', // Z3 Aerobic
  '#f97316', // Z4 Tempo
  '#ef4444', // Z5 VO2 Max
];

const ZONE_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];

export default function HRZoneTrend({
  activities,
  streamMap,
  maxHR = 180,
  weeksBack = 12,
  targetZ2Share = 0.7,
}: Props) {
  const data: HRZonePoint[] = useMemo(
    () => computeHRZoneTrend(activities, streamMap, maxHR, weeksBack),
    [activities, streamMap, maxHR, weeksBack],
  );

  if (data.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-rose-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Activity className="text-rose-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">
            HR Zone Distribution
          </h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center text-xs text-gray-500">
          No HR streams available in the last {weeksBack} weeks.
        </div>
      </div>
    );
  }

  // Aggregate overall share across the window
  const totals = [0, 0, 0, 0, 0];
  for (const p of data) {
    totals[0] += p.zone1Sec;
    totals[1] += p.zone2Sec;
    totals[2] += p.zone3Sec;
    totals[3] += p.zone4Sec;
    totals[4] += p.zone5Sec;
  }
  const grandTotal = totals.reduce((a, b) => a + b, 0);
  const shares = totals.map((s) => (grandTotal > 0 ? s / grandTotal : 0));
  const z2Share = shares[1];

  // Average pace-equivalent: time-weighted dominant zone
  const windowAvgHR = Math.round(
    data.reduce((s, p) => s + (p.avgHR || 0), 0) / data.length,
  );

  // Per-run data for the bar chart (date label, share per zone)
  const chartData = data.map((p) => ({
    runId: p.runId,
    name: p.name,
    date: p.date,
    dateLabel: new Date(p.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    distanceKm: p.distanceKm,
    Z1: p.zone1Pct,
    Z2: p.zone2Pct,
    Z3: p.zone3Pct,
    Z4: p.zone4Pct,
    Z5: p.zone5Pct,
  }));

  return (
    <div className="space-y-4 rounded-2xl border border-rose-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Activity className="text-rose-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          HR Zone Distribution
        </h3>
        <span className="rounded-full border border-rose-500/40 bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-rose-400 uppercase">
          {data.length} runs · maxHR {maxHR}
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          {ZONE_LABELS.map((z, i) => (
            <span key={z} className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: ZONE_COLORS[i] }}
              />
              {z}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
          <Target size={20} className="text-rose-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold leading-none text-rose-400">
              {(z2Share * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              in Z2 (endurance) — target {Math.round(targetZ2Share * 100)}%
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {z2Share >= targetZ2Share
              ? `On target — your easy-week prescription says ${Math.round(targetZ2Share * 100)}% Z2, and you hit ${(z2Share * 100).toFixed(0)}%.`
              : `Below target — easy-week prescription says ${Math.round(targetZ2Share * 100)}% Z2; you're at ${(z2Share * 100).toFixed(0)}%. ${(((targetZ2Share - z2Share) * 100)).toFixed(0)}% of running time is leaking into Z3+ (probably tempo efforts counted here).`}
          </p>
        </div>
      </div>

      {/* Stacked bar: one bar per run, stacked by zone share */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
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
              unit="%"
              domain={[0, 100]}
              width={36}
            />
            <Tooltip
              cursor={{ fill: '#1f2937' }}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#9ca3af' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-xs shadow-xl">
                    <div className="mb-1 font-semibold text-gray-200">
                      {new Date(d.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="mb-1 text-gray-400">{d.name}</div>
                    {ZONE_LABELS.map((z, i) => (
                      <div key={z} className="text-gray-300">
                        {z}:{' '}
                        <span
                          className="font-mono font-semibold"
                          style={{ color: ZONE_COLORS[i] }}
                        >
                          {d[z as keyof typeof d]?.toFixed(1) ?? '0'}%
                        </span>
                      </div>
                    ))}
                    <div className="mt-1 text-gray-300">
                      Distance:{' '}
                      <span className="font-mono text-gray-200">
                        {d.distanceKm.toFixed(2)} km
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <Bar
                key={ZONE_LABELS[i]}
                dataKey={ZONE_LABELS[i]}
                stackId="z"
                fill={ZONE_COLORS[i]}
                radius={
                  i === 4 ? [4, 4, 0, 0] : i === 0 ? [0, 0, 4, 4] : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Aggregate share table */}
      <div className="grid grid-cols-5 gap-1.5 text-xs">
        {ZONE_LABELS.map((z, i) => (
          <div
            key={z}
            className="rounded-lg border border-gray-700/60 bg-gray-800/40 p-2"
          >
            <div
              className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: ZONE_COLORS[i] }}
            >
              {z}
            </div>
            <div className="mt-1 font-mono text-base font-semibold text-gray-200">
              {(shares[i] * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-gray-500">
              {secondsToTimeString(totals[i])}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 text-[11px] text-gray-300">
        <TrendingUp size={12} className="mt-0.5 shrink-0 text-rose-400" />
        <div>
          Aggregate share is time-weighted across{' '}
          <span className="font-mono font-semibold text-gray-200">
            {data.length}
          </span>{' '}
          runs (avg HR {windowAvgHR} bpm). The 70% Z2 target is the
          MAF / base-building prescription — easy weeks should sit at
          or above it. Tempo, intervals, and race efforts will
          intentionally pull the share down.
        </div>
      </div>
    </div>
  );
}
