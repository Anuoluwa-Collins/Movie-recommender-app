import { REGIONS } from '../lib/regions';

interface RegionSelectorProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function RegionSelector({ selected, onSelect }: RegionSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((region) => {
        const active = selected === region.id;
        return (
          <button
            key={region.id}
            type="button"
            onClick={() => onSelect(active ? null : region.id)}
            aria-pressed={active}
            title={region.description}
            className={
              'rounded-full border px-3 py-1.5 text-sm transition ' +
              (active
                ? 'border-blue bg-blue/15 text-blue'
                : 'border-line text-muted hover:border-fg/40 hover:text-fg')
            }
          >
            {region.label}
          </button>
        );
      })}
    </div>
  );
}
