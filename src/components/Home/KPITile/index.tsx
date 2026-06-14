import type { ReactNode } from 'react';

export type KPIAccent =
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'fuchsia'
  | 'cyan'
  | 'lime';

const ACCENT_CLASSES: Record<
  KPIAccent,
  { text: string; bg: string; border: string; gradient: string }
> = {
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500/10 to-transparent',
  },
  sky: {
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    gradient: 'from-sky-500/10 to-transparent',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500/10 to-transparent',
  },
  fuchsia: {
    text: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    gradient: 'from-fuchsia-500/10 to-transparent',
  },
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    gradient: 'from-cyan-500/10 to-transparent',
  },
  lime: {
    text: 'text-lime-400',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/30',
    gradient: 'from-lime-500/10 to-transparent',
  },
};

interface KPITileProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: ReactNode;
  accent: KPIAccent;
}

export default function KPITile({
  label,
  value,
  sublabel,
  icon,
  accent,
}: KPITileProps) {
  const c = ACCENT_CLASSES[accent];
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-b ${c.gradient} bg-zinc-900/60 p-4 backdrop-blur-sm transition-all hover:bg-zinc-900/80`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
            {label}
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-zinc-100">
            {value}
          </div>
          {sublabel && (
            <div className="mt-0.5 text-[10px] text-zinc-500">
              {sublabel}
            </div>
          )}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.text} transition-transform group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
