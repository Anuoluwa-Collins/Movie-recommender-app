import { useState } from "react";
import type { AuthView } from "../hooks/useAuth";

interface AuthModalProps {
  view: AuthView;
  onSwitchView: (v: AuthView) => void;
  onLogin: (emailOrUsername: string, password: string) => Promise<boolean>;
  onRegister: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  onClose: () => void;
  error: string | null;
  loading: boolean;
}

export function AuthModal({
  view,
  onSwitchView,
  onLogin,
  onRegister,
  onClose,
  error,
  loading,
}: AuthModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok =
      view === "login"
        ? await onLogin(email, password)
        : await onRegister(username, email, password);
    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-bg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex rounded-lg border border-line p-1">
          {(["login", "register"] as AuthView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onSwitchView(v)}
              className={
                "flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition " +
                (view === v ? "bg-green text-bg" : "text-muted hover:text-fg")
              }
            >
              {v === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === "register" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                autoComplete="username"
                placeholder="yourname"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted focus:border-green"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              {view === "login" ? "Email or username" : "Email"}
            </label>
            <input
              type={view === "register" ? "email" : "text"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              autoComplete={view === "login" ? "username" : "email"}
              placeholder={
                view === "login" ? "email or username" : "you@example.com"
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted focus:border-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              autoComplete={
                view === "login" ? "current-password" : "new-password"
              }
              placeholder="••••••••"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted focus:border-green"
            />
            {view === "register" && (
              <p className="mt-1 text-xs text-muted">
                At least 8 characters, with upper, lower and a number.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-orange/40 bg-orange/10 px-3 py-2 text-xs text-orange">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
          >
            {loading
              ? "Please wait…"
              : view === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
