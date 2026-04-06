"use client";

import { useWizard } from "@/lib/wizard-context";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Campaign" },
  { num: 3, label: "Mapping" },
  { num: 4, label: "Generate" },
];

export function WizardNavigation() {
  const { state, prevStep, nextStep, goToStep } = useWizard();
  const currentStep = state.step;

  // Determine if step is accessible (can navigate backwards, but not beyond current)
  const canGoToStep = (step: number) => step <= currentStep;

  return (
    <div className="flex items-center justify-between">
      {/* Left Arrow */}
      <button
        onClick={prevStep}
        disabled={currentStep === 1}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-200",
          currentStep === 1
            ? "border-zinc-700 text-zinc-600 cursor-not-allowed"
            : "border-[#e6ff00] text-[#e6ff00] hover:bg-[#e6ff00] hover:text-black"
        )}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Progress Dots */}
      <div className="flex items-center gap-3">
        {STEPS.map((step) => (
          <button
            key={step.num}
            onClick={() => canGoToStep(step.num) && goToStep(step.num)}
            disabled={!canGoToStep(step.num)}
            className={cn(
              "group flex flex-col items-center gap-1.5 transition-all",
              canGoToStep(step.num) ? "cursor-pointer" : "cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "h-3 w-3 rounded-full transition-all duration-200",
                currentStep === step.num
                  ? "bg-[#e6ff00] scale-125"
                  : step.num < currentStep
                  ? "bg-[#e6ff00]/50"
                  : "bg-zinc-700"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                currentStep === step.num
                  ? "text-[#e6ff00]"
                  : step.num < currentStep
                  ? "text-zinc-500"
                  : "text-zinc-600"
              )}
            >
              {step.label}
            </span>
          </button>
        ))}
      </div>

      {/* Step Counter */}
      <div className="text-sm font-mono text-zinc-500">
        <span className="text-[#e6ff00] font-bold">{currentStep}</span>
        <span className="mx-1">/</span>
        <span>4</span>
      </div>

      {/* Right Arrow */}
      <button
        onClick={nextStep}
        disabled={currentStep === 4}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-200",
          currentStep === 4
            ? "border-zinc-700 text-zinc-600 cursor-not-allowed"
            : "border-[#e6ff00] text-[#e6ff00] hover:bg-[#e6ff00] hover:text-black"
        )}
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
