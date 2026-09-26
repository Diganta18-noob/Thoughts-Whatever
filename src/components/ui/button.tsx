"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-card font-ui font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-surface shadow-card hover:bg-accent/90",
        secondary:
          "border border-rule bg-surface-raised text-content shadow-card hover:bg-rule/40",
        ghost: "text-content-soft hover:bg-rule/40 hover:text-content",
        danger: "bg-danger text-surface shadow-card hover:bg-danger/90",
      },
      size: {
        sm: "h-8 px-3 text-step-0",
        md: "h-9 px-4 text-step-0",
        lg: "h-11 px-6 text-step-1",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
