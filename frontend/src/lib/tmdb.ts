import type { Genre, Movie, MovieDetails } from '../types';

const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;

const cache = new Map<string, unknown>();

interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(API_BASE + path);
  url.searchParams.set('api_key', API_KEY || '');
  for (const key in params) {
    const value = params[key];
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  if (!API_KEY) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.');
  }
  const url = buildUrl(path, params);
  const cached = cache.get(url);
  if (cached) {
    return cached as T;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('TMDB request failed (' + res.status + ')');
  }
  const data = (await res.json()) as T;
  cache.set(url, data);
  return data;
}

export function hasApiKey(): boolean {
  return Boolean(API_KEY);
}

export function posterUrl(path: string | null, size = 'w342'): string | null {
  if (!path) {
    return null;
  }
  return IMG_BASE + '/' + size + path;
}

export async function getGenres(): Promise<Genre[]> {
  const data = await request<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) {
    return [];
  }
  const data = await request<Paged<Movie>>('/search/movie', {
    query,
    include_adult: 'false',
  });
  return data.results;
}

export async function discoverMovies(
  genreIds: number[],
  sortBy = 'popularity.desc',
  page = 1,
): Promise<Movie[]> {
  const data = await request<Paged<Movie>>('/discover/movie', {
    with_genres: genreIds.join(','),
    sort_by: sortBy,
    include_adult: 'false',
    'vote_count.gte': 100,
    page,
  });
  return data.results;
}

export async function getRecommendations(movieId: number): Promise<Movie[]> {
  const data = await request<Paged<Movie>>('/movie/' + movieId + '/recommendations');
  return data.results;
}

export async function getSimilar(movieId: number): Promise<Movie[]> {
  const data = await request<Paged<Movie>>('/movie/' + movieId + '/similar');
  return data.results;
}

export async function getMovie(movieId: number): Promise<MovieDetails> {
  return request<MovieDetails>('/movie/' + movieId);
}
