import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepperStep {
  id: string;
  label: string;
}

/**
 * Three-step progress indicator for the studio.
 *
 * Renders as an ordered list so the sequence is conveyed to assistive tech, and
 * marks the current step with aria-current rather than colour alone.
 */
export function Stepper({
  steps,
  currentId,
  completedIds = [],
  onStepClick,
}: {
  steps: StepperStep[];
  currentId: string;
  completedIds?: string[];
  onStepClick?: (id: string) => void;
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentId);

  return (
    <ol className="flex items-center gap-1" aria-label="Writing progress">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentId;
        const isComplete = completedIds.includes(step.id) || index < currentIndex;
        const isReachable = isComplete && Boolean(onStepClick);

        const content = (
          <>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                isCurrent && "border-brand bg-brand text-white",
                !isCurrent && isComplete && "border-brand/30 bg-brand-soft text-brand-ink",
                !isCurrent && !isComplete && "border-line bg-surface text-faint",
              )}
            >
              {isComplete && !isCurrent ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                isCurrent ? "text-ink" : "text-muted",
              )}
            >
              {step.label}
            </span>
          </>
        );

        return (
          <li key={step.id} className="flex items-center gap-1">
            {isReachable ? (
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className="flex items-center gap-2 rounded-control px-1.5 py-1 transition-colors hover:bg-subtle"
              >
                {content}
              </button>
            ) : (
              <span
                className="flex items-center gap-2 px-1.5 py-1"
                aria-current={isCurrent ? "step" : undefined}
              >
                {content}
              </span>
            )}
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-1 h-px w-6 sm:w-10",
                  index < currentIndex ? "bg-brand/30" : "bg-line",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
