import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { GenreSelector } from './components/GenreSelector';
import { MoodSelector } from './components/MoodSelector';
import { MovieSearch } from './components/MovieSearch';
import { SeedMovies } from './components/SeedMovies';
import { MovieGrid } from './components/MovieGrid';
import { Spinner } from './components/Spinner';
import { EmptyState } from './components/EmptyState';
import { useTheme } from './hooks/useTheme';
import {
  getGenres,
  discoverMovies,
  getRecommendations,
  getSimilar,
  hasApiKey,
} from './lib/tmdb';
import { getMood } from './lib/moods';
import { scoreCandidates } from './lib/recommend';
import type { Genre, Movie, ScoredMovie } from './types';

export default function App() {
  const { theme, toggle } = useTheme();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [seedMovies, setSeedMovies] = useState<Movie[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [results, setResults] = useState<ScoredMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const genreNames = useMemo(() => {
    const map = new Map<number, string>();
    genres.forEach((genre) => map.set(genre.id, genre.name));
    return map;
  }, [genres]);

  useEffect(() => {
    if (!hasApiKey()) {
      return;
    }
    getGenres()
      .then(setGenres)
      .catch(() => setError('Could not load genres. Check your TMDB API key.'));
  }, []);

  function toggleGenre(id: number) {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : prev.concat(id),
    );
  }

  function addSeed(movie: Movie) {
    setSeedMovies((prev) => (prev.some((m) => m.id === movie.id) ? prev : prev.concat(movie)));
  }

  function removeSeed(id: number) {
    setSeedMovies((prev) => prev.filter((m) => m.id !== id));
  }

  function reset() {
    setSelectedGenres([]);
    setSeedMovies([]);
    setMood(null);
    setResults([]);
    setTouched(false);
    setError(null);
  }

  const hasInput = selectedGenres.length > 0 || seedMovies.length > 0 || mood !== null;

  async function recommend() {
    setLoading(true);
    setError(null);
    setTouched(true);
    try {
      const moodObj = getMood(mood);
      const relatedCounts = new Map<number, number>();
      const candidates: Movie[] = [];

      // Pull TMDB's own "recommended" + "similar" lists for each seed movie.
      for (const seed of seedMovies) {
        const [recs, similar] = await Promise.all([
          getRecommendations(seed.id),
          getSimilar(seed.id),
        ]);
        for (const movie of recs.concat(similar)) {
          relatedCounts.set(movie.id, (relatedCounts.get(movie.id) || 0) + 1);
          candidates.push(movie);
        }
      }

      // Discover by the union of chosen genres and the active mood's genres.
      const genrePool = Array.from(new Set(selectedGenres.concat(moodObj ? moodObj.genreIds : [])));
      if (genrePool.length) {
        const sortBy = moodObj ? moodObj.sortBy : 'popularity.desc';
        const [page1, page2] = await Promise.all([
          discoverMovies(genrePool, sortBy, 1),
          discoverMovies(genrePool, sortBy, 2),
        ]);
        candidates.push(...page1, ...page2);
      }

      // Fallback so the user always gets something back.
      if (!candidates.length) {
        const popular = await discoverMovies([], 'popularity.desc', 1);
        candidates.push(...popular);
      }

      const scored = scoreCandidates(
        candidates,
        {
          selectedGenreIds: selectedGenres,
          seedMovies,
          relatedCounts,
          mood: moodObj,
          genreNames,
        },
        25,
      );
      setResults(scored);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  if (!hasApiKey()) {
    return (
      <div className="min-h-screen bg-bg text-fg">
        <Header theme={theme} onToggleTheme={toggle} />
        <main className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-lg font-semibold">Add your TMDB API key</h2>
            <p className="mt-2 text-sm text-muted">
              Create a file named .env in the project root containing:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-surface2 p-3 text-xs text-fg">
              VITE_TMDB_API_KEY=your_key_here
            </pre>
            <p className="mt-3 text-sm text-muted">
              Get a free key at themoviedb.org under Settings, API (v3). Then restart the dev server.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Header theme={theme} onToggleTheme={toggle} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                Movies you liked
              </h2>
              <MovieSearch onAdd={addSeed} selectedIds={seedMovies.map((m) => m.id)} />
              <div className="mt-3">
                <SeedMovies movies={seedMovies} onRemove={removeSeed} />
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Mood</h2>
              <MoodSelector selected={mood} onSelect={setMood} />
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                Genres
              </h2>
              <GenreSelector genres={genres} selected={selectedGenres} onToggle={toggleGenre} />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={recommend}
                disabled={!hasInput || loading}
                className="flex-1 rounded-lg bg-green px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Finding...' : 'Recommend movies'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition hover:text-fg"
              >
                Reset
              </button>
            </div>
          </div>

          <div>
            {error ? (
              <div className="mb-4 rounded-lg border border-orange/40 bg-orange/10 px-4 py-3 text-sm text-orange">
                {error}
              </div>
            ) : null}
            {loading ? <Spinner label="Scoring the best matches for you" /> : null}
            {!loading && results.length > 0 ? <MovieGrid movies={results} /> : null}
            {!loading && results.length === 0 && touched && !error ? (
              <EmptyState
                title="No matches found"
                hint="Try different genres, another mood, or add a movie you liked."
              />
            ) : null}
            {!loading && !touched ? (
              <EmptyState
                title="Tell us what you are in the mood for"
                hint="Pick a mood, add movies you love, or choose genres, then hit Recommend."
              />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
