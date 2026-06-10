import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Footprints } from 'lucide-react';
import type { ActivityStream } from '@/utils/activityAnalytics';
import { createCadenceZoneData } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
  compact?: boolean;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
      <div className="font-semibold" style={{ color: d.color }}>
        {d.zone} ({d.rpmRange} RPM)
      </div>
      <div className="mt-1">{d.percentage.toFixed(1)}% of time</div>
      <div className="text-gray-400">{d.timeFormatted}</div>
      <div className="text-gray-400">Avg {d.avgRpm} RPM</div>
    </div>
  );
}

export default function CadenceChart({ stream, compact }: Props) {
  const totalTime = stream.time?.[stream.time.length - 1] ?? 0;

  const zoneData = useMemo(
    () => createCadenceZoneData(stream, totalTime),
    [stream, totalTime]
  );

  const hasCadence = stream.cadence?.some((c) => c !== null);

  const chartHeight = compact ? 200 : 250;

  // Loading skeleton
  if (!stream.cadence) {
    return (
      <div className="bg-linear-to-b from-gray-900 to-gray-800 space-y-4 rounded-2xl p-6 text-white shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-700" />
        </div>
        <div
          style={{ height: chartHeight }}
          className="animate-pulse rounded-lg bg-gray-700/40"
        />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-700" />
              <div className="h-3 w-12 animate-pulse rounded bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasCadence || zoneData.length === 0) {
    return (
      <div className="bg-linear-to-b from-gray-900 to-gray-800 space-y-4 rounded-2xl p-6 text-white shadow-lg text-center">
        <Footprints className="mx-auto mb-2 text-gray-500" size={32} />
        <p className="text-sm text-gray-400">No cadence sensor data</p>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-b from-gray-900 to-gray-800 space-y-4 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <Footprints className="text-purple-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Cadence Zones</h3>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={zoneData}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="zone" stroke="#6b7280" tick={{ fontSize: 10 }} />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="percentage"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={payload.color}
                  rx={4}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 space-y-1">
        {zoneData
          .filter((z) => z.percentage > 0)
          .map((z) => (
            <div
              key={z.zone}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: z.color }}
                />
                <span className="text-gray-300">{z.zone}</span>
                <span className="text-gray-500">{z.rpmRange} RPM</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{z.avgRpm} avg</span>
                <span className="w-10 text-right font-medium text-gray-200">
                  {z.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
