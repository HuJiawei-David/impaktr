// home/ubuntu/impaktrweb/src/components/ui/textarea.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <textarea
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-400/20 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm resize-y",
            error 
              ? "border-red-500 dark:border-red-400 focus-visible:ring-red-200 dark:focus-visible:ring-red-900/30 focus-visible:border-red-500" 
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };