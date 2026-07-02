import { useEffect, useState } from 'react';
import { getMovie, getRecommendations, posterUrl } from '../lib/tmdb';
import { addFavourite, removeFavourite, getFavourites, addToHistory, isLoggedIn } from '../lib/api';
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
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [watchedDone, setWatchedDone] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDetails(null);
    setRecs([]);
    setIsFav(false);
    setWatchedDone(false);

    const fetches: Promise<unknown>[] = [
      getMovie(movieId),
      getRecommendations(movieId),
    ];
    if (isLoggedIn()) {
      fetches.push(getFavourites());
    }

    Promise.all(fetches).then(([detail, related, favs]) => {
      if (!active) return;
      setDetails(detail as MovieDetails);
      setRecs((related as Movie[]).filter((m) => m.poster_path).slice(0, 8));
      if (favs) {
        const favList = favs as { movie_id: number }[];
        setIsFav(favList.some((f) => f.movie_id === movieId));
      }
    }).finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [movieId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function toggleFavourite() {
    if (!details || favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) {
        await removeFavourite(details.id);
        setIsFav(false);
      } else {
        await addFavourite(details.id, details.title, details.poster_path);
        setIsFav(true);
      }
    } catch { /* silently ignore auth errors */ }
    finally { setFavLoading(false); }
  }

  async function markWatched() {
    if (!details || watchedDone) return;
    try {
      await addToHistory(
        details.id, details.title, details.poster_path,
        details.overview, details.vote_average,
      );
      setWatchedDone(true);
    } catch { /* silently ignore */ }
  }

  const poster = details ? posterUrl(details.poster_path, 'w342') : null;
  const year = details?.release_date ? details.release_date.slice(0, 4) : '';
  const loggedIn = isLoggedIn();

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="my-8 w-full max-w-3xl rounded-2xl border border-line bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
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
              {poster && (
                <img
                  src={poster}
                  alt={details.title}
                  className="h-auto w-40 self-start rounded-xl border border-line"
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-fg">{details.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {year && <span>{year}</span>}
                  {details.runtime && <span>· {details.runtime} min</span>}
                  <span className="text-green">{details.vote_average.toFixed(1)} rating</span>
                </div>
                {details.tagline && (
                  <p className="mt-3 text-sm italic text-muted">{details.tagline}</p>
                )}
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

                {/* Auth-gated actions */}
                {loggedIn && (
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={toggleFavourite}
                      disabled={favLoading}
                      className={
                        'rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-40 ' +
                        (isFav
                          ? 'border-orange bg-orange/10 text-orange hover:bg-orange/20'
                          : 'border-line text-muted hover:border-fg/40 hover:text-fg')
                      }
                    >
                      {isFav ? '★ Saved' : '☆ Save'}
                    </button>
                    <button
                      type="button"
                      onClick={markWatched}
                      disabled={watchedDone}
                      className={
                        'rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-40 ' +
                        (watchedDone
                          ? 'border-green/40 bg-green/10 text-green'
                          : 'border-line text-muted hover:border-fg/40 hover:text-fg')
                      }
                    >
                      {watchedDone ? '✓ Watched' : 'Mark as watched'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {recs.length > 0 && (
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
                          {thumb && (
                            <img
                              src={thumb}
                              alt={movie.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted">{movie.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
