import type { Movie } from '../types';

interface SeedMoviesProps {
  movies: Movie[];
  onRemove: (id: number) => void;
}

export function SeedMovies({ movies, onRemove }: SeedMoviesProps) {
  if (!movies.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {movies.map((movie) => (
        <span
          key={movie.id}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-fg"
        >
          {movie.title}
          <button
            type="button"
            onClick={() => onRemove(movie.id)}
            className="text-muted transition hover:text-orange"
            aria-label={'Remove ' + movie.title}
          >
            x
          </button>
        </span>
      ))}
    </div>
  );
}
