import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const baseStyles =
  "flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return <input ref={ref} type={type} className={cn(baseStyles, className)} {...props} />;
  }
);

Input.displayName = "Input";
