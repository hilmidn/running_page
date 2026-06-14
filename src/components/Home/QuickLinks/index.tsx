import { Link } from 'react-router-dom';
import { TrendingUp, BarChart3, Globe, Hash } from 'lucide-react';

interface QuickLink {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'sky' | 'amber' | 'fuchsia';
}

const links: QuickLink[] = [
  {
    label: 'Trends',
    description: 'Volume, VO2max, HR zones',
    href: '/trends',
    icon: <TrendingUp size={16} />,
    accent: 'sky',
  },
  {
    label: 'Summary',
    description: 'Yearly overview',
    href: '/summary',
    icon: <BarChart3 size={16} />,
    accent: 'emerald',
  },
  {
    label: 'Locations',
    description: 'Cities & countries',
    href: '#locations',
    icon: <Globe size={16} />,
    accent: 'amber',
  },
];

const ACCENT: Record<
  QuickLink['accent'],
  { text: string; bg: string; hover: string }
> = {
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    hover: 'hover:border-emerald-500/60',
  },
  sky: {
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
    hover: 'hover:border-sky-500/60',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    hover: 'hover:border-amber-500/60',
  },
  fuchsia: {
    text: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    hover: 'hover:border-fuchsia-500/60',
  },
};

interface Props {
  yearLinks: { year: string; count: number }[];
  onYearSelect?: (year: string) => void;
  selectedYear?: string;
}

export default function QuickLinks({
  yearLinks,
  onYearSelect,
  selectedYear,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900/60 shadow-lg backdrop-blur-sm">
        <div className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
          <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
            Quick Links
          </div>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {links.map((l) => {
            const c = ACCENT[l.accent];
            const isHash = l.href.startsWith('#');
            const Wrapper = isHash ? 'a' : Link;
            const wrapperProps = isHash
              ? { href: l.href }
              : { to: l.href };
            return (
              <Wrapper
                key={l.label}
                {...(wrapperProps as any)}
                className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/40`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.text} transition-transform group-hover:scale-110`}
                >
                  {l.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-100">
                    {l.label}
                  </div>
                  <div className="truncate text-[11px] text-zinc-500">
                    {l.description}
                  </div>
                </div>
                <span
                  className={`text-lg ${c.text} opacity-0 transition-opacity group-hover:opacity-100`}
                >
                  →
                </span>
              </Wrapper>
            );
          })}
        </div>
      </div>

      {yearLinks.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900/60 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
            <Hash size={12} className="text-zinc-500" />
            <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              Years
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {yearLinks.map((y) => {
              const isActive = y.year === selectedYear;
              return (
                <button
                  key={y.year}
                  onClick={() => onYearSelect?.(y.year)}
                  className={`group relative overflow-hidden rounded-lg border px-2 py-2 text-left transition-all ${
                    isActive
                      ? 'border-emerald-500/60 bg-emerald-500/20'
                      : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-800/60'
                  }`}
                >
                  <div
                    className={`font-mono text-sm font-bold ${isActive ? 'text-emerald-400' : 'text-zinc-200'}`}
                  >
                    {y.year}
                  </div>
                  <div
                    className={`text-[10px] ${isActive ? 'text-emerald-400/70' : 'text-zinc-500'}`}
                  >
                    {y.count} run{y.count !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
