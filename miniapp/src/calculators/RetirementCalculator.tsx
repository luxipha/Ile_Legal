import { useState, useEffect } from "react";
import CalculatorCard from "../component/CalculatorCard";
import InputSlider from "../component/InputSlider";
import ResultDisplay from "../component/ResultDisplay";
import { Button } from "../component/ui/button";
import { CalendarClock } from "lucide-react";

interface RetirementCalculatorProps {
  currentAge?: number;
  retirementAge?: number;
  currentSavings?: number;
  monthlySavings?: number;
  expectedReturn?: number;
}

const RetirementCalculator = ({
  currentAge: initialCurrentAge = 30,
  retirementAge: initialRetirementAge = 65,
  currentSavings: initialCurrentSavings = 50000,
  monthlySavings: initialMonthlySavings = 1000,
  expectedReturn: initialExpectedReturn = 7
}: RetirementCalculatorProps) => {
  const [currentAge, setCurrentAge] = useState(initialCurrentAge);
  const [retirementAge, setRetirementAge] = useState(initialRetirementAge);
  const [currentSavings, setCurrentSavings] = useState(initialCurrentSavings);
  const [monthlySavings, setMonthlySavings] = useState(initialMonthlySavings);
  const [expectedReturn, setExpectedReturn] = useState(initialExpectedReturn);
  const [retirementResult, setRetirementResult] = useState({
    futureValue: 0,
    monthlyIncome: 0,
    yearsTillRetirement: 0
  });

  // Update state when props change
  useEffect(() => {
    if (initialCurrentAge) setCurrentAge(initialCurrentAge);
    if (initialRetirementAge) setRetirementAge(initialRetirementAge);
    if (initialCurrentSavings) setCurrentSavings(initialCurrentSavings);
    if (initialMonthlySavings) setMonthlySavings(initialMonthlySavings);
    if (initialExpectedReturn) setExpectedReturn(initialExpectedReturn);
  }, [initialCurrentAge, initialRetirementAge, initialCurrentSavings, initialMonthlySavings, initialExpectedReturn]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value).replace('$', '');
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  useEffect(() => {
    calculateRetirement();
  }, [currentAge, retirementAge, currentSavings, monthlySavings, expectedReturn]);

  const calculateRetirement = () => {
    const yearsTillRetirement = retirementAge - currentAge;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = yearsTillRetirement * 12;

    // Future value calculation using compound interest formula
    let futureValue = currentSavings * Math.pow(1 + monthlyRate, totalMonths);
    
    // Add monthly contributions (compounded)
    futureValue += monthlySavings * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);

    // Estimate monthly income during retirement (4% rule)
    const monthlyIncome = futureValue * 0.04 / 12;

    setRetirementResult({
      futureValue: Math.round(futureValue),
      monthlyIncome: Math.round(monthlyIncome),
      yearsTillRetirement
    });
  };

  return (
    <CalculatorCard 
      title="Retirement Planner" 
      description="Plan your retirement with projected savings and income"
      highlight
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InputSlider
              label="Current Age"
              value={currentAge}
              onChange={setCurrentAge}
              min={18}
              max={80}
              prefix=""
              suffix="yrs"
            />
            
            <InputSlider
              label="Retirement Age"
              value={retirementAge}
              onChange={setRetirementAge}
              min={currentAge + 1}
              max={90}
              prefix=""
              suffix="yrs"
            />
            
            <InputSlider
              label="Current Savings"
              value={currentSavings}
              onChange={setCurrentSavings}
              min={0}
              max={1000000}
              step={1000}
              formatValue={formatCurrency}
            />
            
            <InputSlider
              label="Monthly Savings"
              value={monthlySavings}
              onChange={setMonthlySavings}
              min={0}
              max={10000}
              step={100}
              formatValue={formatCurrency}
            />
            
            <InputSlider
              label="Expected Return Rate"
              value={expectedReturn}
              onChange={setExpectedReturn}
              min={1}
              max={15}
              step={0.1}
              formatValue={formatPercent}
              prefix=""
              suffix="%"
            />
          </div>
          
          <div className="bg-muted p-6 rounded-xl flex flex-col">
            <div className="flex-1 space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                <span>Retirement Projection</span>
              </h3>
              
              <div className="space-y-5">
                <ResultDisplay
                  label="Retirement Nest Egg"
                  value={retirementResult.futureValue}
                  currency
                  secondaryValue={`In ${retirementResult.yearsTillRetirement} years`}
                />
                
                <ResultDisplay
                  label="Estimated Monthly Income"
                  value={retirementResult.monthlyIncome}
                  currency
                  secondaryValue="Based on 4% withdrawal rule"
                />
              </div>
            </div>
            
            <Button className="w-full mt-6">
              View Detailed Report
            </Button>
          </div>
        </div>
      </div>
    </CalculatorCard>
  );
};

export default RetirementCalculator;
