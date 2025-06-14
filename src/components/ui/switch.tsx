import * as React from "react"
import { cn } from "../../lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, onChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked || checked || false)
    
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = event.target.checked
      if (checked === undefined) {
        setIsChecked(newChecked)
      }
      onCheckedChange?.(newChecked)
      onChange?.(event)
    }
    
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            isChecked ? "bg-primary" : "bg-gray-300",
            className
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md",
              isChecked ? "translate-x-5" : "translate-x-1"
            )}
          />
        </div>
      </label>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
