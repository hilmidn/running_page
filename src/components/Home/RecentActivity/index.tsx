import { Link } from 'react-router-dom';
import { Clock, Mountain, Activity as ActivityIcon } from 'lucide-react';
import type { Activity } from '@/utils/utils';
import { formatPace } from '@/utils/activityAnalytics';
import { convertMovingTime2Sec } from '@/utils/utils';

interface Props {
  activities: Activity[];
  limit?: number;
}

export default function RecentActivity({ activities, limit = 5 }: Props) {
  const recent = activities.slice(0, limit);

  if (recent.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900/60 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
        <ActivityIcon size={12} className="text-zinc-500" />
        <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          Recent Activity
        </div>
      </div>
      <div className="divide-y divide-zinc-800/60">
        {recent.map((a) => {
          const km = a.distance / 1000;
          const paceSecPerKm = convertMovingTime2Sec(a.moving_time) / km;
          const date = new Date(a.start_date_local);
          const dateLabel = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const weekday = date.toLocaleDateString('en-US', {
            weekday: 'short',
          });
          return (
            <Link
              key={a.run_id}
              to={`/detail/${a.run_id}`}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/40"
            >
              <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <span className="font-mono text-[10px] font-bold leading-none">
                  {date.getDate()}
                </span>
                <span className="text-[8px] font-semibold tracking-wider uppercase opacity-80">
                  {weekday}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-emerald-400">
                  {a.name || 'Run'}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="font-mono text-zinc-300">
                    {km.toFixed(1)} km
                  </span>
                  <span>·</span>
                  <span className="font-mono">{formatPace(paceSecPerKm)}/km</span>
                  <span>·</span>
                  <span className="font-mono">{a.moving_time}</span>
                </div>
              </div>
              {a.elevation_gain != null && a.elevation_gain > 0 && (
                <div className="flex shrink-0 items-center gap-0.5 text-[10px] text-amber-400">
                  <Mountain size={10} />
                  <span className="font-mono">
                    {Math.round(a.elevation_gain)}m
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
