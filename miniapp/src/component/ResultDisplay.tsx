import { cn } from '../lib/utils';

interface ResultDisplayProps {
  label: string;
  value: string | number;
  currency?: boolean;
  secondaryValue?: string;
  changePercentage?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

const ResultDisplay = ({
  label,
  value,
  currency = false,
  secondaryValue,
  changePercentage,
  className,
  prefix = '',
  suffix = ''
}: ResultDisplayProps) => {
  const formattedValue = currency 
    ? new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
      }).format(Number(value))
    : value;
    
  const isPositiveChange = changePercentage && changePercentage > 0;
  const isNegativeChange = changePercentage && changePercentage < 0;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl md:text-3xl font-semibold animate-number-change">
        {prefix}{formattedValue}{suffix}
      </div>
      
      {secondaryValue && (
        <div className="text-sm text-muted-foreground mt-1">{secondaryValue}</div>
      )}
      
      {changePercentage !== undefined && (
        <div className={cn(
          "text-sm font-medium mt-1 flex items-center",
          isPositiveChange ? "text-finance-green" : "",
          isNegativeChange ? "text-finance-red" : "",
          !isPositiveChange && !isNegativeChange ? "text-muted-foreground" : ""
        )}>
          {isPositiveChange && "↑ "}
          {isNegativeChange && "↓ "}
          {changePercentage.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;