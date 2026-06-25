import type { Genre } from '../types';

interface GenreSelectorProps {
  genres: Genre[];
  selected: number[];
  onToggle: (id: number) => void;
}

export function GenreSelector({ genres, selected, onToggle }: GenreSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => {
        const active = selected.includes(genre.id);
        return (
          <button
            key={genre.id}
            type="button"
            onClick={() => onToggle(genre.id)}
            aria-pressed={active}
            className={
              'rounded-full border px-3 py-1.5 text-sm transition ' +
              (active
                ? 'border-green bg-green/15 text-green'
                : 'border-line text-muted hover:border-fg/40 hover:text-fg')
            }
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
}
