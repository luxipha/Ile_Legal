import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../component/ui/tooltip";
import CalculatorCard from "../component/CalculatorCard";
import InputSlider from "../component/InputSlider";
import ResultDisplay from "../component/ResultDisplay";
import SummaryChart from "../component/SummaryChart";

interface EmergencySavingsCalculatorProps {
  currentSavings: number;
  monthlyExpenses: number;
  targetMonths: number;
}

const EmergencySavingsCalculator = ({
  currentSavings: initialCurrentSavings = 10000,
  monthlyExpenses: initialMonthlyExpenses = 3000,
  targetMonths: initialTargetMonths = 6
}: EmergencySavingsCalculatorProps) => {
  const [currentSavings, setCurrentSavings] = useState(initialCurrentSavings);
  const [monthlyExpenses, setMonthlyExpenses] = useState(initialMonthlyExpenses);
  const [targetMonths, setTargetMonths] = useState(initialTargetMonths);
  const [targetAmount, setTargetAmount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (initialCurrentSavings !== undefined) setCurrentSavings(initialCurrentSavings);
    if (initialMonthlyExpenses !== undefined) setMonthlyExpenses(initialMonthlyExpenses);
    if (initialTargetMonths !== undefined) setTargetMonths(initialTargetMonths);
  }, [initialCurrentSavings, initialMonthlyExpenses, initialTargetMonths]);

  useEffect(() => {
    const target = monthlyExpenses * targetMonths;
    setTargetAmount(target);
    setProgress(Math.min((currentSavings / target) * 100, 100));

    // Generate chart data
    const monthsData = Array.from({ length: targetMonths }, (_, i) => {
      return {
        name: `Month ${i + 1}`,
        target: monthlyExpenses * (i + 1),
        current: Math.min(currentSavings, monthlyExpenses * (i + 1))
      };
    });

    setChartData(monthsData);
  }, [currentSavings, monthlyExpenses, targetMonths]);

  return (
    <CalculatorCard 
      title="Emergency Fund Calculator" 
      description="Plan your emergency savings fund"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your current total savings that can be used for emergencies</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <InputSlider
                label="Current Savings"
                value={currentSavings}
                onChange={setCurrentSavings}
                min={0}
                max={200000}
                step={1000}
                formatValue={(value) => value.toLocaleString()}
              />
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your average monthly expenses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <InputSlider
                label="Monthly Expenses"
                value={monthlyExpenses}
                onChange={setMonthlyExpenses}
                min={0}
                max={20000}
                step={100}
                formatValue={(value) => value.toLocaleString()}
              />
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Recommended: 3-6 months of expenses for emergency fund</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <InputSlider
                label="Target Months of Expenses"
                value={targetMonths}
                onChange={setTargetMonths}
                min={1}
                max={12}
                step={1}
                prefix=""
                suffix=" months"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ResultDisplay
              label="Target Amount"
              value={targetAmount}
              currency
            />
            <ResultDisplay
              label="Current Savings"
              value={currentSavings}
              currency
            />
            <ResultDisplay
              label="Progress"
              value={progress}
              suffix="%"
            />
          </div>

          <SummaryChart
            data={chartData}
            height={200}
            areaColor="#8B5CF6"
          />
        </div>
      </div>
    </CalculatorCard>
  );
};

export default EmergencySavingsCalculator;
