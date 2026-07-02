/**
 * Auth API client — talks to the backend /auth/* endpoints.
 * The JWT is kept in memory only (not localStorage) to avoid XSS exposure.
 * We export getToken() so other fetch calls can attach the Authorization header.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

let _token: string | null = null;

export function getToken(): string | null {
  return _token;
}

export function isLoggedIn(): boolean {
  return _token !== null;
}

export function clearToken(): void {
  _token = null;
}

async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }
  // 204 No Content — return empty object
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface UserOut {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<UserOut> {
  return authRequest<UserOut>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login(emailOrUsername: string, password: string): Promise<UserOut> {
  // FastAPI's OAuth2PasswordRequestForm expects form-encoded data
  const form = new URLSearchParams({ username: emailOrUsername, password });
  const res = await fetch(API_BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? 'Login failed');
  }
  const { access_token } = await res.json();
  _token = access_token;
  return authRequest<UserOut>('/auth/me');
}

export async function logout(): Promise<void> {
  clearToken();
}

export async function getMe(): Promise<UserOut> {
  return authRequest<UserOut>('/auth/me');
}

// ── Favourites ────────────────────────────────────────────────────────────────

export interface FavouriteOut {
  id: number;
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  added_at: string;
}

export async function getFavourites(): Promise<FavouriteOut[]> {
  return authRequest<FavouriteOut[]>('/favourites/');
}

export async function addFavourite(
  movieId: number,
  movieTitle: string,
  posterPath: string | null,
): Promise<FavouriteOut> {
  return authRequest<FavouriteOut>('/favourites/', {
    method: 'POST',
    body: JSON.stringify({ movie_id: movieId, movie_title: movieTitle, poster_path: posterPath }),
  });
}

export async function removeFavourite(movieId: number): Promise<void> {
  return authRequest<void>(`/favourites/${movieId}`, { method: 'DELETE' });
}

// ── Watch history ─────────────────────────────────────────────────────────────

export interface WatchHistoryOut {
  id: number;
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  overview: string | null;
  vote_average: number | null;
  watched_at: string;
}

export async function getHistory(): Promise<WatchHistoryOut[]> {
  return authRequest<WatchHistoryOut[]>('/history/');
}

export async function addToHistory(
  movieId: number,
  movieTitle: string,
  posterPath: string | null,
  overview: string | null,
  voteAverage: number | null,
): Promise<WatchHistoryOut> {
  return authRequest<WatchHistoryOut>('/history/', {
    method: 'POST',
    body: JSON.stringify({
      movie_id: movieId,
      movie_title: movieTitle,
      poster_path: posterPath,
      overview,
      vote_average: voteAverage,
    }),
  });
}

export async function clearHistory(): Promise<void> {
  return authRequest<void>('/history/', { method: 'DELETE' });
}
