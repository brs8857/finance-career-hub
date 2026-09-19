"use client";

/** A row of toggle buttons (e.g. 1D / 1W / 1M / 1Y). Keyboard: Tab + Enter/Space. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = [],
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: readonly T[];
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-border bg-surface-2 p-0.5">
      {options.map((option) => {
        const isDisabled = disabled.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            disabled={isDisabled}
            onClick={() => onChange(option)}
            className={`num rounded px-3 py-1 text-xs font-medium ${
              value === option ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
