import { useEffect, useState } from 'react';
import { searchMovies, posterUrl } from '../lib/tmdb';
import { useDebounce } from '../hooks/useDebounce';
import type { Movie } from '../types';

interface MovieSearchProps {
  onAdd: (movie: Movie) => void;
  selectedIds: number[];
}

export function MovieSearch({ onAdd, selectedIds }: MovieSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 350);

  useEffect(() => {
    let active = true;
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchMovies(debounced)
      .then((movies) => {
        if (!active) {
          return;
        }
        setResults(movies.slice(0, 6));
        setOpen(true);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [debounced]);

  function handleAdd(movie: Movie) {
    onAdd(movie);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length) {
            setOpen(true);
          }
        }}
        placeholder="Search a movie you liked..."
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted focus:border-green"
      />
      {open && (results.length > 0 || loading) ? (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-xl">
          {loading ? <div className="px-3 py-2 text-sm text-muted">Searching...</div> : null}
          {results.map((movie) => {
            const already = selectedIds.includes(movie.id);
            const poster = posterUrl(movie.poster_path, 'w92');
            const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
            return (
              <button
                key={movie.id}
                type="button"
                disabled={already}
                onClick={() => handleAdd(movie)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-surface2 disabled:opacity-40"
              >
                {poster ? (
                  <img src={poster} alt="" className="h-12 w-8 rounded object-cover" />
                ) : (
                  <div className="h-12 w-8 rounded bg-surface2" />
                )}
                <span className="flex-1 text-sm text-fg">{movie.title}</span>
                <span className="text-xs text-muted">
                  {year}
                  {already ? ' (added)' : ''}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
