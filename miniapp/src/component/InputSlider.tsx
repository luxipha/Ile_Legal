import { useState, useEffect } from "react";
import { Slider } from "../component/ui/slider";
import { Input } from "../component/ui/input";
import { cn } from "../lib/utils";

interface InputSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  className?: string;
  suffix?: string;
  prefix?: string;
}

const InputSlider = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  className,
  suffix,
  prefix = "$"
}: InputSliderProps) => {
  const [inputValue, setInputValue] = useState<string>(
    formatValue ? formatValue(value) : value.toString()
  );

  useEffect(() => {
    setInputValue(formatValue ? formatValue(value) : value.toString());
  }, [value, formatValue]);

  const handleSliderChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9.]/g, '');
    setInputValue(newValue);
  };

  const handleInputBlur = () => {
    let newValue: number = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    
    if (isNaN(newValue)) {
      newValue = value;
    } else {
      newValue = Math.min(Math.max(newValue, min), max);
    }

    onChange(newValue);
    setInputValue(formatValue ? formatValue(newValue) : newValue.toString());
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 sm:grid-cols-2 items-center gap-2 sm:gap-4 w-full">
        <div className="flex items-center gap-1">
          <label className="text-sm sm:text-base font-medium">{label}</label>
        </div>
        <div className="relative w-full">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className={cn(
              "text-right bg-[#0F0A1F] border-[#2A2344] rounded-lg h-10 sm:h-12  text-sm sm:text-base px-2",
              prefix ? "pl-7" : "",
              suffix ? "pr-12" : ""
            )}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-4 pointer-events-none text-gray-400">
 <span className="text-xs sm:text-sm">{suffix}</span>         
    </div>
          )}
          {prefix && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                         <span className="text-xs sm:text-sm">{prefix}</span>

            </div>
          )}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
        className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-finance-purple [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 h-2 bg-gradient-to-r from-[#B975F6] to-[#F3C95D]"
      />
    </div>
  );
};

export default InputSlider;
