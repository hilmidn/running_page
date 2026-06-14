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
import { TrendingUp, Map } from 'lucide-react';
import {
  computeWeeklyVolume,
  secondsToTimeString,
  type WeeklyVolumePoint,
} from '@/utils/activityAnalytics';
import type { Activity } from '@/utils/activityAnalytics';

interface Props {
  activities: Activity[];
  weeksBack?: number;
  targetWeeklyKm?: number;
}

function colorForKm(km: number, target: number): string {
  if (km === 0) return '#374151'; // gray-700 — rest week / no data
  const ratio = km / target;
  if (ratio >= 0.9) return '#10b981'; // green — met or exceeded target
  if (ratio >= 0.6) return '#3b82f6'; // blue — within 60-90% of target
  if (ratio >= 0.3) return '#f59e0b'; // amber — light week (recovery?)
  return '#ef4444'; // red — very light (or could be just starting)
}

export default function VolumeProgression({
  activities,
  weeksBack = 12,
  targetWeeklyKm = 30,
}: Props) {
  const data: WeeklyVolumePoint[] = useMemo(
    () => computeWeeklyVolume(activities, weeksBack),
    [activities, weeksBack],
  );

  if (data.length === 0) {
    return null;
  }

  const totalKm = data.reduce((s, w) => s + w.distanceKm, 0);
  const totalRuns = data.reduce((s, w) => s + w.runCount, 0);
  const totalSec = data.reduce((s, w) => s + w.durationSec, 0);
  const avgKmPerWeek = totalKm / data.length;
  const peak = data.reduce(
    (best, w) => (w.distanceKm > best.distanceKm ? w : best),
    data[0],
  );
  const lastWeek = data[data.length - 1];
  const prevWeek = data[data.length - 2];

  return (
    <div className="space-y-4 rounded-2xl border border-sky-500/40 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <TrendingUp className="text-sky-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          Volume Progression
        </h3>
        <span className="rounded-full border border-sky-500/40 bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-400 uppercase">
          {data.length} weeks
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          ≥ 90% target
          <span className="ml-2 h-2 w-2 rounded-full bg-[#3b82f6]" />
          60-90%
          <span className="ml-2 h-2 w-2 rounded-full bg-[#f59e0b]" />
          30-60%
        </div>
      </div>

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
              minTickGap={16}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              unit="km"
              width={48}
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
                const d = payload[0].payload as WeeklyVolumePoint;
                return (
                  <div className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-xs shadow-xl">
                    <div className="mb-1 font-semibold text-gray-200">
                      {d.weekLabel}
                    </div>
                    <div className="text-gray-300">
                      Distance:{' '}
                      <span className="font-mono font-semibold text-sky-400">
                        {d.distanceKm.toFixed(1)} km
                      </span>
                    </div>
                    <div className="text-gray-300">
                      Runs:{' '}
                      <span className="font-mono font-semibold text-gray-200">
                        {d.runCount}
                      </span>
                    </div>
                    <div className="text-gray-300">
                      Time:{' '}
                      <span className="font-mono font-semibold text-gray-200">
                        {secondsToTimeString(d.durationSec)}
                      </span>
                    </div>
                    {d.elevationGainM > 0 && (
                      <div className="text-gray-300">
                        Elev:{' '}
                        <span className="font-mono font-semibold text-gray-200">
                          {Math.round(d.elevationGainM)} m
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="distanceKm" radius={[4, 4, 0, 0]}>
              {data.map((w) => (
                <Cell
                  key={w.weekStart}
                  fill={colorForKm(w.distanceKm, targetWeeklyKm)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Total
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {totalKm.toFixed(0)} km
            <span className="ml-1 text-[10px] text-gray-500">
              · {totalRuns} runs
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Avg / week
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {avgKmPerWeek.toFixed(1)} km
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Peak week
          </div>
          <div className="mt-1 font-mono font-semibold text-gray-200">
            {peak.distanceKm.toFixed(1)} km
            <span className="ml-1 text-[10px] text-gray-500">
              · {peak.weekLabel}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/40 px-3 py-2">
          <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            WoW Δ
          </div>
          <div
            className="mt-1 font-mono font-semibold"
            style={{
              color:
                !prevWeek || prevWeek.distanceKm === 0
                  ? '#9ca3af'
                  : lastWeek.distanceKm - prevWeek.distanceKm >= 0
                    ? '#10b981'
                    : '#f59e0b',
            }}
          >
            {prevWeek && prevWeek.distanceKm > 0
              ? `${lastWeek.distanceKm - prevWeek.distanceKm >= 0 ? '+' : ''}${(lastWeek.distanceKm - prevWeek.distanceKm).toFixed(1)} km`
              : '—'}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5 text-[11px] text-gray-300">
        <Map size={12} className="mt-0.5 shrink-0 text-sky-400" />
        <div>
          Bar color compares weekly distance to the target of{' '}
          <span className="font-mono font-semibold text-sky-400">
            {targetWeeklyKm} km/week
          </span>
          . Green ≥ 90% target, blue 60-90%, amber 30-60%, gray = rest
          week.
        </div>
      </div>
    </div>
  );
}
