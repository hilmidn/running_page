import { useMemo } from 'react';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  ReferenceArea,
  ComposedChart,
} from 'recharts';
import { Heart } from 'lucide-react';
import {
  ActivityStream,
  formatStreamData,
  secondsToTimeString,
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

  const zones: ZoneStat[] = useMemo(
    () => [
      { zone: 1, label: 'Z1 Recovery', color: '#10b981', duration: 0, percent: 0 },
      { zone: 2, label: 'Z2 Endurance', color: '#3b82f6', duration: 0, percent: 0 },
      { zone: 3, label: 'Z3 Aerobic', color: '#f59e0b', duration: 0, percent: 0 },
      { zone: 4, label: 'Z4 Tempo', color: '#f97316', duration: 0, percent: 0 },
      { zone: 5, label: 'Z5 VO2 Max', color: '#ef4444', duration: 0, percent: 0 },
    ],
    [],
  );

  const zoneStats = useMemo(() => {
    if (!data || data.length === 0 || !stream.heartrate) return zones;

    const stats = zones.map((z) => ({ ...z }));

    stream.heartrate.forEach((hr) => {
      if (hr === null) return;
      const zoneNumber = getHRZone((hr / maxHR) * 100);
      const stat = stats.find((s) => s.zone === zoneNumber);
      if (stat) stat.duration += 1;
    });

    const totalDuration = stats.reduce((sum, s) => sum + s.duration, 0);
    return stats.map((s) => ({
      ...s,
      percent: totalDuration > 0 ? (s.duration / totalDuration) * 100 : 0,
    }));
  }, [data, stream, maxHR, zones]);

  const hasHR = stream.heartrate?.some((h) => h !== null);

  // Loading skeleton
  if (!stream.heartrate) {
    return (
      <div className="rounded-xl bg-gray-800/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-700" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
        </div>
        <div className="h-[250px] animate-pulse rounded-lg bg-gray-700/40" />
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

  if (!hasHR || data.length === 0) {
    return (
      <div className="rounded-xl bg-gray-800/40 p-6 text-center">
        <Heart className="mx-auto mb-2 text-gray-500" size={32} />
        <p className="text-sm text-gray-400">No heart rate data available</p>
      </div>
    );
  }

  // HR y-axis domain: round to nearest 10
  const hrValues = data.map((d) => d.hr ?? 0).filter((v) => v > 0);
  const minHR = Math.max(0, Math.floor(Math.min(...hrValues) / 10) * 10 - 10);
  const maxHRrounded = Math.ceil(Math.max(...hrValues) / 10) * 10 + 10;

  return (
    <div className="rounded-xl bg-gray-800/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Heart className="text-red-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Heart Rate</h3>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          {/* Zone reference bands */}
          <ReferenceArea y1={0} y2={maxHR * 0.6} fill="#10b981" fillOpacity={0.06} />
          <ReferenceArea y1={maxHR * 0.6} y2={maxHR * 0.7} fill="#3b82f6" fillOpacity={0.06} />
          <ReferenceArea y1={maxHR * 0.7} y2={maxHR * 0.8} fill="#f59e0b" fillOpacity={0.06} />
          <ReferenceArea y1={maxHR * 0.8} y2={maxHR * 0.9} fill="#f97316" fillOpacity={0.06} />
          <ReferenceArea y1={maxHR * 0.9} y2={maxHR * 1.1} fill="#ef4444" fillOpacity={0.06} />

          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(sec) => {
              const m = Math.floor(sec / 60);
              return `${m}m`;
            }}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
          />
          <YAxis
            domain={[minHR, maxHRrounded]}
            stroke="#6b7280"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip content={<CustomTooltip maxHR={maxHR} />} />

          <defs>
            <linearGradient id="hrAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="hr"
            fill="url(#hrAreaFill)"
            stroke="none"
            dot={false}
            isAnimationActive={false}
          />

          <Line
            type="monotone"
            dataKey="hr"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <HRZoneStats zoneStats={zoneStats} />
    </div>
  );
}

function CustomTooltip({ active, payload, maxHR }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || d.hr == null) return null;

  const hrPercent = ((d.hr / (maxHR || 180)) * 100).toFixed(0);
  const zone = getHRZone(Number(hrPercent));

  return (
    <div className="rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
      <div className="text-gray-400">{secondsToTimeString(d.time)}</div>
      <div className="mt-1 text-base font-semibold text-red-400">
        {d.hr}{' '}
        <span className="text-xs font-normal text-gray-400">bpm</span>
      </div>
      <div className="text-gray-400">
        Zone {zone} · {hrPercent}% max
      </div>
    </div>
  );
}
