import { MOODS } from '../lib/moods';

interface MoodSelectorProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {MOODS.map((mood) => {
        const active = selected === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            onClick={() => onSelect(active ? null : mood.id)}
            aria-pressed={active}
            className={
              'rounded-xl border p-3 text-left transition ' +
              (active ? 'border-orange bg-orange/10' : 'border-line hover:border-fg/30')
            }
          >
            <div className={'text-sm font-medium ' + (active ? 'text-orange' : 'text-fg')}>
              {mood.label}
            </div>
            <div className="mt-0.5 text-xs text-muted">{mood.description}</div>
          </button>
        );
      })}
    </div>
  );
}
