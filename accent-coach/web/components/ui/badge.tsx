import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-brand/15 text-brand",
        variant === "secondary" && "bg-slate-100 text-slate-700",
        variant === "outline" && "border border-slate-200 text-slate-600",
        className
      )}
      {...props}
    />
  );
}
