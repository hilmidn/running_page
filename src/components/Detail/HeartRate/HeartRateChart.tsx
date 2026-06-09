import { useMemo } from 'react';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Brush,
  Area,
  ReferenceArea,
  ComposedChart,
} from 'recharts';
import {
  ActivityStream,
  formatStreamData,
  secondsToTimeString,
  formatPace,
  getHRZone,
} from '@/utils/activityAnalytics';
import HRZoneStats from './HRZoneStats';

interface Props {
  stream: ActivityStream;
  maxHR?: number;
}

interface ZoneStat {
  zone: number;
  label: string;
  color: string;
  duration: number;
  percent: number;
}

export default function HeartRateChart({ stream, maxHR = 180 }: Props) {
  const data = useMemo(() => {
    if (!stream || !stream.time) return [];
    return formatStreamData(stream);
  }, [stream]);

  const zones: ZoneStat[] = useMemo(() => {
    return [
      {
        zone: 1,
        label: 'Z1 Recovery',
        color: '#10b981',
        duration: 0,
        percent: 0,
      },
      {
        zone: 2,
        label: 'Z2 Endurance',
        color: '#3b82f6',
        duration: 0,
        percent: 0,
      },
      {
        zone: 3,
        label: 'Z3 Aerobic Base',
        color: '#f59e0b',
        duration: 0,
        percent: 0,
      },
      {
        zone: 4,
        label: 'Z4 Hard Tempo',
        color: '#f97316',
        duration: 0,
        percent: 0,
      },
      {
        zone: 5,
        label: 'Z5 VO2 Max',
        color: '#ef4444',
        duration: 0,
        percent: 0,
      },
    ];
  }, []);

  const zoneStats = useMemo(() => {
    if (!data || data.length === 0 || !stream.heartrate) return zones;

    const stats = [...zones];

    stream.heartrate.forEach((hr) => {
      if (hr === null) return;

      const zoneNumber = getHRZone((hr / maxHR) * 100);
      const stat = stats.find((s) => s.zone === zoneNumber);
      if (stat) {
        stat.duration += 1; // 1 second per data point
      }
    });

    const totalDuration = stats.reduce((sum, s) => sum + s.duration, 0);
    return stats.map((s) => ({
      ...s,
      percent: totalDuration > 0 ? (s.duration / totalDuration) * 100 : 0,
    }));
  }, [data, stream, maxHR, zones]);

  // Loading skeleton
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-gray-800/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-700" />
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-gray-700/40" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2 w-full animate-pulse rounded-full bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-800/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-200">Heart Rate</h2>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
        >
          <defs>
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E53935" stopOpacity={1} />
              <stop offset="100%" stopColor="#B71C1C" stopOpacity={1} />
            </linearGradient>

            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E53935" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#B71C1C" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          {/* HR Zones - using new zone ranges */}
          <ReferenceArea
            y1={maxHR * 0.5}
            y2={maxHR * 0.6}
            fill="#10b981"
            fillOpacity={0.15}
          />
          <ReferenceArea
            y1={maxHR * 0.6}
            y2={maxHR * 0.7}
            fill="#3b82f6"
            fillOpacity={0.15}
          />
          <ReferenceArea
            y1={maxHR * 0.7}
            y2={maxHR * 0.8}
            fill="#f59e0b"
            fillOpacity={0.15}
          />
          <ReferenceArea
            y1={maxHR * 0.8}
            y2={maxHR * 0.9}
            fill="#f97316"
            fillOpacity={0.15}
          />
          <ReferenceArea
            y1={maxHR * 0.9}
            y2={maxHR * 1.1}
            fill="#ef4444"
            fillOpacity={0.15}
          />

          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            interval="preserveStartEnd"
            tickFormatter={(sec) => secondsToTimeString(sec)}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
          />
          <YAxis
            domain={['dataMin - 10', 'dataMax + 10']}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Area shading only */}
          <Area
            type="monotone"
            dataKey="hr"
            fill="url(#areaFill)"
            stroke="none"
            dot={false}
            isAnimationActive={false}
          />

          {/* Bold HR line */}
          <Line
            type="monotone"
            dataKey="hr"
            stroke="url(#hrGradient)"
            strokeWidth={4}
            dot={false}
            isAnimationActive={false}
          />

          <Brush dataKey="time" height={20} />
        </ComposedChart>
      </ResponsiveContainer>

      <HRZoneStats zoneStats={zoneStats} />
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload;

  return (
    <div className="rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
      <div>Time: {secondsToTimeString(d.time)}</div>
      <div>HR: {d.hr ?? '—'} bpm</div>
      {d.pace !== undefined && <div>Pace: {formatPace(d.pace)}</div>}
      {d.altitude !== undefined && <div>Altitude: {d.altitude ?? '—'} m</div>}
      {d.cadence !== undefined && <div>Cadence: {d.cadence ?? '—'} spm</div>}
    </div>
  );
}
