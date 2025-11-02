// home/ubuntu/impaktrweb/src/components/ui/switch.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-0 transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "bg-gradient-to-r from-blue-500 to-purple-600"
            : "bg-gray-300 dark:bg-gray-600",
          className
        )}
      >
        <span
          className="pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition-all duration-200 ease-in-out"
          style={{
            transform: checked ? 'translateX(28px)' : 'translateX(4px)'
          }}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };