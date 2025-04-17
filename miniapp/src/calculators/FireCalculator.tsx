import { useState, useEffect } from "react";
import CalculatorCard from "../component/CalculatorCard";
import InputSlider from "../component/InputSlider";
import ResultDisplay from "../component/ResultDisplay";
import { Zap } from "lucide-react";

interface FireCalculatorProps {
  currentAge?: number;
  retirementAge?: number;
  currentSavings?: number;
  annualExpenses?: number;
  annualSavings?: number;
  investmentRate?: number;
  inflationRate?: number;
}

const FireCalculator = ({
  currentAge: initialCurrentAge = 30,
  retirementAge: initialRetirementAge = 65,
  currentSavings: initialCurrentSavings = 100000,
  annualExpenses: initialAnnualExpenses = 40000,
  annualSavings: initialAnnualSavings = 30000,
  investmentRate: initialExpectedReturn = 7,
  inflationRate: initialInflationRate = 2.5
}: FireCalculatorProps) => {
  const [currentAge, setCurrentAge] = useState(initialCurrentAge);
  const [annualExpenses, setAnnualExpenses] = useState(initialAnnualExpenses);
  const [currentSavings, setCurrentSavings] = useState(initialCurrentSavings);
  const [savingsRate, setSavingsRate] = useState(40);
  const [annualIncome, setAnnualIncome] = useState(initialAnnualSavings / 0.4); // Estimate income based on savings rate
  const [expectedReturn, setExpectedReturn] = useState(initialExpectedReturn);
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  
  const [targetAmount, setTargetAmount] = useState(0);
  const [yearsToFire, setYearsToFire] = useState(0);
  const [fireAge, setFireAge] = useState(0);

  // Update state when props change
  useEffect(() => {
    if (initialCurrentAge) setCurrentAge(initialCurrentAge);
    if (initialAnnualExpenses) setAnnualExpenses(initialAnnualExpenses);
    if (initialCurrentSavings) setCurrentSavings(initialCurrentSavings);
    if (initialAnnualSavings) {
      const estimatedIncome = initialAnnualSavings / 0.4; // Estimate income based on default 40% savings rate
      setAnnualIncome(estimatedIncome);
      setSavingsRate(Math.round((initialAnnualSavings / estimatedIncome) * 100));
    }
    if (initialExpectedReturn) setExpectedReturn(initialExpectedReturn);
  }, [initialCurrentAge, initialAnnualExpenses, initialCurrentSavings, initialAnnualSavings, initialExpectedReturn]);

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
    calculateFire();
  }, [
    currentAge, 
    annualExpenses, 
    currentSavings, 
    savingsRate, 
    annualIncome,
    expectedReturn,
    withdrawalRate
  ]);

  const calculateFire = () => {
    // Calculate target amount using the 25x rule (or custom withdrawal rate)
    const targetAmount = (annualExpenses * 100) / withdrawalRate;
    
    // Calculate annual savings
    const annualSavings = (annualIncome * savingsRate) / 100;
    
    // Calculate years to FIRE
    const monthlyRate = expectedReturn / 100 / 12;
    const monthlySavings = annualSavings / 12;
    
    // Calculate the number of months required to reach the target amount
    let balance = currentSavings;
    let months = 0;
    
    while (balance < targetAmount && months < 1200) { // Cap at 100 years to prevent infinite loops
      balance = balance * (1 + monthlyRate) + monthlySavings;
      months++;
    }
    
    const years = months / 12;
    
    setTargetAmount(Math.round(targetAmount));
    setYearsToFire(parseFloat(years.toFixed(1)));
    setFireAge(Math.round(currentAge + years));
  };

  return (
    <CalculatorCard 
      title="FIRE Calculator" 
      description="Calculate your financial independence timeline"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InputSlider
              label="Current Age"
              value={currentAge}
              onChange={setCurrentAge}
              min={18}
              max={70}
              prefix=""
              suffix=" yrs"
            />
            
            <InputSlider
              label="Annual Income"
              value={annualIncome}
              onChange={setAnnualIncome}
              min={10000}
              max={500000}
              step={5000}
              formatValue={formatCurrency}
            />
            
            <InputSlider
              label="Annual Expenses"
              value={annualExpenses}
              onChange={setAnnualExpenses}
              min={10000}
              max={200000}
              step={1000}
              formatValue={formatCurrency}
            />
            
            <InputSlider
              label="Current Savings"
              value={currentSavings}
              onChange={setCurrentSavings}
              min={0}
              max={2000000}
              step={10000}
              formatValue={formatCurrency}
            />
            
            <InputSlider
              label="Savings Rate"
              value={savingsRate}
              onChange={setSavingsRate}
              min={1}
              max={90}
              step={1}
              formatValue={formatPercent}
              prefix=""
              suffix="%"
            />
            
            <InputSlider
              label="Expected Return"
              value={expectedReturn}
              onChange={setExpectedReturn}
              min={1}
              max={15}
              step={0.1}
              formatValue={formatPercent}
              prefix=""
              suffix="%"
            />
            
            <InputSlider
              label="Withdrawal Rate"
              value={withdrawalRate}
              onChange={setWithdrawalRate}
              min={2}
              max={8}
              step={0.1}
              formatValue={formatPercent}
              prefix=""
              suffix="%"
            />
          </div>
          
          <div className="bg-muted p-6 rounded-xl">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-finance-yellow" />
              <span>Your FIRE Projection</span>
            </h3>
            
            <div className="space-y-8">
              <ResultDisplay
                label="Target FIRE Amount"
                value={targetAmount}
                currency
                secondaryValue={`Based on ${withdrawalRate}% withdrawal rate`}
              />
              
              <ResultDisplay
                label="Years to Financial Freedom"
                value={yearsToFire}
                prefix=""
                suffix={yearsToFire === 1 ? " year" : " years"}
                secondaryValue={`You'll reach FIRE at age ${fireAge}`}
              />
              
              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  The 25x rule says you need 25 times your annual expenses to retire,
                  which is equivalent to a 4% withdrawal rate. Adjust the withdrawal
                  rate based on your risk tolerance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorCard>
  );
};

export default FireCalculator;
