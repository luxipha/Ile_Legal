import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "../../lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<{
  value: string | undefined
  onValueChange: (value: string) => void
}>({ value: undefined, onValueChange: () => {} })

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, defaultValue, value: controlledValue, onValueChange, children, ...props }, ref) => {
    const [value, setValue] = React.useState(defaultValue || controlledValue)
    
    const handleValueChange = React.useCallback((newValue: string) => {
      setValue(newValue)
      onValueChange?.(newValue)
    }, [onValueChange])
    
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn("grid gap-2", className)} {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, ...props }, ref) => {
    const { value: groupValue, onValueChange } = React.useContext(RadioGroupContext)
    
    return (
      <div className="relative flex items-center">
        <input
          type="radio"
          ref={ref}
          id={id}
          className="sr-only"
          checked={value === groupValue}
          onChange={() => onValueChange(value)}
          value={value}
          {...props}
        />
        <div
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-gray-300 flex items-center justify-center",
            value === groupValue ? "border-primary" : "",
            className
          )}
        >
          {value === groupValue && (
            <Circle className="h-2.5 w-2.5 fill-current text-primary" />
          )}
        </div>
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
