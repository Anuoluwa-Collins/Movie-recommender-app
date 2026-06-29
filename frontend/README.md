# Reel — Movie Recommendations

A Letterboxd-inspired movie recommender built with React, TypeScript, Vite and Tailwind CSS. It blends genres, movies you love, your mood, and a film's region of origin into a single client-side scoring engine and ranks the best matches for you. It also ships with a persistent chat assistant and clickable detail views. Light and dark themes are both included.

## Features

- Genre, mood, and region-of-origin filters (Hollywood, Bollywood, Nollywood, African, Asian, Korean, Japanese, European, Latin American).
- "Similar to movies I have seen": search and add seed films, and the app pulls TMDB recommendations and similar titles for each.
- A chat assistant: ask in plain language ("cozy Korean movies", "something like Inception but funnier"). It parses your intent, updates the filters, fills the grid, and replies with its own picks. The conversation persists across reloads.
- Clickable cards: open any film to read the synopsis, runtime, genres and rating, plus a "More like this" grid you can keep exploring.
- A transparent, weighted scoring engine that explains why each film was suggested.
- Letterboxd-style palette with one-click light/dark mode that remembers your choice.

## Getting started

1. Install dependencies:

       npm install

2. Add your TMDB API key. Copy .env.example to .env and set your key:

       VITE_TMDB_API_KEY=your_key_here

   Get a free key from https://www.themoviedb.org under Settings, API (use the v3 API key).

3. Run the dev server:

       npm run dev

4. Type-check and build for production:

       npm run build

## How recommendations work

The scoring engine in src/lib/recommend.ts is a pure, testable function. For each candidate movie it computes genre affinity, relatedness to your seed movies, mood fit, region fit (by original language), quality (rating scaled by vote-count confidence) and a small recency bonus. These are combined with tunable weights (see WEIGHTS), sorted, and the top results are returned with reasons shown on each card.

The chat assistant (src/lib/chat.ts) is a lightweight, on-device intent parser: it maps your message to genres, a mood, a region, and any "movies like X" seeds, then runs the exact same pipeline as the manual controls. No extra API key is required. If you would rather route chat through a hosted LLM, replace parseMessage with a call to your endpoint and keep the rest of the flow.

## Region filtering

Regions map to TMDB origin-country codes (with_origin_country, OR-joined) so results actually come from those film industries, with a soft scoring bonus by original language. See src/lib/regions.ts to tune the country and language lists.

## Project structure

    src/lib          TMDB client, moods, regions, scoring engine, chat parser
    src/hooks        theme, debounce, and localStorage hooks
    src/components   UI building blocks (selectors, cards, chat, detail modal)
    src/App.tsx      composition, shared recommendation pipeline, state
    src/types.ts     shared TypeScript types

## Notes

- API responses are cached in memory for the session, and the chat history is stored in localStorage.
- The app degrades gracefully: with no input it falls back to popular films, and posterless results are filtered out.
- This product uses the TMDB API but is not endorsed or certified by TMDB.
