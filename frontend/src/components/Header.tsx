import type { ThemeMode } from '../types';
import type { User } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Header({ theme, onToggleTheme, user, onOpenAuth, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-green" />
            <span className="h-3 w-3 rounded-full bg-blue" />
            <span className="h-3 w-3 rounded-full bg-orange" />
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-fg">Reel</h1>
          <span className="hidden text-sm text-muted sm:inline">recommendations</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-fg transition hover:bg-surface"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? 'Light' : 'Dark'} mode
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted sm:inline">
                Hi, <span className="font-medium text-fg">{user.username}</span>
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:text-fg"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="rounded-lg bg-green px-3 py-1.5 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
