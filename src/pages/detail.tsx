import { useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import useActivities from '@/hooks/useActivities';
import HeartRateChart from '@/components/Detail/HeartRate/HeartRateChart';
import DetailActivity from '@/components/Detail/Activity';
import ElevationChart from '@/components/Detail/ElevationChart';
import PaceChart from '@/components/Detail/PaceChart';
import CadenceChart from '@/components/Detail/CadenceChart';
import RouteMap from '@/components/Detail/RouteMap';
import SplitsTable from '@/components/Detail/SplitsTable';
import type { ActivityStream } from '@/utils/activityAnalytics';

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse space-y-3 rounded-xl bg-gray-800/20 p-4">
          <div className="h-4 w-1/3 rounded bg-gray-700/30" />
          <div className="h-40 rounded bg-gray-700/20" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 rounded bg-gray-700/20" />
            <div className="h-12 rounded bg-gray-700/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DetailPage() {
  const { id } = useParams();
  const { activities } = useActivities();
  const [stream, setStream] = useState<ActivityStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const maxHR = 220 - (new Date().getFullYear() - 1997);

  const activity = useMemo(() => {
    const numId = id ? parseInt(id) : null;
    return numId ? activities.find((a) => a.run_id === numId) : undefined;
  }, [activities, id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/static/activity_streams/${id}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load stream data (${res.status})`);
        return res.json();
      })
      .then((data: ActivityStream) => {
        setStream(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-3 text-red-400" size={48} />
          <p className="mb-2 text-gray-300">Failed to load activity data</p>
          <p className="mb-4 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm text-amber-400 transition-colors hover:bg-amber-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stream) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-amber-500/40 to-transparent" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column — Activity Info + Map + Splits */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <DetailActivity id={id ? parseInt(id) : null} stream={stream} />

          <section id="route-map">
            <RouteMap activity={activity} />
          </section>

          <section id="splits-table">
            <SplitsTable stream={stream} />
          </section>
        </div>

        {/* Center Column — HR + Elevation + Pace */}
        <div className="space-y-4">
          <section id="heart-rate-chart">
            <HeartRateChart stream={stream} maxHR={maxHR} />
          </section>

          <section id="elevation-chart">
            <ElevationChart stream={stream} />
          </section>

          <section id="pace-chart">
            <PaceChart stream={stream} />
          </section>
        </div>

        {/* Right Column — Cadence + Extra */}
        <div className="space-y-4">
          <section id="cadence-chart">
            <CadenceChart stream={stream} />
          </section>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-600">
        Data loaded | {activity?.name ?? `Activity #${id}`}
      </div>
    </div>
  );
}
