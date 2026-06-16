import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
} from 'recharts';
import { HeartPulse, TrendingDown, CheckCircle2, Activity as RunIcon } from 'lucide-react';
import {
  computeDecouplingTrend,
  formatPace,
  type DecouplingPoint,
} from '@/utils/activityAnalytics';
import type {
  Activity,
  ActivityStream,
} from '@/utils/activityAnalytics';

interface Props {
  activities: Activity[];
  streamMap: Map<number, ActivityStream | null>;
  weeksBack?: number;
  minDurationMin?: number;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload as DecouplingPoint;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-gray-200">{d.name}</div>
      <div className="text-[10px] text-gray-500">
        {dateLabel(d.date)} · {d.distanceKm.toFixed(1)} km ·{' '}
        {Math.round(d.durationMin)} min
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-3 text-gray-300">
        <span className="text-[10px] tracking-wider text-gray-500 uppercase">1st half</span>
        <span className="text-[10px] tracking-wider text-gray-500 uppercase">2nd half</span>
        <span className="font-mono">
          {formatPace(d.paceFirst)}/km
        </span>
        <span className="font-mono">
          {formatPace(d.paceSecond)}/km
        </span>
        <span className="font-mono">
          {d.hrFirst.toFixed(0)} bpm
        </span>
        <span className="font-mono">
          {d.hrSecond.toFixed(0)} bpm
        </span>
      </div>
      <div className="mt-1.5 border-t border-gray-700/60 pt-1.5">
        <span className="text-gray-300">Decoupling: </span>
        <span
          className="font-mono font-semibold"
          style={{
            color:
              d.decouplingPct < 5
                ? '#10b981'
                : d.decouplingPct < 10
                  ? '#f59e0b'
                  : '#ef4444',
          }}
        >
          {d.decouplingPct > 0 ? '+' : ''}
          {d.decouplingPct.toFixed(1)}%
        </span>
        {d.quality === 'good' && (
          <span className="ml-1.5 text-[10px] font-semibold text-emerald-400">
            ✓ MAF target
          </span>
        )}
      </div>
    </div>
  );
}

function colorForPct(p: number): string {
  if (p < 5) return '#10b981';
  if (p < 10) return '#f59e0b';
  return '#ef4444';
}

export default function DecouplingTrend({
  activities,
  streamMap,
  weeksBack = 12,
  minDurationMin = 30,
}: Props) {
  const data: DecouplingPoint[] = useMemo(
    () => computeDecouplingTrend(activities, streamMap, weeksBack, undefined, minDurationMin),
    [activities, streamMap, weeksBack, minDurationMin],
  );

  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: dateLabel(d.date),
  }));

  // Trend: 4-week moving average of decoupling
  const trendData: { date: string; avg: number | null }[] = [];
  for (let i = 0; i < chartData.length; i++) {
    const window = chartData.slice(Math.max(0, i - 3), i + 1);
    const sum = window.reduce((s, d) => s + d.decouplingPct, 0);
    trendData.push({
      date: chartData[i].date,
      avg: sum / window.length,
    });
  }

  // Map trend to chartData points
  const chartWithTrend = chartData.map((d, i) => ({
    ...d,
    trendAvg: trendData[i]?.avg ?? null,
  }));

  const goodCount = data.filter((d) => d.quality === 'good').length;
  const driftCount = data.filter((d) => d.quality === 'drift').length;
  const avgDecoupling =
    data.reduce((s, d) => s + d.decouplingPct, 0) / data.length;
  const recentAvg =
    data.slice(-5).reduce((s, d) => s + d.decouplingPct, 0) /
    Math.max(data.slice(-5).length, 1);
  const firstDecoupling = data[0]?.decouplingPct ?? 0;
  const lastDecoupling = data[data.length - 1]?.decouplingPct ?? 0;
  const trend =
    lastDecoupling - firstDecoupling < -1
      ? 'improving'
      : lastDecoupling - firstDecoupling > 1
        ? 'regressing'
        : 'stable';

  return (
    <div className="space-y-4 rounded-2xl border border-rose-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <HeartPulse className="text-rose-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Cardiac Decoupling</h3>
        <span className="rounded-full border border-rose-500/40 bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-rose-400 uppercase">
          MAF progress
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          &lt;5% good
          <span className="ml-2 h-2 w-2 rounded-full bg-[#f59e0b]" />
          5-10% mild
          <span className="ml-2 h-2 w-2 rounded-full bg-[#ef4444]" />
          &gt;10% drift
        </div>
      </div>

      {/* Hero stat */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
          {trend === 'improving' ? (
            <TrendingDown size={20} className="text-emerald-400" />
          ) : (
            <RunIcon size={20} className="text-rose-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-3xl font-bold leading-none"
              style={{ color: colorForPct(avgDecoupling) }}
            >
              {avgDecoupling > 0 ? '+' : ''}
              {avgDecoupling.toFixed(1)}%
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              avg over {data.length} runs
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {goodCount}/{data.length} runs &lt; 5% decoupling
            {' · '}
            {trend === 'improving' && (
              <span className="text-emerald-400">
                ↓ aerobic base improving
              </span>
            )}
            {trend === 'stable' && (
              <span className="text-yellow-400">→ holding steady</span>
            )}
            {trend === 'regressing' && (
              <span className="text-orange-400">↑ drift increasing</span>
            )}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartWithTrend}
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
              tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}%`}
              width={40}
            />
            <ReferenceLine
              y={5}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'MAF target',
                fill: '#10b981',
                fontSize: 9,
                position: 'insideTopRight',
              }}
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
              content={<CustomTooltip />}
            />
            <Bar dataKey="decouplingPct" radius={[4, 4, 0, 0]}>
              {chartWithTrend.map((d) => (
                <Cell
                  key={d.runId}
                  fill={colorForPct(d.decouplingPct)}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="trendAvg"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Good runs
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono font-semibold text-emerald-400">
              {goodCount}
            </span>
            <span className="text-[10px] text-gray-500">
              / {data.length}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Drift runs
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className="font-mono font-semibold"
              style={{
                color: driftCount > 0 ? '#ef4444' : '#9ca3af',
              }}
            >
              {driftCount}
            </span>
            <span className="text-[10px] text-gray-500">
              / {data.length}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Recent (5)
          </div>
          <div
            className="mt-1 font-mono font-semibold"
            style={{ color: colorForPct(recentAvg) }}
          >
            {recentAvg > 0 ? '+' : ''}
            {recentAvg.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Window Δ
          </div>
          <div
            className="mt-1 font-mono font-semibold"
            style={{
              color:
                lastDecoupling - firstDecoupling < 0
                  ? '#10b981'
                  : '#f59e0b',
            }}
          >
            {lastDecoupling - firstDecoupling > 0 ? '+' : ''}
            {(lastDecoupling - firstDecoupling).toFixed(1)}%
          </div>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        Decoupling = 1 − (pace₂·HR₁) / (pace₁·HR₂) between first and second
        half of each run. MAF goal: &lt;5% on long runs. As aerobic base
        improves, decoupling decreases — pace and HR stay coupled.
        Gold line = 4-run moving average trend.
      </p>
    </div>
  );
}
