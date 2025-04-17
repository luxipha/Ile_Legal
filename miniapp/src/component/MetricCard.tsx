import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: number;
  className?: string;
  iconClassName?: string;
  hideIcon?: boolean;
  centered?: boolean;
}

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className,
  iconClassName,
  hideIcon = false,
  centered = false
}: MetricCardProps) => {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  
  return (
    <div className={cn(
      "p-3 rounded-xl bg-card flex-1 min-w-0", // flex-1 instead of w-1/2, min-w-0 for proper truncation
      centered ? "flex flex-col items-center text-center" : "flex items-start justify-between",
      className
    )}>
      <div className={cn(
        "space-y-1 min-w-0", // min-w-0 is critical for truncation in flex containers
        centered && "flex flex-col items-center"
      )}>
        <p className="text-xs text-muted-foreground truncate w-full">{title}</p>
        <p className="text-lg sm:text-2xl font-bold truncate w-full">{value}</p>
        
        {trend !== undefined && (
          <p className={cn(
            "text-xs font-medium flex items-center truncate w-full",
            isPositive ? "text-green-500" : "",
            isNegative ? "text-red-500" : "",
            !isPositive && !isNegative ? "text-muted-foreground" : ""
          )}>
            {isPositive && "↑ "}
            {isNegative && "↓ "}
            {Math.abs(trend).toFixed(1)}% from last month
          </p>
        )}
      </div>
      
      {!hideIcon && Icon && (
        <div className={cn(
          "p-1.5 rounded-lg bg-background shrink-0", // Added shrink-0
          iconClassName
        )}>
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
