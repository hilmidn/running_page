import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Footprints, TrendingUp } from 'lucide-react';
import {
  createCadencePaceScatterData,
  formatPace,
  type CadencePacePoint,
} from '@/utils/activityAnalytics';
import type { ActivityStream } from '@/utils/activityAnalytics';

interface Props {
  stream: ActivityStream;
}

function correlationLabel(r: number): { label: string; color: string } {
  const a = Math.abs(r);
  if (a >= 0.7) return { label: 'Strong', color: '#10b981' };
  if (a >= 0.4) return { label: 'Moderate', color: '#3b82f6' };
  if (a >= 0.2) return { label: 'Weak', color: '#f59e0b' };
  return { label: 'Very weak', color: '#ef4444' };
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: CadencePacePoint = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
      <div className="font-semibold text-amber-400">
        {d.cadence.toFixed(0)} spm
      </div>
      <div className="mt-1 font-mono">{formatPace(d.pace)}/km</div>
      <div className="text-gray-400">@ {d.distanceKm.toFixed(2)} km</div>
      {d.hr != null && (
        <div className="text-gray-400">HR: {d.hr} bpm</div>
      )}
    </div>
  );
}

export default function CadencePaceScatter({ stream }: Props) {
  const data = useMemo(
    () => createCadencePaceScatterData(stream),
    [stream]
  );

  // Empty state — handle the no-data case but keep the card mounted
  if (!data.available) {
    return (
      <div className="bg-linear-to-b space-y-3 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Footprints className="text-amber-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-200">
            Cadence vs Pace
          </h3>
        </div>
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 text-center">
          <p className="text-xs text-gray-500">
            {data.reason ||
              'Cadence vs pace correlation is not available for this run.'}
          </p>
        </div>
      </div>
    );
  }

  const r = data.regression!.pearsonR;
  const corr = correlationLabel(r);
  // Invert Y axis: lower sec/km = faster = top of chart
  const yMin = Math.max(0, data.paceRange.min - 15);
  const yMax = data.paceRange.max + 15;
  const xMin = Math.max(0, data.cadenceRange.min - 3);
  const xMax = data.cadenceRange.max + 3;

  return (
    <div className="bg-linear-to-b space-y-4 rounded-2xl from-gray-900 to-gray-800 p-6 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Footprints className="text-amber-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">
          Cadence vs Pace
        </h3>
        <span className="ml-auto text-xs text-gray-500">
          {data.points.length} samples
        </span>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <ComposedChart
            margin={{ top: 10, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.4}
            />
            <XAxis
              type="number"
              dataKey="cadence"
              domain={[xMin, xMax]}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              label={{
                value: 'Cadence (spm)',
                position: 'insideBottom',
                offset: -2,
                fill: '#9ca3af',
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="pace"
              domain={[yMin, yMax]}
              reversed
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => formatPace(v)}
              label={{
                value: 'Pace (sec/km)',
                angle: -90,
                position: 'insideLeft',
                fill: '#9ca3af',
                fontSize: 11,
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: '#6b7280' }}
            />

            {/* Regression trendline — two points only */}
            <Scatter
              data={[
                {
                  cadence: data.regression!.lineStart.cadence,
                  pace: data.regression!.lineStart.pace,
                },
                {
                  cadence: data.regression!.lineEnd.cadence,
                  pace: data.regression!.lineEnd.pace,
                },
              ]}
              line={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '4 4' }}
              shape={() => <g />}
              legendType="none"
              isAnimationActive={false}
            />

            {/* Actual scatter points */}
            <Scatter
              data={data.points}
              fill="#fbbf24"
              fillOpacity={0.55}
              stroke="#f59e0b"
              strokeOpacity={0.8}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-gray-800/60 p-2">
          <div className="text-[10px] tracking-wider text-gray-500 uppercase">
            Pearson r
          </div>
          <div className="mt-1 font-mono text-base font-semibold text-gray-200">
            {r.toFixed(3)}
          </div>
          <div className="text-[10px] font-medium" style={{ color: corr.color }}>
            {corr.label}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/60 p-2">
          <div className="text-[10px] tracking-wider text-gray-500 uppercase">
            Slope
          </div>
          <div className="mt-1 font-mono text-base font-semibold text-gray-200">
            {data.regression!.slope > 0 ? '+' : ''}
            {data.regression!.slope.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-500">s/km per spm</div>
        </div>
        <div className="rounded-lg bg-gray-800/60 p-2">
          <div className="text-[10px] tracking-wider text-gray-500 uppercase">
            R²
          </div>
          <div className="mt-1 font-mono text-base font-semibold text-gray-200">
            {data.regression!.rSquared.toFixed(3)}
          </div>
          <div className="text-[10px] text-gray-500">variance</div>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-500">
        <TrendingUp size={10} className="mr-1 inline" />
        A negative slope means higher cadence → faster pace. First 60s and
        final 30s excluded to remove warm-up / cooldown skew.
      </p>
    </div>
  );
}
