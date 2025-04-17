import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export interface QuestionnaireData {
  monthlyIncome: number;
  monthlySavings: number;
  currentInvestments: number;
  age: number;
  targetRetirementAge: number;
  timestamp: number;
}

const defaultData: QuestionnaireData = {
  monthlyIncome: 0,
  monthlySavings: 0,
  currentInvestments: 0,
  age: 30,
  targetRetirementAge: 45,
  timestamp: Date.now()
};

interface FireQuestionnaireProps {
  onComplete: (data: QuestionnaireData) => void;
}

const FireQuestionnaire = ({ onComplete }: FireQuestionnaireProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<QuestionnaireData>(defaultData);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  useEffect(() => {
    // Only run this effect once to prevent infinite loops
    if (!initialCheckDone) {
      // Check if we have data in localStorage
      const storedData = localStorage.getItem('fireData');
      if (!storedData) {
        setOpen(true);
      } else {
        try {
          // If data exists, pass it to parent component
          const parsedData = JSON.parse(storedData);
          onComplete(parsedData);
        } catch (error) {
          console.error("Error parsing stored data:", error);
          setOpen(true);
        }
      }
      setInitialCheckDone(true);
    }
  }, [onComplete, initialCheckDone]);
  
  const totalSteps = 5;
  
  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Save data and close
      const finalData = { ...data, timestamp: Date.now() };
      localStorage.setItem('fireData', JSON.stringify(finalData));
      onComplete(finalData);
      setOpen(false);
    }
  };
  
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const updateData = (field: keyof QuestionnaireData, value: number) => {
    setData({ ...data, [field]: value });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Let's set up your FIRE journey</DialogTitle>
          <DialogDescription>
            Answer a few questions to help us calculate your path to financial independence.
          </DialogDescription>
          <Progress value={(step / totalSteps) * 100} className="mt-2 h-2 bg-blue-500" />
        </DialogHeader>
        
        <Alert className="bg-amber-50 border-amber-200 mt-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-xs text-amber-700">
            This data is stored locally on your device and is not saved on our servers.
          </AlertDescription>
        </Alert>
        
        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4">
              <Label htmlFor="monthlyIncome" className="flex items-center">
                What is your monthly income?
                <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
              </Label>
              <Input
                id="monthlyIncome"
                type="number"
                value={data.monthlyIncome || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('monthlyIncome', Number(e.target.value))}
                placeholder="e.g. 5000"
              />
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <Label htmlFor="monthlySavings" className="flex items-center">
                How much do you save monthly?
                <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
              </Label>
              <Input
                id="monthlySavings"
                type="number"
                value={data.monthlySavings || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('monthlySavings', Number(e.target.value))}
                placeholder="e.g. 1000"
              />
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <Label htmlFor="currentInvestments" className="flex items-center">
                Current investment portfolio value
                <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
              </Label>
              <Input
                id="currentInvestments"
                type="number"
                value={data.currentInvestments || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('currentInvestments', Number(e.target.value))}
                placeholder="e.g. 50000"
              />
            </div>
          )}
          
          {step === 4 && (
            <div className="space-y-4">
              <Label htmlFor="age" className="flex items-center">
                Your current age
                <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
              </Label>
              <Input
                id="age"
                type="number"
                value={data.age || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('age', Number(e.target.value))}
                placeholder="e.g. 30"
              />
            </div>
          )}
          
          {step === 5 && (
            <div className="space-y-4">
              <Label htmlFor="targetRetirementAge" className="flex items-center">
                Target retirement age
                <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
              </Label>
              <Input
                id="targetRetirementAge"
                type="number"
                value={data.targetRetirementAge || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('targetRetirementAge', Number(e.target.value))}
                placeholder="e.g. 45"
              />
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={step === 1}>
            Back
          </Button>
          <Button onClick={handleNext}>
            {step === totalSteps ? 'Complete' : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FireQuestionnaire;