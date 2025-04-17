import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { AlertTriangle, X } from "lucide-react";
import InputSlider from "./InputSlider";

interface CalculatorModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CalculatorFormData) => void;
  initialData?: CalculatorFormData;
}

export interface CalculatorFormData {
  age: number;
  retirementAge: number;
  currentSavings: number;
  annualIncome: number;
  annualExpenses: number;
  annualSavings: number;
  investmentReturn: number;
  inflationRate: number;
}

const defaultFormData: CalculatorFormData = {
  age: 30,
  retirementAge: 65,
  currentSavings: 50000,
  annualIncome: 75000,
  annualExpenses: 50000,
  annualSavings: 15000,
  investmentReturn: 7,
  inflationRate: 2.5,
};

const CalculatorModalForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData 
}: CalculatorModalFormProps) => {
  const [formData, setFormData] = useState<CalculatorFormData>(initialData || defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (field: keyof CalculatorFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US');
  };

  // Format percentage values
  const formatPercentage = (value: number) => {
    return value.toString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="fixed inset-0 bg-black/70"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            className="z-50 w-full max-w-lg sm:max-h-[90vh] overflow-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <Card className="border-t-4 border-finance-purple">
              <CardHeader className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-4"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle>Financial Calculator Setup</CardTitle>
                <CardDescription>
                  Enter your financial details to calculate your future projections
                </CardDescription>
                
                <div className="mt-4 p-3 bg-amber-100 text-amber-800 rounded-md flex gap-2 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong>Beta Feature:</strong> The F.I.R.E calculator is still in beta. All data is stored locally on your device only.
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <form id="calculator-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <InputSlider
                        label="Current Age"
                        value={formData.age}
                        onChange={(value) => handleChange('age', value)}
                        min={18}
                        max={80}
                        step={1}
                        suffix="years"
                        prefix=""
                      />
                      
                      <InputSlider
                        label="Retirement Age"
                        value={formData.retirementAge}
                        onChange={(value) => handleChange('retirementAge', value)}
                        min={30}
                        max={90}
                        step={1}
                        suffix="years"
                        prefix=""
                      />
                      
                      <InputSlider
                        label="Current Savings"
                        value={formData.currentSavings}
                        onChange={(value) => handleChange('currentSavings', value)}
                        min={0}
                        max={1000000}
                        step={1000}
                        formatValue={formatCurrency}
                      />
                      
                      <InputSlider
                        label="Annual Income"
                        value={formData.annualIncome}
                        onChange={(value) => handleChange('annualIncome', value)}
                        min={0}
                        max={500000}
                        step={1000}
                        formatValue={formatCurrency}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <InputSlider
                        label="Annual Expenses"
                        value={formData.annualExpenses}
                        onChange={(value) => handleChange('annualExpenses', value)}
                        min={0}
                        max={300000}
                        step={1000}
                        formatValue={formatCurrency}
                      />
                      
                      <InputSlider
                        label="Annual Savings"
                        value={formData.annualSavings}
                        onChange={(value) => handleChange('annualSavings', value)}
                        min={0}
                        max={200000}
                        step={1000}
                        formatValue={formatCurrency}
                      />
                      
                      <InputSlider
                        label="Investment Return"
                        value={formData.investmentReturn}
                        onChange={(value) => handleChange('investmentReturn', value)}
                        min={1}
                        max={15}
                        step={0.1}
                        formatValue={formatPercentage}
                        suffix="%"
                        prefix=""
                      />
                      
                      <InputSlider
                        label="Inflation Rate"
                        value={formData.inflationRate}
                        onChange={(value) => handleChange('inflationRate', value)}
                        min={0}
                        max={10}
                        step={0.1}
                        formatValue={formatPercentage}
                        suffix="%"
                        prefix=""
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="calculator-form"
                  className="bg-finance-purple hover:bg-finance-purpleHover"
                >
                  Calculate
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalculatorModalForm;
