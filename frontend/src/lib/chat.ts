import type { Genre } from '../types';

export interface ParsedQuery {
  genreIds: number[];
  moodId: string | null;
  regionId: string | null;
  seedTitles: string[];
}

const MOOD_KEYWORDS: Array<{ id: string; words: string[] }> = [
  { id: 'feel-good', words: ['feel good', 'feel-good', 'happy', 'uplifting', 'cheer', 'fun '] },
  { id: 'adrenaline', words: ['adrenaline', 'exciting', 'intense', 'thrill', 'high octane'] },
  { id: 'mind-bending', words: ['mind-bending', 'mind bending', 'twist', 'cerebral', 'confusing', 'puzzle'] },
  { id: 'cozy', words: ['cozy', 'cosy', 'comfort', 'relax', 'chill', 'wholesome'] },
  { id: 'spooked', words: ['scary', 'horror', 'spooky', 'creepy', 'frighten', 'terrifying'] },
  { id: 'epic', words: ['epic', 'grand', 'sweeping', 'blockbuster'] },
  { id: 'romantic', words: ['romantic', 'romance', 'love story', 'date night'] },
  { id: 'reflective', words: ['sad', 'emotional', 'reflective', 'moving', 'melancholy', 'tearjerker'] },
  { id: 'curious', words: ['documentary', 'true story', 'based on a true', 'real life'] },
];

const REGION_KEYWORDS: Array<{ id: string; words: string[] }> = [
  { id: 'bollywood', words: ['bollywood', 'hindi', 'indian'] },
  { id: 'nollywood', words: ['nollywood', 'nigerian'] },
  { id: 'korean', words: ['korean', 'k-drama', 'kdrama', 'korea'] },
  { id: 'japanese', words: ['japanese', 'anime', 'japan'] },
  { id: 'african', words: ['african', 'africa'] },
  { id: 'european', words: ['european', 'europe', 'french', 'italian', 'german', 'spanish'] },
  { id: 'latin', words: ['latin american', 'latino', 'mexican', 'brazilian'] },
  { id: 'asian', words: ['asian', 'asia'] },
  { id: 'hollywood', words: ['hollywood', 'american'] },
];

// Ordered most-specific first so we do not falsely treat "I like comedy" as a seed.
const SEED_TRIGGERS = [
  'movies like ',
  'movie like ',
  'films like ',
  'film like ',
  'similar to ',
  'something like ',
  'in the style of ',
  'like the movie ',
];

function extractSeedTitles(text: string): string[] {
  for (const trigger of SEED_TRIGGERS) {
    const idx = text.indexOf(trigger);
    if (idx !== -1) {
      let tail = text.slice(idx + trigger.length).trim();
      tail = tail.split(/ but | except | for /)[0];
      return tail
        .split(/,| and /)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 3);
    }
  }
  return [];
}

export function parseMessage(rawText: string, genres: Genre[]): ParsedQuery {
  const lower = rawText.toLowerCase().trim();
  const padded = ' ' + lower + ' ';

  const genreIds: number[] = [];
  for (const genre of genres) {
    if (padded.includes(' ' + genre.name.toLowerCase())) {
      genreIds.push(genre.id);
    }
  }

  let moodId: string | null = null;
  for (const mood of MOOD_KEYWORDS) {
    if (mood.words.some((word) => padded.includes(word))) {
      moodId = mood.id;
      break;
    }
  }

  let regionId: string | null = null;
  for (const region of REGION_KEYWORDS) {
    if (region.words.some((word) => padded.includes(word))) {
      regionId = region.id;
      break;
    }
  }

  return { genreIds, moodId, regionId, seedTitles: extractSeedTitles(lower) };
}
