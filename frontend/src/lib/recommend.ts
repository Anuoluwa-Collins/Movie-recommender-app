import type { Movie, ScoredMovie } from '../types';
import type { Mood } from './moods';
import type { Region } from './regions';

export interface ScoreContext {
  selectedGenreIds: number[];
  seedMovies: Movie[];
  /** candidate movie id -> how many seed movies surfaced it as related */
  relatedCounts: Map<number, number>;
  mood?: Mood;
  region?: Region;
  genreNames: Map<number, string>;
}

const WEIGHTS = {
  genre: 3,
  related: 5,
  mood: 2.5,
  region: 1.2,
  quality: 2,
  recency: 0.6,
};

function uniqueBy<T>(items: T[], key: (item: T) => number): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/**
 * Builds a weighted map of genre id -> affinity from the user's explicit
 * genre picks (heavier) and the genres of the movies they seeded (lighter).
 */
function genreAffinity(seedMovies: Movie[], selectedGenreIds: number[]): Map<number, number> {
  const weights = new Map<number, number>();
  for (const id of selectedGenreIds) {
    weights.set(id, (weights.get(id) || 0) + 2);
  }
  for (const movie of seedMovies) {
    for (const id of movie.genre_ids) {
      weights.set(id, (weights.get(id) || 0) + 1);
    }
  }
  return weights;
}

/**
 * Pure ranking function. Combines genre affinity, relatedness to seed movies,
 * mood fit, region fit, quality (rating weighted by vote-count confidence) and
 * a small recency bonus into a single score, returning the top results with
 * human-readable reasons.
 */
export function scoreCandidates(candidates: Movie[], ctx: ScoreContext, limit = 24): ScoredMovie[] {
  const seedIds = new Set(ctx.seedMovies.map((m) => m.id));
  const affinity = genreAffinity(ctx.seedMovies, ctx.selectedGenreIds);
  const moodSet = new Set<number>(ctx.mood ? ctx.mood.genreIds : []);
  const regionLangs = new Set<string>(ctx.region ? ctx.region.languages : []);
  const maxAffinity = Math.max(1, ...Array.from(affinity.values()));
  const currentYear = new Date().getFullYear();

  const pool = uniqueBy(candidates, (m) => m.id).filter(
    (m) => !seedIds.has(m.id) && Boolean(m.poster_path),
  );

  const scored: ScoredMovie[] = pool.map((movie) => {
    const reasons: string[] = [];

    // 1. Genre affinity
    let genreHit = 0;
    const matchedGenres: string[] = [];
    for (const gid of movie.genre_ids) {
      const weight = affinity.get(gid);
      if (weight) {
        genreHit += weight;
        const name = ctx.genreNames.get(gid);
        if (name && matchedGenres.length < 2) {
          matchedGenres.push(name);
        }
      }
    }
    const genreScore = (genreHit / (maxAffinity * 2)) * WEIGHTS.genre;
    if (matchedGenres.length) {
      reasons.push('Matches ' + matchedGenres.join(' & '));
    }

    // 2. Relatedness to seed movies
    const relCount = ctx.relatedCounts.get(movie.id) || 0;
    const relatedScore =
      relCount > 0
        ? Math.min(1, relCount / Math.max(1, ctx.seedMovies.length)) * WEIGHTS.related
        : 0;
    if (relCount > 0) {
      reasons.push(relCount > 1 ? 'Similar to several of your picks' : 'Similar to your picks');
    }

    // 3. Mood fit
    let moodScore = 0;
    if (ctx.mood) {
      let moodHit = 0;
      for (const gid of movie.genre_ids) {
        if (moodSet.has(gid)) {
          moodHit += 1;
        }
      }
      const ratingFactor = movie.vote_average >= ctx.mood.minRating ? 1 : 0.4;
      moodScore = (moodHit > 0 ? Math.min(1, moodHit / 2) : 0) * ratingFactor * WEIGHTS.mood;
      if (moodHit > 0) {
        reasons.push('Fits a ' + ctx.mood.label.toLowerCase() + ' mood');
      }
    }

    // 4. Region fit (origin is enforced upstream; this reinforces via language)
    let regionScore = 0;
    if (ctx.region && regionLangs.has(movie.original_language)) {
      regionScore = WEIGHTS.region;
      reasons.push(ctx.region.label + ' cinema');
    }

    // 5. Quality: rating scaled by how confident we are in it (vote count)
    const confidence = Math.min(1, Math.log10(movie.vote_count + 1) / 4);
    const qualityScore = (movie.vote_average / 10) * confidence * WEIGHTS.quality;

    // 6. Recency: a gentle nudge toward newer films
    const year = movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0;
    const recencyScore = year
      ? Math.max(0, 1 - (currentYear - year) / 60) * WEIGHTS.recency
      : 0;

    const score = genreScore + relatedScore + moodScore + regionScore + qualityScore + recencyScore;

    return { ...movie, score, reasons: reasons.slice(0, 3) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
