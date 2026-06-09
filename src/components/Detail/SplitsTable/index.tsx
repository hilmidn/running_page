import { useMemo, useState } from 'react';
import { Table, List, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ActivityStream } from '@/utils/activityAnalytics';
import {
  splitActivityByDistance,
  formatPace,
  secondsToTimeString,
} from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
}

type SortKey = 'index' | 'distanceKm' | 'durationSec' | 'avgPace' | 'avgHR' | 'elevationGain' | 'avgCadence';

interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc';
}

function getPaceColor(pace: number, avgPace: number): string {
  if (avgPace === 0) return 'from-gray-600/40 to-gray-700/30';
  if (pace < avgPace * 0.95) return 'from-green-900/40 to-green-800/20';
  if (pace < avgPace * 1.05) return 'from-yellow-900/30 to-yellow-800/15';
  return 'from-red-900/40 to-red-800/20';
}

function getPaceBorder(pace: number, avgPace: number): string {
  if (avgPace === 0) return 'border-l-gray-600';
  if (pace < avgPace * 0.95) return 'border-l-green-500';
  if (pace < avgPace * 1.05) return 'border-l-yellow-500';
  return 'border-l-red-500';
}

const columns: { key: SortKey; label: string; mobile: boolean }[] = [
  { key: 'index', label: '#', mobile: true },
  { key: 'distanceKm', label: 'Dist (km)', mobile: true },
  { key: 'durationSec', label: 'Time', mobile: false },
  { key: 'avgPace', label: 'Pace', mobile: true },
  { key: 'avgHR', label: 'HR', mobile: false },
  { key: 'elevationGain', label: 'Elev', mobile: false },
  { key: 'avgCadence', label: 'Cad', mobile: false },
];

export default function SplitsTable({ stream }: Props) {
  const segments = useMemo(() => splitActivityByDistance(stream, 1000), [stream]);

  const avgPace = useMemo(() => {
    const paces = segments.map((s) => s.avgPace).filter((p) => p > 0 && isFinite(p));
    return paces.length ? paces.reduce((a, b) => a + b, 0) / paces.length : 0;
  }, [segments]);

  const [sort, setSort] = useState<SortState | null>(null);

  const sortedSegments = useMemo(() => {
    if (!sort) return segments;
    return [...segments].sort((a, b) => {
      const aVal = a[sort.key] ?? 0;
      const bVal = b[sort.key] ?? 0;
      return sort.direction === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [segments, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sort?.key !== columnKey) return <ArrowUpDown size={12} className="inline text-gray-600" />;
    return sort.direction === 'asc'
      ? <ArrowUp size={12} className="inline text-amber-400" />
      : <ArrowDown size={12} className="inline text-amber-400" />;
  };

  const summary = useMemo(() => {
    if (segments.length === 0) return null;
    const totalDist = segments.reduce((s, seg) => s + seg.distanceKm, 0);
    const totalTime = segments.reduce((s, seg) => s + seg.durationSec, 0);
    const avgHrArr = segments.map((s) => s.avgHR).filter((h) => h != null) as number[];
    const avgHr = avgHrArr.length ? Math.round(avgHrArr.reduce((a, b) => a + b, 0) / avgHrArr.length) : null;
    const totalElev = segments.reduce((s, seg) => s + seg.elevationGain, 0);
    const cadArr = segments.map((s) => s.avgCadence).filter((c) => c != null) as number[];
    const avgCad = cadArr.length ? Math.round(cadArr.reduce((a, b) => a + b, 0) / cadArr.length) : null;
    const totalPace = totalTime / totalDist;
    return { totalDist, totalTime, totalPace, avgHr, totalElev, avgCad };
  }, [segments]);

  if (segments.length === 0) {
    return (
      <div className="rounded-xl bg-gray-800/40 p-6 text-center">
        <Table className="mx-auto mb-2 text-gray-500" size={32} />
        <p className="text-sm text-gray-400">No split data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-800/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <List className="text-blue-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Splits</h3>
        <span className="ml-auto text-xs text-gray-500">{segments.length} segments</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`cursor-pointer select-none px-2 py-2 text-left font-medium hover:text-gray-200 ${
                    !col.mobile ? 'hidden sm:table-cell' : ''
                  }`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}{' '}
                  <SortIcon columnKey={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSegments.map((seg) => (
              <tr
                key={seg.index}
                className={`border-b border-gray-700/50 transition-colors hover:bg-gray-700/30 ${
                  avgPace > 0
                    ? `bg-linear-to-r ${getPaceColor(seg.avgPace, avgPace)} border-l-2 ${getPaceBorder(seg.avgPace, avgPace)}`
                    : ''
                }`}
              >
                <td className="px-2 py-2 font-mono text-gray-300">{seg.index + 1}</td>
                <td className="px-2 py-2 font-mono text-gray-300">
                  {seg.distanceKm.toFixed(2)}
                </td>
                <td className="hidden px-2 py-2 font-mono text-gray-300 sm:table-cell">
                  {seg.durationFormatted}
                </td>
                <td className="px-2 py-2 font-mono text-gray-300">
                  {seg.paceFormatted}
                </td>
                <td className="hidden px-2 py-2 font-mono text-gray-300 sm:table-cell">
                  {seg.avgHR ?? '—'}
                </td>
                <td className="hidden px-2 py-2 font-mono text-gray-300 sm:table-cell">
                  <span className="text-green-400">+{seg.elevationGain}</span>
                </td>
                <td className="hidden px-2 py-2 font-mono text-gray-300 sm:table-cell">
                  {seg.avgCadence ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
          {summary && (
            <tfoot>
              <tr className="border-t border-gray-600 font-semibold text-gray-200">
                <td className="px-2 py-2" colSpan={1}>Total</td>
                <td className="px-2 py-2 font-mono">{summary.totalDist.toFixed(2)}</td>
                <td className="hidden px-2 py-2 font-mono sm:table-cell">
                  {secondsToTimeString(summary.totalTime)}
                </td>
                <td className="px-2 py-2 font-mono">{formatPace(summary.totalPace)}</td>
                <td className="hidden px-2 py-2 font-mono sm:table-cell">
                  {summary.avgHr ?? '—'}
                </td>
                <td className="hidden px-2 py-2 font-mono text-green-400 sm:table-cell">
                  +{summary.totalElev}
                </td>
                <td className="hidden px-2 py-2 font-mono sm:table-cell">
                  {summary.avgCad ?? '—'}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
