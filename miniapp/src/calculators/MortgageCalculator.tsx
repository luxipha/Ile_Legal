import { useState, useEffect } from "react";
import CalculatorCard from "../component/CalculatorCard";
import InputSlider from "../component/InputSlider";
import ResultDisplay from "../component/ResultDisplay";
import { Home } from "lucide-react";

const MortgageCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(300000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);

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
    // Calculate down payment amount when percentage changes
    const downAmount = (loanAmount * downPaymentPercent) / 100;
    setDownPaymentAmount(downAmount);
  }, [loanAmount, downPaymentPercent]);

  useEffect(() => {
    calculateMortgage();
  }, [loanAmount, interestRate, loanTerm, downPaymentAmount]);

  const calculateMortgage = () => {
    const principal = loanAmount - downPaymentAmount;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Calculate monthly payment using the formula P = L[c(1 + c)^n]/[(1 + c)^n - 1]
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    const totalPaid = monthlyPayment * numberOfPayments;
    const totalInterestPaid = totalPaid - principal;
    
    setMonthlyPayment(monthlyPayment);
    setTotalInterest(totalInterestPaid);
    setTotalPayment(totalPaid);
  };

  return (
    <CalculatorCard 
      title="Mortgage Calculator" 
      description="Calculate mortgage payments and total costs"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InputSlider
              label="Home Price"
              value={loanAmount}
              onChange={setLoanAmount}
              min={50000}
              max={2000000}
              step={10000}
              formatValue={formatCurrency}
            />
            
            <InputSlider
              label="Down Payment"
              value={downPaymentPercent}
              onChange={setDownPaymentPercent}
              min={0}
              max={50}
              step={1}
              formatValue={formatPercent}
              prefix=""
              suffix="%"
            />
            
            <div className="text-sm text-muted-foreground">
              Down payment amount: ${new Intl.NumberFormat().format(Math.round(downPaymentAmount))}
            </div>
            
            <InputSlider
              label="Interest Rate"
              value={interestRate}
              onChange={setInterestRate}
              min={1}
              max={15}
              step={0.125}
              formatValue={formatPercent}
              prefix=""
              suffix="%"
            />
            
            <InputSlider
              label="Loan Term"
              value={loanTerm}
              onChange={setLoanTerm}
              min={5}
              max={30}
              step={5}
              prefix=""
              suffix=" yrs"
            />
          </div>
          
          <div className="bg-muted p-6 rounded-xl">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-6">
              <Home className="h-5 w-5" />
              <span>Mortgage Breakdown</span>
            </h3>
            
            <div className="space-y-6">
              <ResultDisplay
                label="Monthly Payment"
                value={monthlyPayment}
                currency
              />
              
              <div className="grid grid-cols-2 gap-4">
                <ResultDisplay
                  label="Principal"
                  value={loanAmount - downPaymentAmount}
                  currency
                />
                
                <ResultDisplay
                  label="Total Interest"
                  value={totalInterest}
                  currency
                />
              </div>
              
              <div className="pt-4 border-t border-border">
                <ResultDisplay
                  label="Total Payments"
                  value={totalPayment}
                  currency
                  secondaryValue={`Over ${loanTerm} years`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorCard>
  );
};

export default MortgageCalculator;
