import type { ReactNode } from "react";

export type SegmentedTabItem<T extends string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  items: SegmentedTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
};

/**
 * Shared brass underline tabs — Results + Student profile.
 * 8pt rhythm: px-3 py-2, gap via border-b track.
 */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel = "Sections",
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1 border-b border-brass-dim"
    >
      {items.map(({ id, label }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={[
              "intended-tab px-3 py-2 text-xs font-medium tracking-wide transition-colors",
              active
                ? "border-b-2 border-brass text-brass"
                : "border-b-2 border-transparent text-ink-muted hover:text-brass",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedTabPanel({
  active,
  children,
  className = "",
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (!active) return null;
  return (
    <div role="tabpanel" className={`min-w-0 pt-4 ${className}`}>
      {children}
    </div>
  );
}
