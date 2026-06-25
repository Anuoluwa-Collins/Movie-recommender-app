# Reel — Movie Recommendations

A Letterboxd-inspired movie recommender built with React, TypeScript, Vite and Tailwind CSS. It blends three signals — genres you choose, movies you already love, and your current mood — into a single client-side scoring engine and ranks the best matches for you. Light and dark themes are both included.

## Features

- Genre filtering across the full TMDB genre list.
- "Similar to movies I have seen": search and add seed films, and the app pulls TMDB recommendations and similar titles for each.
- Mood-based discovery (Feel-Good, Adrenaline, Mind-Bending, Cozy, Spooked, Epic, Romantic, Reflective, Curious) that biases both genres and quality thresholds.
- A transparent, weighted scoring engine that combines all three signals and explains why each film was suggested.
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

The scoring engine in src/lib/recommend.ts is a pure, testable function. For each candidate movie it computes:

- Genre affinity: overlap with your selected genres and the genres of your seed movies.
- Relatedness: whether TMDB lists it as similar or recommended for your seeds, and for how many of them.
- Mood fit: overlap with the active mood's genres, plus a rating threshold.
- Quality: vote average scaled by vote-count confidence.
- Recency: a small bonus for newer releases.

These are combined with tunable weights (see WEIGHTS in recommend.ts), sorted, and the top results are returned with human-readable reasons shown on each card.

## Project structure

    src/lib          TMDB client, mood definitions, scoring engine
    src/hooks        theme + debounce hooks
    src/components   UI building blocks
    src/App.tsx      composition and state
    src/types.ts     shared TypeScript types

## Notes

- All API responses are cached in memory for the session to keep things snappy and reduce TMDB calls.
- The app degrades gracefully: if you provide no input it falls back to popular films, and missing posters are filtered out of results.
- This product uses the TMDB API but is not endorsed or certified by TMDB.
