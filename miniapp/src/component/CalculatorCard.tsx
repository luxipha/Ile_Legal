import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { cn } from '../lib/utils';

interface CalculatorCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

const CalculatorCard = ({ 
  title, 
  description, 
  children, 
  className,
  highlight = false
}: CalculatorCardProps) => {
  return (
    <Card className={cn(
      "h-full w-full max-w-full transition-all duration-300 overflow-hidden border border-accent/30 bg-primary/80 hover:border-accent/50 rounded-xl", 
      highlight ? "gradient-border" : "",
      className
    )}>
      <CardHeader className="p-3 md:p-5">
        <CardTitle className="text-base md:text-lg lg:text-xl">{title}</CardTitle>
        {description && <CardDescription className="text-xs md:text-sm">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-3 md:p-5 pt-0 space-y-3 md:space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default CalculatorCard;