import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  className?: string;
}

export function ProgressBar({ currentStep, totalSteps, steps, className }: ProgressBarProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                    {
                      "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg": isCompleted,
                      "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl ring-4 ring-blue-200 dark:ring-blue-800": isCurrent,
                      "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium mt-2 text-center max-w-20",
                    {
                      "text-blue-600 dark:text-blue-400": isCurrent,
                      "text-gray-600 dark:text-gray-400": isCompleted,
                      "text-gray-400 dark:text-gray-500": isUpcoming,
                    }
                  )}
                >
                  {step}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-4 rounded-full transition-all duration-300",
                    {
                      "bg-gradient-to-r from-blue-500 to-purple-500": stepNumber < currentStep,
                      "bg-gray-200 dark:bg-gray-700": stepNumber >= currentStep,
                    }
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Progress Text */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
    </div>
  );
}



