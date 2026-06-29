import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { GenreSelector } from './components/GenreSelector';
import { MoodSelector } from './components/MoodSelector';
import { RegionSelector } from './components/RegionSelector';
import { MovieSearch } from './components/MovieSearch';
import { SeedMovies } from './components/SeedMovies';
import { MovieGrid } from './components/MovieGrid';
import { Spinner } from './components/Spinner';
import { EmptyState } from './components/EmptyState';
import { ChatPanel } from './components/ChatPanel';
import { MovieDetailModal } from './components/MovieDetailModal';
import { useTheme } from './hooks/useTheme';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  getGenres,
  discoverMovies,
  getRecommendations,
  getSimilar,
  searchMovies,
  hasApiKey,
} from './lib/tmdb';
import { getMood } from './lib/moods';
import { getRegion } from './lib/regions';
import { scoreCandidates } from './lib/recommend';
import { parseMessage } from './lib/chat';
import type { ChatMessage, Genre, Movie, ScoredMovie } from './types';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface PipelineParams {
  genreIds: number[];
  seeds: Movie[];
  moodId: string | null;
  regionId: string | null;
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [seedMovies, setSeedMovies] = useState<Movie[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [results, setResults] = useState<ScoredMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const [activeMovieId, setActiveMovieId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('reel-chat', []);
  const [chatBusy, setChatBusy] = useState(false);

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
    setRegion(null);
    setResults([]);
    setTouched(false);
    setError(null);
  }

  const hasInput =
    selectedGenres.length > 0 || seedMovies.length > 0 || mood !== null || region !== null;

  // Shared recommendation pipeline used by both the Recommend button and chat.
  async function buildRecommendations(params: PipelineParams): Promise<ScoredMovie[]> {
    const moodObj = getMood(params.moodId);
    const regionObj = getRegion(params.regionId);
    const relatedCounts = new Map<number, number>();
    const candidates: Movie[] = [];

    for (const seed of params.seeds) {
      const [recs, similar] = await Promise.all([
        getRecommendations(seed.id),
        getSimilar(seed.id),
      ]);
      for (const movie of recs.concat(similar)) {
        relatedCounts.set(movie.id, (relatedCounts.get(movie.id) || 0) + 1);
        candidates.push(movie);
      }
    }

    const genrePool = Array.from(
      new Set(params.genreIds.concat(moodObj ? moodObj.genreIds : [])),
    );
    const originCountries = regionObj ? regionObj.countries : [];

    if (genrePool.length || originCountries.length) {
      const sortBy = moodObj ? moodObj.sortBy : 'popularity.desc';
      const [page1, page2] = await Promise.all([
        discoverMovies(genrePool, sortBy, 1, originCountries),
        discoverMovies(genrePool, sortBy, 2, originCountries),
      ]);
      candidates.push(...page1, ...page2);
    }

    if (!candidates.length) {
      const popular = await discoverMovies([], 'popularity.desc', 1, originCountries);
      candidates.push(...popular);
    }

    return scoreCandidates(
      candidates,
      {
        selectedGenreIds: params.genreIds,
        seedMovies: params.seeds,
        relatedCounts,
        mood: moodObj,
        region: regionObj,
        genreNames,
      },
      25,
    );
  }

  async function recommend() {
    setLoading(true);
    setError(null);
    setTouched(true);
    try {
      const scored = await buildRecommendations({
        genreIds: selectedGenres,
        seeds: seedMovies,
        moodId: mood,
        regionId: region,
      });
      setResults(scored);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function summarise(params: PipelineParams, count: number): string {
    if (!count) {
      return "I couldn't find good matches. Try naming a genre, mood, region, or a movie you liked.";
    }
    const parts: string[] = [];
    const moodObj = getMood(params.moodId);
    const regionObj = getRegion(params.regionId);
    if (moodObj) {
      parts.push('a ' + moodObj.label.toLowerCase() + ' vibe');
    }
    const namedGenres = params.genreIds
      .map((id) => genreNames.get(id))
      .filter((name): name is string => Boolean(name));
    if (namedGenres.length) {
      parts.push(namedGenres.join(', '));
    }
    if (regionObj) {
      parts.push(regionObj.label);
    }
    if (params.seeds.length) {
      parts.push('films like ' + params.seeds.map((s) => s.title).join(', '));
    }
    const lead = 'Here are ' + count + ' picks';
    const tail = '. Tap any card for the synopsis.';
    return parts.length ? lead + ' for ' + parts.join(' + ') + tail : lead + tail;
  }

  async function sendChat(text: string) {
    setChatMessages((prev) => prev.concat({ id: uid(), role: 'user', text }));
    setChatBusy(true);
    try {
      const parsed = parseMessage(text, genres);

      const resolvedSeeds: Movie[] = [];
      for (const title of parsed.seedTitles) {
        const found = await searchMovies(title);
        if (found[0]) {
          resolvedSeeds.push(found[0]);
        }
      }

      const mergedGenres = parsed.genreIds.length ? parsed.genreIds : selectedGenres;
      const mergedMood = parsed.moodId ?? mood;
      const mergedRegion = parsed.regionId ?? region;
      const mergedSeeds = resolvedSeeds.length
        ? Array.from(
            new Map(
              seedMovies.concat(resolvedSeeds).map((m) => [m.id, m] as [number, Movie]),
            ).values(),
          )
        : seedMovies;

      // Reflect what the assistant understood back into the controls.
      setSelectedGenres(mergedGenres);
      setMood(mergedMood);
      setRegion(mergedRegion);
      setSeedMovies(mergedSeeds);

      const params: PipelineParams = {
        genreIds: mergedGenres,
        seeds: mergedSeeds,
        moodId: mergedMood,
        regionId: mergedRegion,
      };
      const scored = await buildRecommendations(params);
      setResults(scored);
      setTouched(true);

      setChatMessages((prev) =>
        prev.concat({
          id: uid(),
          role: 'assistant',
          text: summarise(params, scored.length),
          movies: scored.slice(0, 4),
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setChatMessages((prev) =>
        prev.concat({ id: uid(), role: 'assistant', text: 'Sorry, I hit an error: ' + message }),
      );
    } finally {
      setChatBusy(false);
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
                Region of origin
              </h2>
              <RegionSelector selected={region} onSelect={setRegion} />
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
            {!loading && results.length > 0 ? (
              <MovieGrid movies={results} onSelect={setActiveMovieId} />
            ) : null}
            {!loading && results.length === 0 && touched && !error ? (
              <EmptyState
                title="No matches found"
                hint="Try different genres, another mood, a region, or add a movie you liked."
              />
            ) : null}
            {!loading && !touched ? (
              <EmptyState
                title="Tell us what you are in the mood for"
                hint="Pick a mood, region, or genres, add movies you love, or just chat with Reel."
              />
            ) : null}
          </div>
        </section>
      </main>

      <ChatPanel
        messages={chatMessages}
        busy={chatBusy}
        onSend={sendChat}
        onSelectMovie={setActiveMovieId}
        onClear={() => setChatMessages([])}
      />

      {activeMovieId !== null ? (
        <MovieDetailModal
          movieId={activeMovieId}
          onClose={() => setActiveMovieId(null)}
          onSelectMovie={setActiveMovieId}
        />
      ) : null}
    </div>
  );
}
