import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variantClasses = {
      primary: "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary",
      secondary: "bg-secondary text-white hover:bg-secondary/90 focus-visible:ring-secondary",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-900 focus-visible:ring-gray-900",
      ghost: "hover:bg-gray-100 text-gray-900 focus-visible:ring-gray-900",
      danger: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger"
    }
    
    const sizeClasses = {
      sm: "h-9 px-3 text-sm touch-target",
      md: "h-11 px-6 text-base touch-target-large", 
      lg: "h-14 px-8 text-lg touch-target-large"
    }
    
    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }