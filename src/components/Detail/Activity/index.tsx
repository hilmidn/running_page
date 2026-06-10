import useActivities from '@/hooks/useActivities';
import {
  Activity,
  calculateCalories,
  formatPace,
  titleForRun,
} from '@/utils/utils';
import { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Heart,
  Clock,
  Mountain,
  Footprints,
  Gauge,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import StravaGenerateLayout from '@/components/Layout/StravaGenerateLayout';
import {
  validateStreamData,
  type ActivityStream,
} from '@/utils/activityAnalytics';

interface DetailActivityProps {
  id: number | null | undefined;
  stream?: ActivityStream;
}

const DetailActivity = ({ id, stream }: DetailActivityProps) => {
  const { activities } = useActivities();

  const activity = useMemo<Activity | undefined>(() => {
    return id ? activities.find((x) => x.run_id === id) : undefined;
  }, [activities, id]);

  const [umur, setUmur] = useState(0);

  // Validate stream data completeness
  const dataValidation = useMemo(() => {
    if (!stream) {
      return {
        hasHR: false,
        hasAltitude: false,
        hasCadence: false,
        hasGPS: false,
        dataPoints: 0,
      };
    }
    return validateStreamData(stream);
  }, [stream]);

  useEffect(() => {
    const tanggalLahir = new Date('1997-01-01');
    const hariIni = new Date();

    let usia = hariIni.getFullYear() - tanggalLahir.getFullYear();
    const bulan = hariIni.getMonth() - tanggalLahir.getMonth();
    const hari = hariIni.getDate() - tanggalLahir.getDate();
    if (bulan < 0 || (bulan === 0 && hari < 0)) usia--;
    setUmur(usia);
  }, []);

  const calories = useMemo(() => {
    if (!activity)
      return { calories: 0, hrMax: 0, hrPercent: 0, effortLabel: '-' };

    return calculateCalories(
      activity.average_heartrate ?? 0,
      69,
      umur,
      'male',
      activity.moving_time,
      activity.distance
    );
  }, [activity, umur]);

  const distanceKm = activity ? (activity.distance ?? 0) / 1000 : 0;
  const avgHR = activity?.average_heartrate?.toFixed(0) ?? '-';
  const elevation = activity?.elevation_gain?.toFixed(0) ?? '0';
  const pace = activity?.average_speed
    ? formatPace(activity.average_speed)
    : '-';
  const movingTime = activity?.moving_time ?? '-';

  // Effort color logic (aligned with Strava-like HR zones)
  const effortColor =
    calories.hrPercent > 97
      ? 'bg-red-600'
      : calories.hrPercent > 89
        ? 'bg-red-500'
        : calories.hrPercent > 82
          ? 'bg-orange-500'
          : calories.hrPercent > 65
            ? 'bg-yellow-500'
            : 'bg-green-500';

  return (
    <div className="bg-linear-to-b mx-auto max-w-md space-y-4 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      <h2 className="mb-4 text-center text-xl font-bold">
        {titleForRun(activity) || 'Detail Aktivitas'}
      </h2>

      {/* Data Completeness Badges */}
      <div className="flex flex-wrap justify-center gap-2">
        {/* HR Badge */}
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            dataValidation.hasHR
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-600/30 text-gray-400'
          }`}
        >
          {dataValidation.hasHR ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          HR
        </div>

        {/* GPS Badge */}
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            dataValidation.hasGPS
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-600/30 text-gray-400'
          }`}
        >
          {dataValidation.hasGPS ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          GPS
        </div>

        {/* Altitude Badge */}
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            dataValidation.hasAltitude
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-600/30 text-gray-400'
          }`}
        >
          {dataValidation.hasAltitude ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          Altitude
        </div>

        {/* Cadence Badge */}
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            dataValidation.hasCadence
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-600/30 text-gray-400'
          }`}
        >
          {dataValidation.hasCadence ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          Cadence
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="rounded-xl bg-gray-800/70 p-3">
          <Footprints className="mx-auto mb-1 opacity-80" />
          <div className="text-2xl font-semibold">{distanceKm.toFixed(2)}</div>
          <div className="text-sm text-gray-400">Kilometer</div>
        </div>
        <div className="rounded-xl bg-gray-800/70 p-3">
          <Clock className="mx-auto mb-1 opacity-80" />
          <div className="text-2xl font-semibold">{movingTime}</div>
          <div className="text-sm text-gray-400">Durasi</div>
        </div>
        <div className="rounded-xl bg-gray-800/70 p-3">
          <Heart className="mx-auto mb-1 text-red-400 opacity-80" />
          <div className="text-2xl font-semibold">{avgHR}</div>
          <div className="text-sm text-gray-400">Avg HR</div>
        </div>
        <div className="rounded-xl bg-gray-800/70 p-3">
          <Mountain className="mx-auto mb-1 text-amber-400 opacity-80" />
          <div className="text-2xl font-semibold">{elevation}</div>
          <div className="text-sm text-gray-400">Elev Gain (m)</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="space-y-2 rounded-xl bg-gray-800/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="text-orange-400" />
            <span>Calories</span>
          </div>
          <span className="font-semibold">{calories.calories} kcal</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="text-yellow-400" />
            <span>Effort</span>
          </div>
          <span className="font-semibold">{calories.effortLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>HR Max</span>
          <span className="font-semibold">{calories.hrMax} bpm</span>
        </div>
        <div className="flex items-center justify-between">
          <span>HR Percent</span>
          <span className="font-semibold">
            {calories.hrPercent.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Pace</span>
          <span className="font-semibold">{pace}</span>
        </div>
      </div>

      {/* Effort Bar */}
      <div className="mt-4">
        <div className="mb-1 text-sm text-gray-400">
          Effort Intensity ({calories.hrPercent.toFixed(0)}%)
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className={`h-full ${effortColor} transition-all duration-500`}
            style={{ width: `${Math.min(calories.hrPercent, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* <StravaGenerateLayout
        data={{
          distance: 0,
          pace: '',
          calories: 0,
          time: '',
          elevation: 0,
          hrAvg: 0,
        }}
      /> */}
    </div>
  );
};

export default DetailActivity;
