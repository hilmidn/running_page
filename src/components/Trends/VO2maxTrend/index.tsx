import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Gauge, TrendingUp, Trophy } from 'lucide-react';
import {
  computeVO2maxTrend,
  type VO2maxPoint,
} from '@/utils/activityAnalytics';
import type { Activity, ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  activities: Activity[];
  streamMap: Map<number, ActivityStream | null>;
  weeksBack?: number;
}

export default function VO2maxTrend({
  activities,
  streamMap,
  weeksBack = 12,
}: Props) {
  const data: VO2maxPoint[] = useMemo(
    () => computeVO2maxTrend(activities, streamMap, weeksBack),
    [activities, streamMap, weeksBack],
  );

  if (data.length === 0) {
    return null;
  }

  const peak = data.reduce(
    (best, p) => (p.vo2max > best.vo2max ? p : best),
    data[0],
  );
  const latest = data[data.length - 1];
  const first = data[0];
  const delta = latest.vo2max - first.vo2max;
  const deltaPct = (delta / first.vo2max) * 100;
  const best5 = [...data]
    .sort((a, b) => b.vo2max - a.vo2max)
    .slice(0, 5);

  return (
    <div className="space-y-4 rounded-2xl border border-fuchsia-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Gauge className="text-fuchsia-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          VO2max Trend
        </h3>
        <span className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-fuchsia-400 uppercase">
          {data.length} runs
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
          avg method
          <span className="ml-2 h-2 w-2 rounded-full bg-[#10b981]" />
          peak method
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20">
          <Trophy size={20} className="text-fuchsia-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold leading-none text-fuchsia-400">
              {peak.vo2max.toFixed(1)}
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              mL/kg/min peak ({peak.grade})
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            Best in window: {peak.paceAtVO2maxFormatted}/km on{' '}
            {new Date(peak.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            .
          </p>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(t) =>
                new Date(t).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              minTickGap={32}
            />
            <YAxis
              dataKey="vo2max"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 2', 'dataMax + 2']}
              width={40}
            />
            <ZAxis range={[40, 80]} />
            <Tooltip
              cursor={{ stroke: '#6b7280', strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#9ca3af' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const d = payload[0].payload as VO2maxPoint & { ts: number };
                return (
                  <div className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-xs shadow-xl">
                    <div className="mb-1 font-semibold text-gray-200">
                      {new Date(d.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-gray-300">
                      VO2max:{' '}
                      <span className="font-mono font-semibold text-fuchsia-400">
                        {d.vo2max.toFixed(1)} · {d.grade}
                      </span>
                    </div>
                    <div className="text-gray-300">
                      Pace:{' '}
                      <span className="font-mono font-semibold text-gray-200">
                        {d.paceAtVO2maxFormatted}/km
                      </span>
                    </div>
                    <div className="text-gray-300">
                      Method:{' '}
                      <span className="font-mono text-gray-200">
                        {d.method}
                      </span>
                    </div>
                    <div className="text-gray-300">
                      Distance:{' '}
                      <span className="font-mono text-gray-200">
                        {d.distanceKm.toFixed(2)} km
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={data.map((p) => ({ ...p, ts: new Date(p.date).getTime() }))}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const fill = payload.method === 'peak' ? '#10b981' : '#3b82f6';
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={fill}
                    fillOpacity={0.85}
                    stroke="#fff"
                    strokeWidth={0.5}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Latest
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {latest.vo2max.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500">
            {latest.paceAtVO2maxFormatted}/km · {latest.grade}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Window Δ
          </div>
          <div
            className="mt-1 font-mono font-semibold"
            style={{ color: delta >= 0 ? '#10b981' : '#f59e0b' }}
          >
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)} ({deltaPct >= 0 ? '+' : ''}
            {deltaPct.toFixed(1)}%)
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Median
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {(
              data.map((p) => p.vo2max).sort((a, b) => a - b)[
                Math.floor(data.length / 2)
              ]
            ).toFixed(1)}
          </div>
        </div>
      </div>

      {best5.length > 1 && (
        <div className="rounded-lg border border-gray-700/60 bg-gray-800/40 p-3">
          <div className="mb-2 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Top 5 efforts
          </div>
          <div className="space-y-1">
            {best5.map((p, i) => (
              <div
                key={p.runId}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor:
                      i === 0 ? '#f59e0b' : '#374151',
                    color: i === 0 ? '#000' : '#9ca3af',
                  }}
                >
                  {i + 1}
                </span>
                <span className="font-mono text-fuchsia-400">
                  {p.vo2max.toFixed(1)}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-300">
                  {p.paceAtVO2maxFormatted}/km
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500">
                  {new Date(p.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-gray-500">
        Daniels/Gilbert formula: VO2 = -4.6 + 0.182·v + 0.0001·v² (v in
        m/min).{' '}
        <span className="text-emerald-400">Peak</span> = best sustained
        5-min velocity from the distance/time stream.{' '}
        <span className="text-blue-400">Avg</span> = activity's average
        speed fallback. Easy runs systematically underestimate true
        VO2max — see individual activity cards for effort context.
      </p>
    </div>
  );
}
