import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const StarRating = ({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (interactive && onChange && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onChange(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const filled = index < Math.floor(displayRating);
        const halfFilled = !filled && index < displayRating && displayRating % 1 !== 0;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
            className={cn(
              "relative transition-transform",
              interactive && "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-sm",
              !interactive && "cursor-default"
            )}
            aria-label={interactive ? `Acordă ${index + 1} din ${maxRating} stele` : undefined}
          >
            {/* Empty star (background) */}
            <Star
              className={cn(
                sizeClasses[size],
                "text-muted-foreground/30",
                interactive && hoverRating > 0 && index >= hoverRating && "text-muted-foreground/20"
              )}
            />
            {/* Filled star (overlay) */}
            {(filled || halfFilled) && (
              <Star
                className={cn(
                  sizeClasses[size],
                  "absolute inset-0 text-accent fill-accent",
                  halfFilled && "clip-path-half"
                )}
                style={halfFilled ? { clipPath: "inset(0 50% 0 0)" } : undefined}
              />
            )}
          </button>
        );
      })}
      {(showValue || (interactive && hoverRating > 0)) && (
        <span className={cn(
          "ml-1 text-sm font-medium transition-colors",
          hoverRating > 0 ? "text-foreground" : "text-muted-foreground"
        )}>
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
