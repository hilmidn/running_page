import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Helmet } from 'react-helmet-async';
import {
  Footprints,
  Flame,
  Calendar,
  TrendingUp,
  MapPin,
  List,
  Grid3x3,
  Globe,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LocationStat from '@/components/LocationStat';
import RunMap from '@/components/RunMap';
import RunTable from '@/components/RunTable';
import SVGStat from '@/components/SVGStat';
import useActivities from '@/hooks/useActivities';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import { useInterval } from '@/hooks/useInterval';
import {
  Activity,
  IViewState,
  filterAndSortRuns,
  filterCityRuns,
  filterTitleRuns,
  filterYearRuns,
  geoJsonForRuns,
  getBoundsForGeoData,
  scrollToMap,
  sortDateFunc,
  titleForShow,
  RunIds,
} from '@/utils/utils';
import { useTheme } from '@/hooks/useTheme';
import DetailActivity from '@/components/Detail/Activity';
import KPITile from '@/components/Home/KPITile';
import Tabs from '@/components/Home/Tabs';
import QuickLinks from '@/components/Home/QuickLinks';
import RecentActivity from '@/components/Home/RecentActivity';

const Index = () => {
  const { siteTitle, siteUrl } = useSiteMetadata();
  const { activities, thisYear } = useActivities();
  const [year, setYear] = useState(thisYear);
  const [runIndex, setRunIndex] = useState(-1);
  const [title, setTitle] = useState('');
  // Animation states for replacing intervalIdRef
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [animationRuns, setAnimationRuns] = useState<Activity[]>([]);
  const [currentFilter, setCurrentFilter] = useState<{
    item: string;
    func: (_run: Activity, _value: string) => boolean;
  }>({ item: thisYear, func: filterYearRuns });

  // State to track if we're showing a single run from URL hash
  const [singleRunId, setSingleRunId] = useState<number | null>(null);

  // Animation trigger for single runs - increment this to force animation replay
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const selectedRunIdRef = useRef<number | null>(null);
  const selectedRunDateRef = useRef<string | null>(null);

  // Parse URL hash on mount to check for run ID
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.startsWith('run_')) {
      const runId = parseInt(hash.replace('run_', ''), 10);
      if (!isNaN(runId)) {
        setSingleRunId(runId);
      }
    }

    // Listen for hash changes (browser back/forward buttons)
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (newHash && newHash.startsWith('run_')) {
        const runId = parseInt(newHash.replace('run_', ''), 10);
        if (!isNaN(runId)) {
          setSingleRunId(runId);
        }
      } else {
        // Hash was cleared, reset to normal view
        setSingleRunId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Memoize expensive calculations
  const runs = useMemo(() => {
    return filterAndSortRuns(
      activities,
      currentFilter.item,
      currentFilter.func,
      sortDateFunc
    );
  }, [activities, currentFilter.item, currentFilter.func]);

  const geoData = useMemo(() => {
    return geoJsonForRuns(runs);
  }, [runs]);

  // for auto zoom
  const bounds = useMemo(() => {
    return getBoundsForGeoData(geoData);
  }, [geoData]);

  const [viewState, setViewState] = useState<IViewState>(() => ({
    ...bounds,
  }));

  // Add state for animated geoData to handle the animation effect
  const [animatedGeoData, setAnimatedGeoData] = useState(geoData);

  // Use useInterval for animation instead of intervalIdRef
  useInterval(
    () => {
      if (!isAnimating || currentAnimationIndex >= animationRuns.length) {
        setIsAnimating(false);
        setAnimatedGeoData(geoData);
        return;
      }

      const runsNum = animationRuns.length;
      const sliceNum = runsNum >= 8 ? Math.ceil(runsNum / 8) : 1;
      const nextIndex = Math.min(currentAnimationIndex + sliceNum, runsNum);
      const tempRuns = animationRuns.slice(0, nextIndex);
      setAnimatedGeoData(geoJsonForRuns(tempRuns));
      setCurrentAnimationIndex(nextIndex);

      if (nextIndex >= runsNum) {
        setIsAnimating(false);
        setAnimatedGeoData(geoData);
      }
    },
    isAnimating ? 300 : null
  );

  // Helper function to start animation
  const startAnimation = useCallback(
    (runsToAnimate: Activity[]) => {
      if (runsToAnimate.length === 0) {
        setAnimatedGeoData(geoData);
        return;
      }

      const sliceNum =
        runsToAnimate.length >= 8 ? Math.ceil(runsToAnimate.length / 8) : 1;
      setAnimationRuns(runsToAnimate);
      setCurrentAnimationIndex(sliceNum);
      setIsAnimating(true);
    },
    [geoData]
  );

  const changeByItem = useCallback(
    (
      item: string,
      name: string,
      func: (_run: Activity, _value: string) => boolean
    ) => {
      scrollToMap();
      if (name != 'Year') {
        setYear(thisYear);
      }
      setCurrentFilter({ item, func });
      setRunIndex(-1);
      setTitle(`${item} ${name} Running Heatmap`);
      // Reset single run state when changing filters
      setSingleRunId(null);
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname);
      }
    },
    [thisYear]
  );

  const changeYear = useCallback(
    (y: string) => {
      // default year
      setYear(y);

      if ((viewState.zoom ?? 0) > 3 && bounds) {
        setViewState({
          ...bounds,
        });
      }

      changeByItem(y, 'Year', filterYearRuns);
      // Stop current animation
      setIsAnimating(false);
    },
    [viewState.zoom, bounds, changeByItem]
  );

  const changeCity = useCallback(
    (city: string) => {
      changeByItem(city, 'City', filterCityRuns);
    },
    [changeByItem]
  );

  const changeTitle = useCallback(
    (title: string) => {
      changeByItem(title, 'Title', filterTitleRuns);
    },
    [changeByItem]
  );

  // For RunTable compatibility - create a mock setActivity function
  const setActivity = useCallback((_newRuns: Activity[]) => {
    // Since we're using memoized runs, we can't directly set activity
    // This is used by RunTable but we can work around it by managing the filter instead
    console.warn('setActivity called but runs are now computed from filters');
  }, []);

  const locateActivity = useCallback(
    (runIds: RunIds) => {
      const ids = new Set(runIds);

      const selectedRuns = !runIds.length
        ? runs
        : runs.filter((r: any) => ids.has(r.run_id));

      if (!selectedRuns.length) {
        return;
      }

      const lastRun = selectedRuns.sort(sortDateFunc)[0];

      if (!lastRun) {
        return;
      }

      // Set runIndex for table highlighting when single run is selected
      if (runIds.length === 1) {
        const runId = runIds[0];
        const runIdx = runs.findIndex((run) => run.run_id === runId);
        setRunIndex(runIdx);
      } else {
        setRunIndex(-1);
      }

      // Update URL hash when a single run is located
      if (runIds.length === 1) {
        const runId = runIds[0];
        const newHash = `#run_${runId}`;
        if (window.location.hash !== newHash) {
          window.history.pushState(null, '', newHash);
        }
        setSingleRunId(runId);
      } else {
        // If multiple runs or no runs, clear the hash and single run state
        if (window.location.hash) {
          window.history.pushState(null, '', window.location.pathname);
        }
        setSingleRunId(null);
      }

      // Create geoData for selected runs and calculate new bounds
      const selectedGeoData = geoJsonForRuns(selectedRuns);
      const selectedBounds = getBoundsForGeoData(selectedGeoData);

      // Stop any existing animation
      setIsAnimating(false);

      // Update the animated geoData immediately to trigger RunMap animation
      setAnimatedGeoData(selectedGeoData);

      // For single run, trigger animation by incrementing the trigger
      if (runIds.length === 1) {
        setAnimationTrigger((prev) => prev + 1);
      }

      // Update view state
      setViewState({
        ...selectedBounds,
      });
      setTitle(titleForShow(lastRun));
      scrollToMap();
    },
    [runs]
  );

  // Auto locate activity when singleRunId is set and activities are loaded
  useEffect(() => {
    if (singleRunId !== null && activities.length > 0) {
      // Check if the run exists in our activities
      const runExists = activities.some((run) => run.run_id === singleRunId);
      if (runExists) {
        // Automatically simulate clicking the single run
        locateActivity([singleRunId]);
      } else {
        // If run doesn't exist, clear the hash and show a warning
        console.warn(`Run with ID ${singleRunId} not found in activities`);
        window.history.replaceState(null, '', window.location.pathname);
        setSingleRunId(null);
      }
    }
  }, [singleRunId, activities, locateActivity]);

  // Update bounds when geoData changes
  useEffect(() => {
    setViewState((prev) => ({
      ...prev,
      ...bounds,
    }));
  }, [bounds]);

  // Animate geoData when runs change
  useEffect(() => {
    startAnimation(runs);
  }, [runs, startAnimation]);

  useEffect(() => {
    if (year !== 'Total') {
      return;
    }

    let svgStat = document.getElementById('svgStat');
    if (!svgStat) {
      return;
    }

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'path') {
        // Use querySelector to get the <desc> element and the <title> element.
        const descEl = target.querySelector('desc');
        if (descEl) {
          // If the runId exists in the <desc> element, it means that a running route has been clicked.
          const runId = Number(descEl.innerHTML);
          if (!runId) {
            return;
          }
          if (selectedRunIdRef.current === runId) {
            selectedRunIdRef.current = null;
            locateActivity(runs.map((r) => r.run_id));
          } else {
            selectedRunIdRef.current = runId;
            locateActivity([runId]);
          }
          return;
        }

        const titleEl = target.querySelector('title');
        if (titleEl) {
          // If the runDate exists in the <title> element, it means that a date square has been clicked.
          const [runDate] = titleEl.innerHTML.match(
            /\d{4}-\d{1,2}-\d{1,2}/
          ) || [`${+thisYear + 1}`];
          const runIDsOnDate = runs
            .filter((r) => r.start_date_local.slice(0, 10) === runDate)
            .map((r) => r.run_id);
          if (!runIDsOnDate.length) {
            return;
          }
          if (selectedRunDateRef.current === runDate) {
            selectedRunDateRef.current = null;
            locateActivity(runs.map((r) => r.run_id));
          } else {
            selectedRunDateRef.current = runDate;
            locateActivity(runIDsOnDate);
          }
          return;
        }
      }
    };

    svgStat.addEventListener('click', handleClick);

    return () => {
      svgStat?.removeEventListener('click', handleClick);
    };
  }, [year, runs, thisYear, locateActivity]);

  const { theme } = useTheme();

  // === Derived KPIs (all from activities, no streams needed) ===
  const kpis = useMemo(() => {
    const totalDistanceM = activities.reduce((s, a) => s + a.distance, 0);
    const totalRuns = activities.length;
    const longestRun = activities.reduce(
      (best, a) => (a.distance > best.distance ? a : best),
      activities[0] ?? { distance: 0 }
    );
    const thisYearRuns = activities.filter(
      (a) => a.start_date_local.slice(0, 4) === thisYear
    );
    const thisYearKm = thisYearRuns.reduce((s, a) => s + a.distance, 0) / 1000;
    return {
      totalKm: totalDistanceM / 1000,
      totalRuns,
      longestKm: longestRun.distance / 1000,
      thisYear,
      thisYearKm,
    };
  }, [activities, thisYear]);

  // === Year links for sidebar ===
  const yearLinks = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of activities) {
      const y = a.start_date_local.slice(0, 4);
      map[y] = (map[y] ?? 0) + 1;
    }
    return Object.keys(map)
      .sort()
      .reverse()
      .map((y) => ({ year: y, count: map[y] }));
  }, [activities]);

  return (
    <Layout>
      <Helmet>
        <html lang="en" data-theme={theme} />
      </Helmet>
      <div className="w-full space-y-6">
        {/* === Hero === */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 p-6 shadow-lg lg:p-8">
          <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-sky-500/5 blur-3xl" />
          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                <Footprints size={11} />
                Run Archive
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 italic lg:text-5xl">
                <a
                  href={siteUrl}
                  className="bg-gradient-to-br from-zinc-50 to-emerald-400 bg-clip-text text-transparent transition-opacity hover:opacity-80"
                >
                  {siteTitle}
                </a>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-zinc-400">
                Every step logged, every climb earned. Browse the map,
                scan the heatmap, or dive into the full multi-run
                trends dashboard.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 font-mono text-zinc-300">
                <Calendar size={12} className="text-emerald-400" />
                {kpis.totalRuns} runs
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 font-mono text-zinc-300">
                <Flame size={12} className="text-amber-400" />
                {activities[0]?.streak ?? 0}d streak
              </span>
            </div>
          </div>
        </section>

        {/* === KPI tiles === */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <KPITile
            label="Total distance"
            value={`${kpis.totalKm.toFixed(0)} km`}
            sublabel={`across ${kpis.totalRuns} runs`}
            icon={<TrendingUp size={16} />}
            accent="emerald"
          />
          <KPITile
            label="Total runs"
            value={kpis.totalRuns.toString()}
            sublabel={`since ${activities[activities.length - 1]?.start_date_local.slice(0, 4) ?? '—'}`}
            icon={<List size={16} />}
            accent="sky"
          />
          <KPITile
            label={`${kpis.thisYear} YTD`}
            value={`${kpis.thisYearKm.toFixed(0)} km`}
            sublabel="this year so far"
            icon={<Calendar size={16} />}
            accent="amber"
          />
          <KPITile
            label="Longest run"
            value={`${kpis.longestKm.toFixed(1)} km`}
            sublabel="single best effort"
            icon={<Flame size={16} />}
            accent="fuchsia"
          />
        </section>

        {/* === Main grid: 2 columns (main + sidebar) === */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <main className="space-y-6">
            {/* Map card */}
            <section className="overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900/60 shadow-lg backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 lg:px-5">
                <MapPin size={14} className="text-emerald-400" />
                <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
                  {title || `${thisYear} Running Map`}
                </h2>
                <span className="ml-auto rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                  {runs.length} run{runs.length !== 1 ? 's' : ''}
                </span>
              </div>
              <RunMap
                title={title}
                viewState={viewState}
                setViewState={setViewState}
                changeYear={changeYear}
                geoData={animatedGeoData}
                thisYear={thisYear}
                animationTrigger={animationTrigger}
              />
            </section>

            {/* Tabs: Runs / Heatmap / Locations */}
            <Tabs
              tabs={[
                {
                  id: 'runs',
                  label: 'Runs',
                  icon: <List size={12} />,
                  content:
                    year === 'Total' ? (
                      <SVGStat />
                    ) : (
                      <RunTable
                        runs={runs}
                        locateActivity={locateActivity}
                        setActivity={setActivity}
                        runIndex={runIndex}
                        setRunIndex={setRunIndex}
                      />
                    ),
                },
                {
                  id: 'heatmap',
                  label: 'Heatmap',
                  icon: <Grid3x3 size={12} />,
                  content: <SVGStat />,
                },
                {
                  id: 'locations',
                  label: 'Locations',
                  icon: <Globe size={12} />,
                  content: (
                    <LocationStat
                      changeYear={changeYear}
                      changeCity={changeCity}
                      changeTitle={changeTitle}
                    />
                  ),
                },
              ]}
            />
          </main>

          {/* Right rail */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <QuickLinks
              yearLinks={yearLinks}
              onYearSelect={changeYear}
              selectedYear={year}
            />
            <RecentActivity activities={activities} limit={5} />
          </aside>
        </div>

        {/* === Detail modal === */}
        {singleRunId && (
          <>
            <DetailActivity id={singleRunId} />
            <div className="flex items-center justify-center">
              <a
                href={`${siteUrl}detail/${singleRunId}`}
                target="_blank"
                rel="noreferrer"
                className="mt-8 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-8 py-3 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/30"
              >
                Open full detail page →
              </a>
            </div>
            <hr />
          </>
        )}
      </div>
      {/* Enable Audiences in Vercel Analytics: https://vercel.com/docs/concepts/analytics/audiences/quickstart */}
      {import.meta.env.VERCEL && <Analytics />}
    </Layout>
  );
};

export default Index;
