import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  garageId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

const FavoriteButton = ({ garageId, variant = 'icon', className }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const isFav = isFavorite(garageId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(garageId);
  };

  if (variant === 'full') {
    return (
      <Button
        variant={isFav ? 'default' : 'outline'}
        onClick={handleClick}
        disabled={isToggling}
        className={cn('flex items-center gap-2', className)}
      >
        <Heart className={cn('h-4 w-4', isFav && 'fill-current')} />
        {isFav ? 'Salvat în favorite' : 'Adaugă la favorite'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        'rounded-full min-w-[44px] min-h-[44px] w-11 h-11',
        isFav ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground',
        className
      )}
      aria-label={isFav ? 'Elimină din favorite' : 'Adaugă la favorite'}
      aria-pressed={isFav}
    >
      <Heart className={cn('h-6 w-6', isFav && 'fill-current')} />
    </Button>
  );
};

export default FavoriteButton;
