import { useState, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
}

export default function Tabs({ tabs, defaultTabId, className = '' }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900/60 shadow-lg backdrop-blur-sm ${className}`}
    >
      <div className="flex border-b border-zinc-800 bg-zinc-900/80">
        {tabs.map((t) => {
          const isActive = t.id === active?.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold tracking-wide uppercase transition-colors ${
                isActive
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {t.icon && <span className="shrink-0">{t.icon}</span>}
              {t.label}
            </button>
          );
        })}
      </div>
      <div>{active?.content}</div>
    </div>
  );
}
