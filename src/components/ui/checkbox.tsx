import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <input
            id={checkboxId}
            type="checkbox"
            className={cn(
              "h-5 w-5 rounded border border-gray-300 bg-white checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 touch-target",
              error && "border-danger focus:ring-danger/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {label && (
            <label 
              htmlFor={checkboxId}
              className="text-sm text-gray-700 leading-5 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="text-sm text-danger ml-8">{error}</p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }