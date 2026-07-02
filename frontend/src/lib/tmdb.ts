import type { Genre, Movie, MovieDetails } from '../types';

// All movie data now comes from our backend proxy — the TMDB key never leaves the server.
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';
const IMG_BASE = 'https://image.tmdb.org/t/p';

const cache = new Map<string, unknown>();

interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

async function request<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(API_BASE + path);
  for (const key in params) {
    const value = params[key];
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached) return cached as T;

  const res = await fetch(url.toString());
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `Request failed (${res.status})`);
  }
  const data = (await res.json()) as T;
  cache.set(cacheKey, data);
  return data;
}

// Always ready — API key is server-side now
export function hasApiKey(): boolean {
  return true;
}

export function posterUrl(path: string | null, size = 'w342'): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

export async function getGenres(): Promise<Genre[]> {
  const data = await request<{ genres: Genre[] }>('/tmdb/genres');
  return data.genres;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  const data = await request<Paged<Movie>>('/tmdb/search', { q: query });
  return data.results;
}

export async function discoverMovies(
  genreIds: number[],
  sortBy = 'popularity.desc',
  page = 1,
  originCountries: string[] = [],
): Promise<Movie[]> {
  const data = await request<Paged<Movie>>('/tmdb/discover', {
    with_genres: genreIds.join(','),
    with_origin_country: originCountries.join('|'),
    sort_by: sortBy,
    'vote_count.gte': originCountries.length ? 20 : 100,
    page,
  });
  return data.results;
}

export async function getRecommendations(movieId: number): Promise<Movie[]> {
  const data = await request<Paged<Movie>>(`/tmdb/movie/${movieId}/recommendations`);
  return data.results;
}

export async function getSimilar(movieId: number): Promise<Movie[]> {
  const data = await request<Paged<Movie>>(`/tmdb/movie/${movieId}/similar`);
  return data.results;
}

export async function getMovie(movieId: number): Promise<MovieDetails> {
  return request<MovieDetails>(`/tmdb/movie/${movieId}`);
}
