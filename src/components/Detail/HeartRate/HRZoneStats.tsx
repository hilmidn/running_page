import { useMemo } from 'react';
import { Heart, Zap } from 'lucide-react';

interface ZoneStat {
  zone: number;
  label: string;
  color: string;
  duration: number;
  percent: number;
}

interface Props {
  zoneStats: ZoneStat[];
}

export default function HRZoneStats({ zoneStats }: Props) {
  if (!zoneStats || zoneStats.length === 0) {
    return (
      <div className="mt-4 rounded-xl bg-gray-800/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Heart className="text-red-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">
            HR Zone Distribution
          </h3>
        </div>
        <div className="py-8 text-center">
          <Heart className="mx-auto mb-2 text-gray-600" size={32} />
          <p className="text-sm text-gray-500">No heart rate data available</p>
        </div>
      </div>
    );
  }

  const dominantZone = useMemo(() => {
    if (!zoneStats.length) return null;
    return zoneStats.reduce(
      (max, z) => (z.percent > max.percent ? z : max),
      zoneStats[0]
    );
  }, [zoneStats]);

  const effortLabel = useMemo(() => {
    if (!dominantZone) return '';
    switch (dominantZone.label) {
      case 'Z1 Recovery':
        return 'Easy / Recovery';
      case 'Z2 Endurance':
        return 'Endurance / Base';
      case 'Z3 Aerobic Base':
        return 'Solid Aerobic';
      case 'Z4 Hard Tempo':
        return 'Hard Tempo';
      case 'Z5 VO2 Max':
        return 'All-out / VO2 Max';
      default:
        return '';
    }
  }, [dominantZone]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-4 rounded-xl bg-gray-800/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Heart className="text-red-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          HR Zone Distribution
        </h3>
      </div>

      <div className="space-y-3">
        {zoneStats.map((z) => (
          <div key={z.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: z.color }}
                />
                <span className="text-gray-300">{z.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  {formatDuration(z.duration)}
                </span>
                <span className="w-10 text-right font-medium text-gray-200">
                  {z.percent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(z.percent, 100)}%`,
                  backgroundColor: z.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {dominantZone && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-800/60 p-3 text-xs">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-gray-400">
            Dominated{' '}
            <span
              style={{ color: dominantZone.color }}
              className="font-semibold"
            >
              {dominantZone.label}
            </span>
          </span>
          <span className="ml-auto text-gray-500">{effortLabel}</span>
        </div>
      )}
    </div>
  );
}
