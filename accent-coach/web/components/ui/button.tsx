import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-brand text-white shadow-sm hover:bg-brand-dark",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-brand hover:bg-brand/10",
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-full px-4 text-sm",
  md: "h-11 rounded-full px-5 text-sm",
  lg: "h-12 rounded-full px-6 text-base",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={cn(
          "inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-md",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
