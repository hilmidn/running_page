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
      <div className="py-6 text-center">
        <Heart className="mx-auto mb-2 text-gray-600" size={24} />
        <p className="text-sm text-gray-500">No heart rate data</p>
      </div>
    );
  }

  const dominantZone = useMemo(() => {
    return zoneStats.reduce(
      (max, z) => (z.percent > max.percent ? z : max),
      zoneStats[0],
    );
  }, [zoneStats]);

  const effortLabel = useMemo(() => {
    switch (dominantZone?.label) {
      case 'Z1 Recovery':   return 'Easy / Recovery';
      case 'Z2 Endurance':  return 'Endurance / Base';
      case 'Z3 Aerobic':    return 'Solid Aerobic';
      case 'Z4 Tempo':      return 'Hard Tempo';
      case 'Z5 VO2 Max':    return 'All-out / VO2 Max';
      default:              return '';
    }
  }, [dominantZone]);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Heart size={12} className="text-red-400" />
        <span>HR Zone Distribution</span>
      </div>

      <div className="space-y-2">
        {zoneStats
          .filter((z) => z.percent > 0)
          .map((z) => (
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
                    {Math.floor(z.duration / 60)}:
                    {Math.floor(z.duration % 60)
                      .toString()
                      .padStart(2, '0')}
                  </span>
                  <span className="w-10 text-right font-medium text-gray-200">
                    {z.percent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
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
        <div className="flex items-center gap-2 rounded-lg bg-gray-800/40 px-3 py-2 text-xs">
          <Zap size={12} className="text-yellow-400" />
          <span className="text-gray-400">
            Mostly{' '}
            <span style={{ color: dominantZone.color }} className="font-semibold">
              {dominantZone.label}
            </span>
          </span>
          <span className="ml-auto text-gray-500">{effortLabel}</span>
        </div>
      )}
    </div>
  );
}
