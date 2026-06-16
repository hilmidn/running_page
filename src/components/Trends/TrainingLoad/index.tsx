import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { Activity as RunIcon, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import type { Activity as RunActivity, ActivityStream } from '@/utils/activityAnalytics';
import {
  computeTrainingLoad,
  type DailyLoadPoint,
} from '@/utils/activityAnalytics';

interface Props {
  activities: RunActivity[];
  streamMap: Map<number, ActivityStream | null>;
  maxHR: number;
  weeksBack?: number;
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
  const d = payload[0].payload as DailyLoadPoint;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-gray-200">{dateLabel(d.date)}</div>
      <div className="space-y-0.5 text-gray-300">
        <div>
          TSS today:{' '}
          <span className="font-mono font-semibold text-cyan-300">
            {d.tss.toFixed(1)}
          </span>
        </div>
        <div>
          CTL (42d):{' '}
          <span className="font-mono text-blue-300">
            {d.ctl.toFixed(1)}
          </span>
        </div>
        <div>
          ATL (7d):{' '}
          <span className="font-mono text-orange-300">
            {d.atl.toFixed(1)}
          </span>
        </div>
        <div>
          TSB:{' '}
          <span
            className="font-mono font-semibold"
            style={{
              color:
                d.tsb > 5
                  ? '#10b981'
                  : d.tsb < -10
                    ? '#ef4444'
                    : '#fbbf24',
            }}
          >
            {d.tsb > 0 ? '+' : ''}
            {d.tsb.toFixed(1)}
          </span>
        </div>
      </div>
      {d.distanceKm > 0 && (
        <div className="mt-1.5 border-t border-gray-700/60 pt-1 text-[10px] text-gray-500">
          {d.distanceKm.toFixed(1)} km · {d.durationMin} min
        </div>
      )}
    </div>
  );
}

function formLabel(tsb: number): {
  label: string;
  color: string;
  advice: string;
} {
  if (tsb > 25) {
    return {
      label: 'Detrained',
      color: '#9ca3af',
      advice: 'Time to load up',
    };
  }
  if (tsb > 5) {
    return {
      label: 'Fresh',
      color: '#10b981',
      advice: 'Race-ready window',
    };
  }
  if (tsb > -10) {
    return {
      label: 'Optimal',
      color: '#3b82f6',
      advice: 'Productive training',
    };
  }
  if (tsb > -30) {
    return {
      label: 'Fatigued',
      color: '#f59e0b',
      advice: 'Recovery recommended',
    };
  }
  return {
    label: 'Overreached',
    color: '#ef4444',
    advice: 'Pull back hard',
  };
}

export default function TrainingLoad({
  activities,
  streamMap,
  maxHR,
  weeksBack = 16,
}: Props) {
  const result = useMemo(
    () => computeTrainingLoad(activities, streamMap, maxHR, weeksBack),
    [activities, streamMap, maxHR, weeksBack],
  );

  if (result.daily.length === 0) return null;

  const chartData = result.daily.map((d) => ({
    ...d,
    dateLabel: dateLabel(d.date),
  }));

  const ctl7days = result.daily.slice(-7);
  const ctlStart = ctl7days[0]?.ctl ?? 0;
  const ctlEnd = ctl7days[ctl7days.length - 1]?.ctl ?? 0;
  const ctlTrend = ctlEnd - ctlStart;
  const trendDirection =
    ctlTrend > 2 ? 'up' : ctlTrend < -2 ? 'down' : 'flat';

  const form = formLabel(result.currentTSB);

  return (
    <div className="space-y-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Zap className="text-cyan-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Training Load</h3>
        <span className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-cyan-400 uppercase">
          CTL · ATL · TSB
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
          CTL fitness
          <span className="ml-2 h-2 w-2 rounded-full bg-[#f59e0b]" />
          ATL fatigue
        </div>
      </div>

      {/* Hero form card */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-800/60 p-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${form.color}30` }}
        >
          <span
            className="font-mono text-base font-bold"
            style={{ color: form.color }}
          >
            {result.currentTSB > 0 ? '+' : ''}
            {result.currentTSB.toFixed(0)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="text-lg font-bold leading-none"
              style={{ color: form.color }}
            >
              {form.label}
            </span>
            <span className="text-[10px] tracking-wider text-gray-500 uppercase">
              TSB form
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{form.advice}</p>
        </div>
      </div>

      {/* 3-col summary */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-gray-800/40 p-2.5">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            CTL · Fitness
          </div>
          <div className="mt-0.5 font-mono text-base font-bold text-blue-300">
            {result.currentCTL.toFixed(0)}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            {trendDirection === 'up' && (
              <TrendingUp size={9} className="text-emerald-400" />
            )}
            {trendDirection === 'down' && (
              <TrendingDown size={9} className="text-orange-400" />
            )}
            {trendDirection === 'flat' && <span className="text-gray-500">→</span>}
            <span>
              {trendDirection === 'up' ? '+' : ''}
              {ctlTrend.toFixed(1)}/7d
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 p-2.5">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            ATL · Fatigue
          </div>
          <div className="mt-0.5 font-mono text-base font-bold text-orange-300">
            {result.currentATL.toFixed(0)}
          </div>
          <div className="text-[10px] text-gray-500">7-day</div>
        </div>
        <div className="rounded-lg bg-gray-800/40 p-2.5">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            TSB · Form
          </div>
          <div
            className="mt-0.5 font-mono text-base font-bold"
            style={{ color: form.color }}
          >
            {result.currentTSB > 0 ? '+' : ''}
            {result.currentTSB.toFixed(0)}
          </div>
          <div className="text-[10px] text-gray-500">CTL − ATL</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="ctlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              minTickGap={32}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
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
            <Area
              type="monotone"
              dataKey="ctl"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#ctlGrad)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="atl"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="tsb"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 7d/28d summary */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            7d TSS
          </div>
          <div className="mt-1 font-mono font-semibold text-cyan-300">
            {result.tss7Day.toFixed(0)}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            28d TSS
          </div>
          <div className="mt-1 font-mono font-semibold text-cyan-300">
            {result.tss28Day.toFixed(0)}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            AC ratio
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {result.currentCTL > 0
              ? (result.currentATL / result.currentCTL).toFixed(2)
              : '—'}
          </div>
          <div className="text-[10px] text-gray-500">ATL/CTL</div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Ramp rate
          </div>
          <div
            className="mt-1 font-mono font-semibold"
            style={{
              color:
                ctlTrend > 5
                  ? '#f59e0b'
                  : ctlTrend < -2
                    ? '#3b82f6'
                    : '#10b981',
            }}
          >
            {ctlTrend > 0 ? '+' : ''}
            {ctlTrend.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500">TSS/wk</div>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        CTL (fitness) = 42-day exponentially weighted TSS. ATL (fatigue) = 7-day
        EWMA. TSB = CTL − ATL: positive = fresh, negative = fatigued. Ramp
        rate &gt; 7 TSS/wk is a high-injury-risk threshold — keep it gradual.
      </p>
    </div>
  );
}
