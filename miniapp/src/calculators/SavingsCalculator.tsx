import { useState, useEffect } from "react";
import CalculatorCard from "../component/CalculatorCard";
import InputSlider from "../component/InputSlider";
import ResultDisplay from "../component/ResultDisplay";
import SummaryChart from "../component/SummaryChart";
import { Coins } from "lucide-react";

interface SavingsCalculatorProps {
  initialDeposit?: number;
  monthlyDeposit?: number;
  interestRate?: number;
  years?: number;
}

const SavingsCalculator = ({
  initialDeposit: initialInitialDeposit = 5000,
  monthlyDeposit: initialMonthlyDeposit = 500,
  interestRate: initialInterestRate = 5,
  years: initialYears = 5
}: SavingsCalculatorProps) => {
  const [initialDeposit, setInitialDeposit] = useState(initialInitialDeposit);
  const [monthlyDeposit, setMonthlyDeposit] = useState(initialMonthlyDeposit);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [years, setYears] = useState(initialYears);
  const [futureValue, setFutureValue] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [interestGained, setInterestGained] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // Update state when props change
  useEffect(() => {
    if (initialInitialDeposit) setInitialDeposit(initialInitialDeposit);
    if (initialMonthlyDeposit) setMonthlyDeposit(initialMonthlyDeposit);
    if (initialInterestRate) setInterestRate(initialInterestRate);
    if (initialYears) setYears(initialYears);
  }, [initialInitialDeposit, initialMonthlyDeposit, initialInterestRate, initialYears]);

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
    calculateSavings();
  }, [initialDeposit, monthlyDeposit, interestRate, years]);

  const calculateSavings = () => {
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = years * 12;
    
    // Calculate future value using compound interest formula
    let fv = initialDeposit * Math.pow(1 + monthlyRate, totalMonths);
    
    // Add monthly deposits (compounded)
    fv += monthlyDeposit * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    
    // Calculate total deposits
    const deposits = initialDeposit + (monthlyDeposit * totalMonths);
    
    // Calculate interest gained
    const interest = fv - deposits;
    
    setFutureValue(Math.round(fv));
    setTotalDeposits(Math.round(deposits));
    setInterestGained(Math.round(interest));
    
    // Generate chart data (yearly projections)
    const data = [];
    for (let i = 0; i <= years; i++) {
      const monthsAtThisPoint = i * 12;
      
      // Calculate value at this year
      let yearValue = initialDeposit * Math.pow(1 + monthlyRate, monthsAtThisPoint);
      yearValue += monthlyDeposit * ((Math.pow(1 + monthlyRate, monthsAtThisPoint) - 1) / monthlyRate);
      
      data.push({
        name: `Year ${i}`,
        value: Math.round(yearValue)
      });
    }
    
    setChartData(data);
  };

  return (
    <CalculatorCard 
      title="Savings Growth Calculator" 
      description="Project your savings growth over time"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InputSlider
              label="Initial Deposit"
              value={initialDeposit}
              onChange={setInitialDeposit}
              min={0}
              max={100000}
              step={500}
              formatValue={formatCurrency}
            />
            
            <InputSlider
              label="Monthly Deposit"
              value={monthlyDeposit}
              onChange={setMonthlyDeposit}
              min={0}
              max={5000}
              step={50}
              formatValue={formatCurrency}
            />
            
            <InputSlider
              label="Interest Rate"
              value={interestRate}
              onChange={setInterestRate}
              min={0.1}
              max={15}
              step={0.1}
              formatValue={formatPercent}
              prefix=""
              suffix="%"
            />
            
            <InputSlider
              label="Time Period"
              value={years}
              onChange={setYears}
              min={1}
              max={40}
              step={1}
              prefix=""
              suffix=" yrs"
            />
          </div>
          
          <div className="bg-muted p-6 rounded-xl">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
              <Coins className="h-5 w-5" />
              <span>Savings Projection</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <ResultDisplay
                label="Future Value"
                value={futureValue}
                currency
              />
              
              <ResultDisplay
                label="Total Deposits"
                value={totalDeposits}
                currency
              />
              
              <ResultDisplay
                label="Interest Earned"
                value={interestGained}
                currency
              />
            </div>
            
            <SummaryChart 
              data={chartData} 
              areaColor="#10b981"
              height={180}
            />
          </div>
        </div>
      </div>
    </CalculatorCard>
  );
};

export default SavingsCalculator;
