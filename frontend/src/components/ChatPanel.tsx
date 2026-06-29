import { useEffect, useRef, useState } from 'react';
import { posterUrl } from '../lib/tmdb';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (text: string) => void;
  onSelectMovie: (id: number) => void;
  onClear: () => void;
}

export function ChatPanel({ messages, busy, onSend, onSelectMovie, onClear }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, busy]);

  function submit() {
    const text = input.trim();
    if (!text || busy) {
      return;
    }
    onSend(text);
    setInput('');
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 rounded-full bg-green px-5 py-3 text-sm font-semibold text-bg shadow-lg transition hover:opacity-90"
      >
        Chat with Reel
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-30 flex h-[70vh] max-h-[640px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
          <span className="text-sm font-semibold text-fg">Reel assistant</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted transition hover:text-orange"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-muted transition hover:text-fg"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">
            Tell me what you feel like watching. Try "cozy Korean movies" or "something like
            Inception but funnier".
          </p>
        ) : null}
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={
                'inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ' +
                (message.role === 'user' ? 'bg-green/15 text-fg' : 'bg-surface text-fg')
              }
            >
              {message.text}
            </div>
            {message.movies && message.movies.length ? (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {message.movies.map((movie) => {
                  const thumb = posterUrl(movie.poster_path, 'w185');
                  return (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => onSelectMovie(movie.id)}
                      className="w-20 shrink-0 text-left"
                    >
                      <div className="aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface2">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={movie.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-[11px] text-muted">{movie.title}</p>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
        {busy ? <p className="text-sm text-muted">Thinking...</p> : null}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submit();
              }
            }}
            placeholder="Ask for a recommendation..."
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted focus:border-green"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-green px-3 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
