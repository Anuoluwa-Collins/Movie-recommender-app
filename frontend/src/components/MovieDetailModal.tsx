import { useEffect, useState } from 'react';
import { getMovie, getRecommendations, posterUrl } from '../lib/tmdb';
import type { Movie, MovieDetails } from '../types';

interface MovieDetailModalProps {
  movieId: number;
  onClose: () => void;
  onSelectMovie: (id: number) => void;
}

export function MovieDetailModal({ movieId, onClose, onSelectMovie }: MovieDetailModalProps) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [recs, setRecs] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDetails(null);
    setRecs([]);
    Promise.all([getMovie(movieId), getRecommendations(movieId)])
      .then(([detail, related]) => {
        if (!active) {
          return;
        }
        setDetails(detail);
        setRecs(related.filter((movie) => movie.poster_path).slice(0, 8));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [movieId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const poster = details ? posterUrl(details.poster_path, 'w342') : null;
  const year = details && details.release_date ? details.release_date.slice(0, 4) : '';

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="my-8 w-full max-w-3xl rounded-2xl border border-line bg-bg shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-3 py-1 text-sm text-muted transition hover:text-fg"
          >
            Close
          </button>
        </div>

        {loading || !details ? (
          <div className="flex items-center justify-center py-20 text-muted">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        ) : (
          <div className="px-5 pb-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              {poster ? (
                <img
                  src={poster}
                  alt={details.title}
                  className="h-auto w-40 self-start rounded-xl border border-line"
                />
              ) : null}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-fg">{details.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {year ? <span>{year}</span> : null}
                  {details.runtime ? <span>- {details.runtime} min</span> : null}
                  <span className="text-green">{details.vote_average.toFixed(1)} rating</span>
                </div>
                {details.tagline ? (
                  <p className="mt-3 text-sm italic text-muted">{details.tagline}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {details.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-fg">
                  {details.overview || 'No synopsis available.'}
                </p>
              </div>
            </div>

            {recs.length ? (
              <div className="mt-8">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                  More like this
                </h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {recs.map((movie) => {
                    const thumb = posterUrl(movie.poster_path, 'w185');
                    return (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => onSelectMovie(movie.id)}
                        className="group text-left"
                      >
                        <div className="aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface2">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={movie.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted">{movie.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
