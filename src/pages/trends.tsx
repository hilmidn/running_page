import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { useTheme } from '@/hooks/useTheme';
import useActivities from '@/hooks/useActivities';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import VolumeProgression from '@/components/Trends/VolumeProgression';
import PaceTrend from '@/components/Trends/PaceTrend';
import TrainingBalance from '@/components/Trends/TrainingBalance';
import RaceTimePredictor from '@/components/Trends/RaceTimePredictor';
import DecouplingTrend from '@/components/Trends/DecouplingTrend';
import TrainingLoad from '@/components/Trends/TrainingLoad';
import VO2maxTrend from '@/components/Trends/VO2maxTrend';
import HRZoneTrend from '@/components/Trends/HRZoneTrend';
import type { ActivityStream } from '@/utils/activityAnalytics';
import { Loader2, Activity, Calendar } from 'lucide-react';

type Window = 4 | 8 | 12 | 26 | 52;

const WINDOW_OPTIONS: { value: Window; label: string }[] = [
  { value: 4, label: '4 wks' },
  { value: 8, label: '8 wks' },
  { value: 12, label: '12 wks' },
  { value: 26, label: '26 wks' },
  { value: 52, label: '52 wks' },
];

const TrendsPage = () => {
  const { theme } = useTheme();
  const { siteTitle } = useSiteMetadata();
  const { activities } = useActivities();
  const [streamMap, setStreamMap] = useState<
    Map<number, ActivityStream | null>
  >(() => new Map());
  const [streamProgress, setStreamProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [weeksBack, setWeeksBack] = useState<Window>(12);
  const [maxHR, setMaxHR] = useState<number>(196);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Filter to running-type activities
  const runActivities = useMemo(
    () => activities.filter((a) => a.type === 'Run' || a.type === 'running'),
    [activities],
  );

  // Lazy-load streams once activities are ready
  useEffect(() => {
    if (runActivities.length === 0) {
      setStreamMap(new Map());
      return;
    }
    let cancelled = false;
    const m = new Map<number, ActivityStream | null>();
    setStreamMap(m);
    setStreamProgress({ done: 0, total: runActivities.length });

    // Fetch in batches of 8 to avoid hammering the static server.
    const batchSize = 8;
    const queue = [...runActivities];
    let done = 0;

    const next = async () => {
      if (cancelled) return;
      const batch = queue.splice(0, batchSize);
      await Promise.all(
        batch.map(async (a) => {
          try {
            const res = await fetch(
              `${import.meta.env.BASE_URL}static/activity_streams/${a.run_id}.json`,
            );
            if (res.ok) {
              const data = (await res.json()) as ActivityStream;
              m.set(a.run_id, data);
            } else {
              m.set(a.run_id, null);
            }
          } catch {
            m.set(a.run_id, null);
          } finally {
            done += 1;
            if (!cancelled) {
              setStreamProgress({ done, total: runActivities.length });
            }
          }
        }),
      );
      if (queue.length > 0) {
        await next();
      } else if (!cancelled) {
        setStreamProgress(null);
        // Trigger re-render with the populated map
        setStreamMap(new Map(m));
      }
    };
    next();

    return () => {
      cancelled = true;
    };
  }, [runActivities]);

  const streamsLoading = streamProgress != null;

  return (
    <>
      <Helmet>
        <html lang="en" data-theme={theme} />
        <title>Trends · {siteTitle}</title>
      </Helmet>
      <Layout>
        <div className="mx-auto w-full space-y-6">
          {/* Page header */}
          <div className="rounded-2xl border border-gray-700/60 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <Activity className="text-emerald-400" size={22} />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Training Trends
                </h1>
                <p className="text-xs text-gray-400">
                  Multi-run analytics · last {weeksBack} weeks
                </p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-gray-400">Window:</span>
                  {WINDOW_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setWeeksBack(opt.value)}
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                        weeksBack === opt.value
                          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
                          : 'border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">maxHR:</span>
                  <input
                    type="number"
                    value={maxHR}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (Number.isFinite(v) && v > 100 && v < 250) {
                        setMaxHR(v);
                      }
                    }}
                    className="w-16 rounded-md border border-gray-700 bg-gray-800/60 px-2 py-0.5 text-center font-mono text-xs text-gray-200 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            {streamsLoading && streamProgress && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
                <Loader2 size={12} className="animate-spin" />
                Loading streams: {streamProgress.done}/{streamProgress.total}
                <div className="ml-2 h-1 w-32 overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{
                      width: `${(streamProgress.done / streamProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Volume progression — uses only activity summary, no streams needed */}
          {runActivities.length > 0 && (
            <VolumeProgression
              activities={runActivities}
              weeksBack={weeksBack}
              targetWeeklyKm={30}
            />
          )}

          {/* Pace trend — also uses activity summary only */}
          {runActivities.length > 0 && (
            <PaceTrend
              activities={runActivities}
              weeksBack={weeksBack}
              targetPaceSecKm={
                maxHR > 0 ? Math.round((60 / (0.76 * maxHR)) * 60 * 60) : undefined
              }
            />
          )}

          {/* Race day analytics + training load + decoupling + advanced need streams */}
          {!streamsLoading && runActivities.length > 0 && (
            <>
              <RaceTimePredictor
                activities={runActivities}
                streamMap={streamMap}
                weeksBack={26}
                focusLabel="Half Marathon"
              />
              <TrainingLoad
                activities={runActivities}
                streamMap={streamMap}
                maxHR={maxHR}
                weeksBack={weeksBack}
              />
              <DecouplingTrend
                activities={runActivities}
                streamMap={streamMap}
                weeksBack={weeksBack}
                minDurationMin={30}
              />
              <VO2maxTrend
                activities={runActivities}
                streamMap={streamMap}
                weeksBack={weeksBack}
              />
              <TrainingBalance
                activities={runActivities}
                streamMap={streamMap}
                maxHR={maxHR}
                weeksBack={weeksBack}
                targetZ2Percent={70}
              />
              <HRZoneTrend
                activities={runActivities}
                streamMap={streamMap}
                maxHR={maxHR}
                weeksBack={weeksBack}
                targetZ2Share={0.7}
              />
            </>
          )}

          {streamsLoading && (
            <div className="rounded-2xl border border-gray-700/60 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                Loading per-run analytics…
              </div>
            </div>
          )}

          {runActivities.length === 0 && (
            <div className="rounded-2xl border border-gray-700/60 bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white shadow-lg">
              <div className="py-8 text-center text-sm text-gray-500">
                No running activities found.
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default TrendsPage;
