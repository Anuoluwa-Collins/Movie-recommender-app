export interface Mood {
  id: string;
  label: string;
  description: string;
  genreIds: number[];
  minRating: number;
  sortBy: string;
}

// Genre ids follow TMDB's standard movie genre list.
export const MOODS: Mood[] = [
  {
    id: 'feel-good',
    label: 'Feel-Good',
    description: 'Light, uplifting, leaves you smiling',
    genreIds: [35, 10751, 10749, 10402],
    minRating: 6.5,
    sortBy: 'popularity.desc',
  },
  {
    id: 'adrenaline',
    label: 'Adrenaline',
    description: 'Fast, loud, edge-of-your-seat',
    genreIds: [28, 53, 12, 80],
    minRating: 6,
    sortBy: 'popularity.desc',
  },
  {
    id: 'mind-bending',
    label: 'Mind-Bending',
    description: 'Twists, ideas, puzzles to chew on',
    genreIds: [878, 9648, 53],
    minRating: 6.8,
    sortBy: 'vote_average.desc',
  },
  {
    id: 'cozy',
    label: 'Cozy',
    description: 'Warm, gentle, comfort watching',
    genreIds: [16, 10751, 14, 35],
    minRating: 6.5,
    sortBy: 'popularity.desc',
  },
  {
    id: 'spooked',
    label: 'Spooked',
    description: 'Tense, eerie, genuinely scary',
    genreIds: [27, 53, 9648],
    minRating: 6,
    sortBy: 'popularity.desc',
  },
  {
    id: 'epic',
    label: 'Epic',
    description: 'Sweeping worlds and grand stakes',
    genreIds: [12, 14, 36, 10752, 878],
    minRating: 6.8,
    sortBy: 'vote_average.desc',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    description: 'Love, longing, and the feels',
    genreIds: [10749, 18, 35],
    minRating: 6.5,
    sortBy: 'popularity.desc',
  },
  {
    id: 'reflective',
    label: 'Reflective',
    description: 'Slow, moving, stays with you',
    genreIds: [18, 36, 10402],
    minRating: 7,
    sortBy: 'vote_average.desc',
  },
  {
    id: 'curious',
    label: 'Curious',
    description: 'True stories and real worlds',
    genreIds: [99, 36, 9648],
    minRating: 7,
    sortBy: 'vote_average.desc',
  },
];

export function getMood(id: string | null): Mood | undefined {
  if (!id) {
    return undefined;
  }
  return MOODS.find((mood) => mood.id === id);
}
