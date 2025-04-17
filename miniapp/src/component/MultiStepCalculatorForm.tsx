import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { AlertTriangle, ArrowRight, ArrowLeft, Check, X } from "lucide-react";
import InputSlider from "./InputSlider";
import { CalculatorFormData } from "../component/CalculatorModalForm";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface MultiStepCalculatorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CalculatorFormData) => void;
  initialData?: CalculatorFormData;
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

const steps = [
  {
    title: "Personal Details",
    description: "Let's start with your basic information",
    fields: ["age", "retirementAge"] as const
  },
  {
    title: "Current Financial Status",
    description: "Tell us about your current finances",
    fields: ["currentSavings", "annualIncome"] as const
  },
  {
    title: "Savings & Expenses",
    description: "Plan your financial future",
    fields: ["annualExpenses", "annualSavings"] as const
  },
  {
    title: "Investment Strategy",
    description: "Define your investment approach",
    fields: ["investmentReturn", "inflationRate"] as const
  }
];

const MultiStepCalculatorForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: MultiStepCalculatorFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CalculatorFormData>(initialData || defaultFormData);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleChange = (field: keyof CalculatorFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onSubmit(formData);
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US');
  };

  const formatPercentage = (value: number) => {
    return value.toString();
  };

  const renderStepContent = (step: number) => {
    const currentFields = steps[step].fields;
    
    return (
      <div className="space-y-6">
        {currentFields.map(field => {
          const tooltips: Record<string, string> = {
            // change info session
            age: "Your current age, used to calculate retirement planning timeline",
            retirementAge: "The age at which you plan to retire",
            currentSavings: "Total amount currently saved across all bank accounts",
            annualIncome: "Your total yearly income before taxes",
            annualExpenses: "Your total yearly expenses",
            annualSavings: "How much you save per year",
            investmentReturn: "Expected annual return on investments (typical: 5-8%)",
            inflationRate: "Expected annual inflation rate (Nigeria: 24.43%)"
          };

          const renderField = (props: any) => (
            <div className="flex items-center gap-2" key={field}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltips[field]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <InputSlider {...props} />
            </div>
          );

          switch (field) {
            case "age":
              return renderField({
                key: field,
                label: "Current Age",
                value: formData[field],
                onChange: (value: number) => handleChange(field, value),
                min: 18,
                max: 80,
                suffix: "years",
                prefix: ""
              });
            case "retirementAge":
              return renderField({
                key: field,
                label: "Retirement Age",
                value: formData[field],
                onChange: (value: number) => handleChange(field, value),
                min: Math.max(formData.age + 1, 30),
                max: 90,
                suffix: "years",
                prefix: ""
              });
            case "currentSavings":
              return renderField({
                key: field,
                label: "Current Savings",
                value: formData[field],
                onChange: (value: number) => handleChange(field, value),
                min: 0,
                max: 1000000,
                step: 1000,
                formatValue: formatCurrency
              });
            case "annualIncome":
              return renderField({
                key: field,
                label: "Annual Income",
                value: formData[field],
                onChange: (value: number) => handleChange(field, value),
                min: 0,
                max: 500000,
                step: 1000,
                formatValue: formatCurrency
              });
            case "annualExpenses":
              return renderField({
                key: field,
                label: "Annual Expenses",
                value: formData[field],
                onChange: (value: number) => handleChange(field, value),
                min: 0,
                max: 300000,
                step: 1000,
                formatValue: formatCurrency
              });
            case "annualSavings":
              return renderField({
                key: field,
                label: "Annual Savings",
                value: formData[field],
                onChange: (value: number) => handleChange(field, value),
                min: 0,
                max: Math.min(formData.annualIncome, 200000),
                step: 1000,
                formatValue: formatCurrency
              });
            case "investmentReturn":
              return renderField({
                key: field,
                label: "Expected Return Rate",
                value: formData[field],
                onChange: (value: number) => handleChange(field, value),
                min: 1,
                max: 15,
                step: 0.1,
                formatValue: formatPercentage,
                suffix: "%",
                prefix: ""
              });
            case "inflationRate":
              return renderField({
                key: field,
                label: "Expected Inflation Rate",
                value: formData[field],
                onChange: (value: number) => handleChange(field, value),
                min: 0,
                max: 10,
                step: 0.1,
                formatValue: formatPercentage,
                suffix: "%",
                prefix: ""
              });
          }
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center pb-16 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
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
            <Card className="border-t-4 border-finance-purple bg-[#170F34]/80 backdrop-blur-md border-0">
              <CardHeader className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle className="text-finance-gold">{steps[currentStep].title}</CardTitle>
                <CardDescription className="text-gray-300">
                  {steps[currentStep].description}
                </CardDescription>
                
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="mt-4 p-3 bg-amber-950/50 text-amber-400 rounded-md flex gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong>Beta Feature:</strong> The F.I.R.E calculator is still in beta. All data is stored locally on your device only.
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <motion.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent(currentStep)}
                </motion.div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="bg-transparent border-finance-purple/50 hover:bg-finance-purple/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={nextStep}
                  className="bg-finance-purple hover:bg-[#7C3AED] text-white"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Complete
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MultiStepCalculatorForm;
