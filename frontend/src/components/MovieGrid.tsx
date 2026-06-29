import type { ScoredMovie } from '../types';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: ScoredMovie[];
  onSelect: (id: number) => void;
}

export function MovieGrid({ movies, onSelect }: MovieGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onSelect={onSelect} />
      ))}
    </div>
  );
}
