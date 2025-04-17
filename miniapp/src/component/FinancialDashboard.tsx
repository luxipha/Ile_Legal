import { useState, useEffect } from "react";
import { Card, CardContent } from "../component/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../component/ui/tabs";
import { Button } from "../component/ui/button";
import MetricCard from "../component/MetricCard";
import SummaryChart from "../component/SummaryChart";
import CalculatorTabs from "../component/CalculatorTabs";
import RetirementCalculator from "../calculators/RetirementCalculator";
import SavingsCalculator from "../calculators/SavingsCalculator";
import FireCalculator from "../calculators/FireCalculator";
import EmergencySavingsCalculator from "../calculators/EmergencySavingsCalculator";
import MultiStepCalculator from "./MultiStepCalculatorForm.tsx";
import { 
  TrendingUp, 
  Wallet, 
  Coins, 
  LineChart, 
  Zap,
  Home, 
  Calculator,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { CalculatorFormData } from "../component/CalculatorModalForm";

const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("insights");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [calculatorData, setCalculatorData] = useState<CalculatorFormData>();
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);

  const generateMonthlyData = () => {
    if (!calculatorData) return [];
    
    const monthlyReturn = (calculatorData.investmentReturn / 100) / 12;
    const monthlySavings = calculatorData.annualSavings / 12;
    let currentValue = calculatorData.currentSavings;
    
    return Array.from({ length: 12 }, (_, i) => {
      currentValue = currentValue * (1 + monthlyReturn) + monthlySavings;
      return {
        name: new Date(2024, i).toLocaleString('default', { month: 'short' }),
        value: Math.round(currentValue)
      };
    });
  };

  const calculatorTabs = [
    {
      id: "retirement",
      label: "Retirement",
      content: <RetirementCalculator 
        currentAge={calculatorData?.age}
        retirementAge={calculatorData?.retirementAge}
        currentSavings={calculatorData?.currentSavings}
        monthlySavings={(calculatorData?.annualSavings || 0) / 12}
        expectedReturn={calculatorData?.investmentReturn}
      />
    },
    {
      id: "fire",
      label: "F.I.R.E",
      content: <FireCalculator 
        currentAge={calculatorData?.age}
        retirementAge={calculatorData?.retirementAge}
        currentSavings={calculatorData?.currentSavings}
        annualExpenses={calculatorData?.annualExpenses}
        annualSavings={calculatorData?.annualSavings}
        investmentRate={calculatorData?.investmentReturn}
        inflationRate={calculatorData?.inflationRate}
      />
    },
    {
      id: "emergency",
      label: "Emergency Fund",
      content: <EmergencySavingsCalculator 
        currentSavings={calculatorData?.currentSavings || 0}
        monthlyExpenses={(calculatorData?.annualExpenses || 0) / 12}
        targetMonths={6}
      />
    },
    {
      id: "savings",
      label: "Savings",
      content: <SavingsCalculator 
        initialDeposit={calculatorData?.currentSavings}
        monthlyDeposit={(calculatorData?.annualSavings || 0) / 12}
        interestRate={calculatorData?.investmentReturn}
      />
    }
  ];

  useEffect(() => {
    const savedData = localStorage.getItem('calculatorData');
    if (savedData) {
      setCalculatorData(JSON.parse(savedData));
      setIsFirstVisit(false);
    } else {
      setModalOpen(true);
      setIsFirstVisit(true);
    }
  }, []);

  // const calculateNetWorth = (data: CalculatorFormData) => {
  //   return data.currentSavings;
  // };

  // const calculateMonthlySavings = (data: CalculatorFormData) => {
  //   return data.annualSavings / 12;
  // };

  const handleModalSubmit = (data: CalculatorFormData) => {
    setCalculatorData(data);
    localStorage.setItem('calculatorData', JSON.stringify(data));
    setModalOpen(false);
    toast.success("Financial data updated successfully!");
  };

  const handleReset = () => {
    localStorage.removeItem('calculatorData');
    setCalculatorData(undefined);
    setModalOpen(true);
    toast.success("Data reset successfully!");
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-8 flex justify-center">
        <MetricCard
          title="Net Worth"
          value={calculatorData ? `$${calculatorData.currentSavings.toLocaleString()}` : "$0"}
          icon={Wallet}
          trend={calculatorData ? 2.3 : undefined}
          iconClassName="bg-finance-darkPurple1/30 text-finance-purple"
          className="w-full max-w-xl overflow-hidden rounded-xl border border-accent/30 bg-primary/80 shadow-lg hover:border-accent/50 transition-all duration-300"
          centered={true}
        />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <Button 
          onClick={handleReset}
          variant="outline"
          className="bg-transparent hover:bg-finance-darkPurple1/10"
        >
          <RefreshCw className=" h-4 w-4" />
          Reset
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#170F34]/30 backdrop-blur-md rounded-2xl p-1 mb-6 border border-[#ECF3F7]/10 flex">
          <TabsTrigger 
            value="insights" 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'insights'
                ? "bg-[#FDD15F]/10 text-[#FDD15F] border border-[#FDD15F]/30"
                : "text-[#ECF3F7]/70 hover:text-[#ECF3F7]"
            }`}
          >
            <span className="flex items-center justify-center">
              <LineChart className={`w-4 h-4 mr-2 ${activeTab === 'insights' ? 'text-[#FDD15F]' : ''}`} />
              <span>Financial Insights</span>
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="calculators" 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'calculators'
                ? "bg-[#FDD15F]/10 text-[#FDD15F] border border-[#FDD15F]/30"
                : "text-[#ECF3F7]/70 hover:text-[#ECF3F7]"
            }`}
          >
            <span className="flex items-center justify-center">
              <Calculator className={`w-4 h-4 mr-2 ${activeTab === 'calculators' ? 'text-[#FDD15F]' : ''}`}/>
              <span>Calculators</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="animate-fade-in">
          <div className="flex flex-row gap-4 mb-8">
            <div className="w-1/2">
              <MetricCard
                title="Monthly Savings"
                value={calculatorData ? `$${(calculatorData.annualSavings / 12).toLocaleString()}` : "$0"}
                icon={Coins}
                trend={calculatorData ? 5.1 : undefined}
                iconClassName="bg-green-900/30 text-finance-green"
                className="overflow-hidden rounded-xl border border-accent/30 bg-primary/80 hover:border-accent/50 transition-all duration-300 h-full"
              />
            </div>
            <div className="w-1/2">
              <MetricCard
                title="Investment Return"
                value={calculatorData ? `${calculatorData.investmentReturn}%` : "0%"}
                icon={TrendingUp}
                trend={calculatorData ? 1.2 : undefined}
                iconClassName="bg-purple-900/30 text-finance-purple"
                className="overflow-hidden rounded-xl border border-accent/30 bg-primary/80 hover:border-accent/50 transition-all duration-300 h-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="overflow-hidden rounded-xl border border-accent/30 bg-primary/80 hover:border-accent/50 transition-all duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Wealth Growth</h3>
                <SummaryChart 
                  data={generateMonthlyData()} 
                  height={250}
                  areaColor="#8B5CF6"
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-xl border border-accent/30 bg-primary/80 hover:border-accent/50 transition-all duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Financial Health</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Savings Rate</span>
                      <span className="font-medium">
                        {calculatorData ? `${Math.round((calculatorData.annualSavings / calculatorData.annualIncome) * 100)}%` : "0%"}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-finance-purple h-full rounded-full" 
                        style={{ width: calculatorData ? `${Math.min(100, Math.round((calculatorData.annualSavings / calculatorData.annualIncome) * 100))}%` : "0%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Debt-to-Income</span>
                      <span className="font-medium">18%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-finance-green h-full rounded-full" style={{ width: "18%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Emergency Fund</span>
                      <span className="font-medium">
                        {calculatorData ? `${Math.round((calculatorData.currentSavings / (calculatorData.annualExpenses / 6)) * 100)}%` : "0%"}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-finance-gold h-full rounded-full" 
                        style={{ width: calculatorData ? 
                          `${Math.min(100, Math.round((calculatorData.currentSavings / (calculatorData.annualExpenses / 6)) * 100))}%` : "0%" }}>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Retirement Progress</span>
                      <span className="font-medium">
                        {calculatorData ? `${Math.min(100, Math.round((calculatorData.currentSavings / 
                          (calculatorData.annualExpenses * 25)) * 100))}%` : "0%"}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="bg-finance-purple h-full rounded-full" 
                        style={{ width: calculatorData ? 
                          `${Math.min(100, Math.round((calculatorData.currentSavings / 
                            (calculatorData.annualExpenses * 25)) * 100))}%` : "0%" }}>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="overflow-hidden rounded-xl border border-accent/30 bg-primary/80 hover:border-accent/50 transition-all duration-300 h-full">
  <CardContent className="p-2.5 flex items-center gap-1">
    <div className="p-1 rounded-full bg-finance-darkPurple1/20">
      <Zap className="h-3.5 w-3.5 text-finance-gold" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground text-center truncate">FIRE Age</p>
      <p className="text-sm font-bold text-center truncate">
        {calculatorData ? `${Math.min(90, calculatorData.age + Math.ceil(calculatorData.annualExpenses * 25 / calculatorData.annualSavings))}` : "N/A"}
      </p>
    </div>
  </CardContent>
</Card>

<Card className="overflow-hidden rounded-xl border border-accent/30 bg-primary/80 hover:border-accent/50 transition-all duration-300 h-full">
  <CardContent className="p-2.5 flex items-center gap-1">
    <div className="p-1 rounded-full bg-finance-darkPurple1/20">
      <CalendarClock className="h-3.5 w-3.5 text-finance-purple" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground truncate text-center">Retirement</p>
      <p className="text-sm font-bold truncate text-center">
        {calculatorData ? `${calculatorData.retirementAge} years` : "N/A"}
      </p>
    </div>
  </CardContent>
</Card>

<Card className="overflow-hidden rounded-xl border border-accent/30 bg-primary/80 hover:border-accent/50 transition-all duration-300 h-full">
  <CardContent className="p-2.5 flex items-center gap-1">
    <div className="p-1 rounded-full bg-finance-darkPurple1/20">
      <Home className="h-3.5 w-3.5 text-finance-purple" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground truncate text-center">Annual Expenses</p>
      <p className="text-sm font-bold truncate text-center">
        {calculatorData ? `$${calculatorData.annualExpenses.toLocaleString()}` : "$0"}
      </p>
    </div>
  </CardContent>
</Card>

<Card className="overflow-hidden rounded-xl border border-accent/30 bg-primary/80 hover:border-accent/50 transition-all duration-300 h-full">
  <CardContent className="p-2.5 flex items-center gap-1">
    <div className="p-1 rounded-full bg-finance-darkPurple1/20">
      <Coins className="h-3.5 w-3.5 text-finance-green" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground text-center truncate">Annual Income</p>
      <p className="text-sm font-bold text-center truncate">
        {calculatorData ? `$${calculatorData.annualIncome.toLocaleString()}` : "$0"}
      </p>
    </div>
  </CardContent>
</Card>
          </div>
        </TabsContent>

        <TabsContent value="calculators" className="animate-fade-in">
          <CalculatorTabs 
            tabs={calculatorTabs} 
            defaultTab="retirement"
          />
        </TabsContent>
      </Tabs>

      <MultiStepCalculator 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={calculatorData}
      />
    </div>
  );
};

export default FinancialDashboard;
