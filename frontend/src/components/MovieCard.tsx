import { posterUrl } from '../lib/tmdb';
import type { ScoredMovie } from '../types';

interface MovieCardProps {
  movie: ScoredMovie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const poster = posterUrl(movie.poster_path, 'w342');
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
  return (
    <div className="group overflow-hidden rounded-xl border border-line bg-surface transition hover:border-fg/30">
      <div className="relative aspect-[2/3] bg-surface2">
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : null}
        <span className="absolute right-2 top-2 rounded-md bg-bg/80 px-1.5 py-0.5 text-xs font-semibold text-green backdrop-blur">
          {movie.vote_average.toFixed(1)}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-sm font-medium text-fg" title={movie.title}>
            {movie.title}
          </h3>
          <span className="shrink-0 text-xs text-muted">{year}</span>
        </div>
        {movie.reasons.length ? (
          <ul className="mt-2 space-y-0.5">
            {movie.reasons.map((reason, index) => (
              <li key={index} className="text-xs text-muted">
                - {reason}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
