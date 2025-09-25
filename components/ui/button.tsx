import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

const baseStyles =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-sky-600 text-white hover:bg-sky-700",
  outline: "border border-border bg-transparent text-foreground hover:bg-muted"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
