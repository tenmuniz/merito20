import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  barClassName?: string;
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max,
  className,
  barClassName,
  animated = true,
  showLabel = false,
  label
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    // Set initial width to 0 for animation
    setWidth(0);
    
    // Start animation after a small delay
    const timeout = setTimeout(() => {
      setWidth(Math.min(Math.round((value / max) * 100), 100));
    }, 50);
    
    return () => clearTimeout(timeout);
  }, [value, max]);
  
  return (
    <div className={cn("h-3 bg-gray-100 rounded-full overflow-hidden relative", className)}>
      <div
        className={cn(
          "h-full rounded-full",
          animated && "transition-all duration-1000 ease-out",
          barClassName
        )}
        style={{ width: `${width}%` }}
      >
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {label || `${width}%`}
          </div>
        )}
      </div>
    </div>
  );
}
