import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Brush,
  CartesianGrid,
} from 'recharts';
import { Mountain } from 'lucide-react';
import type { ActivityStream } from '@/utils/activityAnalytics';
import {
  createElevationProfileData,
  smoothElevationData,
} from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
  compact?: boolean;
}

function formatElevation(m: number) {
  return `${Math.round(m)}m`;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-1 text-amber-400">
        <Mountain size={12} /> Elevation
      </div>
      <div className="mt-1 font-semibold">{formatElevation(d.elevation)}</div>
      <div className="text-gray-400">{d.distanceKm.toFixed(2)} km</div>
      {d.grade !== 0 && (
        <div className="text-gray-400">
          Grade: {d.grade > 0 ? '+' : ''}
          {d.grade.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export default function ElevationChart({ stream, compact }: Props) {
  const hasAltitude = stream.altitude?.some((a) => a !== null);

  const rawData = useMemo(() => {
    if (!hasAltitude) return [];
    return createElevationProfileData(stream);
  }, [stream, hasAltitude]);

  const elevationData = useMemo(() => {
    if (rawData.length === 0) return [];
    return smoothElevationData(rawData, 5);
  }, [rawData]);

  const totalGain = useMemo(() => {
    let gain = 0;
    for (let i = 1; i < rawData.length; i++) {
      const diff = rawData[i].elevation - rawData[i - 1].elevation;
      if (diff > 0) gain += diff;
    }
    return Math.round(gain);
  }, [rawData]);

  const maxElevation = useMemo(
    () =>
      elevationData.length
        ? Math.max(...elevationData.map((d) => d.elevation))
        : 0,
    [elevationData]
  );
  const minElevation = useMemo(
    () =>
      elevationData.length
        ? Math.min(...elevationData.map((d) => d.elevation))
        : 0,
    [elevationData]
  );

  const chartHeight = compact ? 200 : 300;

  // Loading skeleton
  if (!stream.altitude) {
    return (
      <div className="bg-linear-to-b from-gray-900 to-gray-800 space-y-4 rounded-2xl p-6 text-white shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
          </div>
          <div className="flex gap-3">
            <div className="h-4 w-16 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-700" />
          </div>
        </div>
        <div
          style={{ height: chartHeight }}
          className="animate-pulse rounded-lg bg-gray-700/40"
        />
      </div>
    );
  }

  if (!hasAltitude || elevationData.length === 0) {
    return (
      <div className="bg-linear-to-b from-gray-900 to-gray-800 space-y-4 rounded-2xl p-6 text-white shadow-lg text-center">
        <Mountain className="mx-auto mb-2 text-gray-500" size={32} />
        <p className="text-sm text-gray-400">Elevation data unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-b from-gray-900 to-gray-800 space-y-4 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mountain className="text-amber-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">Elevation</h3>
        </div>
        <div className="flex gap-3 text-xs text-gray-400">
          <span className="text-green-400">+{totalGain}m</span>
          <span>Max {formatElevation(maxElevation)}</span>
          <span>Min {formatElevation(minElevation)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart
          data={elevationData}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="distanceKm"
            tickFormatter={(v) => `${v.toFixed(1)}`}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
          />
          <YAxis
            tickFormatter={(v) => `${Math.round(v)}`}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="elevation"
            fill="url(#elevationFill)"
            stroke="#d97706"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="grade"
            stroke="#06b6d4"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
            hide={true}
          />
          <Brush
            dataKey="distanceKm"
            height={16}
            fill="#1f2937"
            stroke="#4b5563"
            tickFormatter={(v) => `${v.toFixed(1)}km`}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
