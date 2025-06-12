import { cn } from "@/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";

type Step = {
  number: number;
  title: string;
  description?: string;
};

type ProgressTrackerProps = {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (step: number) => void;
  allowBackNavigation?: boolean;
  allowForwardNavigation?: boolean;
};

export function ProgressTracker({
  steps,
  currentStep,
  className,
  onStepClick,
  allowBackNavigation = true,
  allowForwardNavigation = false,
}: ProgressTrackerProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-full flex justify-between items-center">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isClickable = (isCompleted && allowBackNavigation) || 
                            (step.number > currentStep && allowForwardNavigation);
          
          return (
            <div
              key={step.number}
              className={cn(
                "flex flex-col items-center space-y-2 relative",
                isClickable ? "cursor-pointer" : "cursor-default",
              )}
              onClick={() => {
                if (isClickable && onStepClick) {
                  onStepClick(step.number);
                }
              }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute top-4 h-0.5 w-full left-1/2",
                    isCompleted ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
              
              {/* Step circle */}
              <div 
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center z-10",
                  isActive ? "bg-primary text-primary-foreground" : 
                  isCompleted ? "bg-primary text-primary-foreground" : 
                  "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <div className="font-semibold text-sm">{step.number}</div>
                )}
              </div>
              
              {/* Step title */}
              <div 
                className={cn(
                  "text-sm font-medium text-center",
                  isActive ? "text-primary" : 
                  isCompleted ? "text-primary" : 
                  "text-muted-foreground"
                )}
              >
                {step.title}
              </div>
              
              {/* Step description if any */}
              {step.description && (
                <div className="text-xs text-muted-foreground text-center max-w-[120px]">
                  {step.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Animated version with progress bar
export function AnimatedProgressTracker({
  steps,
  currentStep,
  className,
  onStepClick,
  allowBackNavigation = true,
  allowForwardNavigation = false,
}: ProgressTrackerProps) {
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Calculate progress percentage
  useEffect(() => {
    const totalSteps = steps.length;
    const progress = Math.max(0, Math.min(100, ((currentStep - 1) / (totalSteps - 1)) * 100));
    
    // Animate progress
    let timeoutId: NodeJS.Timeout;
    
    // Delay animation slightly for visual effect
    timeoutId = setTimeout(() => {
      setProgressPercent(progress);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [currentStep, steps.length]);
  
  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Steps */}
      <ProgressTracker
        steps={steps}
        currentStep={currentStep}
        onStepClick={onStepClick}
        allowBackNavigation={allowBackNavigation}
        allowForwardNavigation={allowForwardNavigation}
      />
    </div>
  );
}