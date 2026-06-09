import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Gauge } from 'lucide-react';
import type { ActivityStream } from '@/utils/activityAnalytics';
import { splitActivityByDistance, formatPace } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
  compact?: boolean;
}

function getPaceColor(pace: number, avgPace: number): string {
  if (pace < avgPace * 0.95) return '#10b981';
  if (pace < avgPace * 1.05) return '#f59e0b';
  return '#ef4444';
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
      <div>Segment {d.index + 1}</div>
      <div className="mt-1 font-semibold">{formatPace(d.avgPace)}/km</div>
      <div className="text-gray-400">{d.distanceKm.toFixed(2)} km</div>
      {d.avgHR != null && (
        <div className="text-gray-400">HR: {d.avgHR} bpm</div>
      )}
    </div>
  );
}

export default function PaceChart({ stream, compact }: Props) {
  const segments = useMemo(
    () => splitActivityByDistance(stream, 1000),
    [stream]
  );

  const avgPace = useMemo(() => {
    if (segments.length === 0) return 0;
    const paces = segments
      .map((s) => s.avgPace)
      .filter((p) => p > 0 && isFinite(p));
    return paces.length ? paces.reduce((a, b) => a + b, 0) / paces.length : 0;
  }, [segments]);

  const chartData = useMemo(() => {
    if (segments.length === 0) return [];
    return segments.map((s) => ({
      index: s.index,
      distanceKm: s.distanceKm,
      avgPace: s.avgPace || 0,
      avgHR: s.avgHR,
      elevationGain: s.elevationGain,
      paceFormatted: s.paceFormatted,
      fill: getPaceColor(s.avgPace, avgPace),
    }));
  }, [segments, avgPace]);

  const hasPaceData = stream.distance?.length > 1 && stream.time?.length > 1;

  const chartHeight = compact ? 220 : 300;

  // Loading skeleton
  if (!hasPaceData) {
    return (
      <div className="rounded-xl bg-gray-800/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
          </div>
          <div className="flex gap-3">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-700" />
          </div>
        </div>
        <div
          style={{ height: chartHeight }}
          className="animate-pulse rounded-lg bg-gray-700/40"
        />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl bg-gray-800/40 p-6 text-center">
        <Gauge className="mx-auto mb-2 text-gray-500" size={32} />
        <p className="text-sm text-gray-400">Insufficient pace data</p>
      </div>
    );
  }

  const avgPaceFormatted = avgPace > 0 ? formatPace(avgPace) : '--:--';

  const fastest = useMemo(
    () =>
      chartData.reduce(
        (m, d) => (d.avgPace > 0 && d.avgPace < m ? d.avgPace : m),
        Infinity
      ),
    [chartData]
  );
  const slowest = useMemo(
    () => chartData.reduce((m, d) => (d.avgPace > m ? d.avgPace : m), 0),
    [chartData]
  );

  return (
    <div className="rounded-xl bg-gray-800/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="text-cyan-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">Pace Splits</h3>
        </div>
        <div className="flex gap-3 text-xs text-gray-400">
          <span className="text-green-400">Fast {formatPace(fastest)}</span>
          <span>Avg {avgPaceFormatted}</span>
          <span className="text-red-400">Slow {formatPace(slowest)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="index"
            tickFormatter={(v) => `${v + 1}`}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
            label={{
              value: 'Segment',
              position: 'insideBottomRight',
              offset: -5,
              style: { fill: '#6b7280', fontSize: 10 },
            }}
          />
          <YAxis
            reversed
            tickFormatter={(v) => formatPace(v)}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="avgPace"
            fill="#10b981"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
            shape={(props: any) => {
              const { fill, x, y, width, height } = props;
              const safeHeight = Math.max(0, height);
              if (safeHeight === 0) return null;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={safeHeight}
                  fill={fill}
                  rx={2}
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="avgPace"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
