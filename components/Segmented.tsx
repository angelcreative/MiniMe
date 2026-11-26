import React from 'react';

interface Option<T extends string> {
  id: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Pill toggle group: the selected option sits on a raised surface. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className = '',
}: SegmentedProps<T>) {
  const h = size === 'sm' ? 'h-control-sm px-2' : 'h-control px-4';
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex p-1 gap-1 rounded-full bg-subtle ${className}`}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className={`ctl touch flex-1 rounded-full text-label font-medium ${h} ${
              active ? 'bg-surface text-text shadow-sm' : 'text-muted'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
