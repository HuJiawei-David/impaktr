// home/ubuntu/impaktrweb/src/components/ui/badge.tsx

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        sdg: "border-transparent text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  sdgNumber?: number;
}

function Badge({ className, variant, sdgNumber, style, ...props }: BadgeProps) {
  let badgeStyle = style;
  
  if (variant === 'sdg' && sdgNumber) {
    const sdgColors: { [key: number]: string } = {
      1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d', 5: '#ff3a21',
      6: '#26bde2', 7: '#fcc30b', 8: '#a21942', 9: '#fd6925', 10: '#dd1367',
      11: '#fd9d24', 12: '#bf8b2e', 13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b',
      16: '#00689d', 17: '#19486a'
    };
    
    badgeStyle = {
      backgroundColor: sdgColors[sdgNumber] || '#666',
      ...style
    };
  }

  return (
    <div 
      className={cn(badgeVariants({ variant }), className)} 
      style={badgeStyle}
      {...props} 
    />
  );
}

export { Badge, badgeVariants };