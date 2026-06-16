import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { Heart, Activity, TrendingUp } from 'lucide-react';
import type { ActivityStream } from '@/utils/activityAnalytics';
import type { Activity as RunActivity } from '@/utils/activityAnalytics';
import {
  computeTrainingBalance,
  type TrainingBalancePoint,
} from '@/utils/activityAnalytics';

interface Props {
  activities: RunActivity[];
  streamMap: Map<number, ActivityStream | null>;
  maxHR?: number;
  weeksBack?: number;
  targetZ2Percent?: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload as TrainingBalancePoint;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-gray-200">{d.weekLabel}</div>
      <div className="flex items-center gap-1.5 text-gray-300">
        <span className="h-2 w-2 rounded-full bg-[#10b981]" />
        Z2:{' '}
        <span className="font-mono font-semibold text-emerald-400">
          {d.z2Minutes} min
        </span>
        <span className="text-gray-500">
          ({d.z2Percent.toFixed(0)}%)
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-300">
        <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
        Z3+:{' '}
        <span className="font-mono font-semibold text-red-400">
          {d.z3PlusMinutes} min
        </span>
      </div>
      <div className="border-t border-gray-700/60 pt-1 text-gray-300">
        Total{' '}
        <span className="font-mono text-gray-200">
          {d.totalMinutes} min · {d.totalKm.toFixed(1)} km
        </span>
        <span className="ml-1 text-gray-500">
          · {d.runCount} run{d.runCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

export default function TrainingBalance({
  activities,
  streamMap,
  maxHR = 180,
  weeksBack = 12,
  targetZ2Percent = 70,
}: Props) {
  const data: TrainingBalancePoint[] = useMemo(
    () => computeTrainingBalance(activities, streamMap, maxHR, weeksBack),
    [activities, streamMap, maxHR, weeksBack],
  );

  if (data.length === 0) return null;

  const chartData = data.map((w) => ({
    ...w,
    z2Label: 'Z2 Aerobic',
    z3plusLabel: 'Z3+ Threshold',
  }));

  const totalZ2Min = data.reduce((s, w) => s + w.z2Minutes, 0);
  const totalZ3Min = data.reduce((s, w) => s + w.z3PlusMinutes, 0);
  const totalMin = totalZ2Min + totalZ3Min;
  const overallZ2Pct = totalMin > 0 ? (totalZ2Min / totalMin) * 100 : 0;
  const latestWeek = data.findLast((w) => w.totalMinutes > 0);
  const bestZ2Week = data.reduce(
    (best, w) => (w.z2Percent > best.z2Percent ? w : best),
    data[0],
  );

  // Count how many weeks hit the Z2 target
  const onTargetWeeks = data.filter((w) => w.z2Percent >= targetZ2Percent).length;
  const totalWeeksWithData = data.filter((w) => w.totalMinutes > 0).length;

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Heart className="text-emerald-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          Training Balance
        </h3>
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-400 uppercase">
          Z2 vs Z3+
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          Z2 Aerobic
          <span className="ml-2 h-2 w-2 rounded-full bg-[#ef4444]" />
          Z3+ Threshold
        </div>
      </div>

      {/* Key stat block */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <TrendingUp size={20} className="text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold leading-none text-emerald-400">
              {overallZ2Pct.toFixed(0)}%
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              Z2 in window
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {onTargetWeeks}/{totalWeeksWithData} weeks ≥ {targetZ2Percent}% Z2
            {' · '}
            {totalZ2Min} min aerobic · {totalZ3Min} min threshold
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            stackOffset="expand"
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
              minTickGap={16}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              width={32}
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
            <Legend
              wrapperStyle={{ fontSize: 10, color: '#9ca3af' }}
              iconType="circle"
            />
            <Bar
              dataKey="z2Label"
              stackId="balance"
              fill="#10b981"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="z3plusLabel"
              stackId="balance"
              fill="#ef4444"
              radius={[0, 0, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Latest Z2 %
          </div>
          <div
            className="mt-1 font-mono font-semibold"
            style={{
              color:
                latestWeek && latestWeek.z2Percent >= targetZ2Percent
                  ? '#10b981'
                  : '#f59e0b',
            }}
          >
            {latestWeek ? `${latestWeek.z2Percent.toFixed(0)}%` : '—'}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Best Z2 week
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {bestZ2Week.z2Percent.toFixed(0)}%
          </div>
          <div className="text-[10px] text-gray-500">{bestZ2Week.weekLabel}</div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            On target
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {onTargetWeeks}/{totalWeeksWithData}
          </div>
          <div className="text-[10px] text-gray-500">weeks ≥ {targetZ2Percent}%</div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Weekly Z2 km
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {latestWeek ? latestWeek.z2Km.toFixed(1) : '—'}
          </div>
          <div className="text-[10px] text-gray-500">
            of {latestWeek ? latestWeek.totalKm.toFixed(1) : '—'} km
          </div>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        Z2 = 60-76% of maxHR ({maxHR} bpm max = {Math.round(maxHR * 0.6)}–{Math.round(maxHR * 0.76)} bpm).
        MAF training recommends ≥{targetZ2Percent}% of weekly volume in Z2.
        Bars are stacked to 100% — use the tooltip for absolute minutes.
      </p>
    </div>
  );
}
