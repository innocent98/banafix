"use client"

import { Progress } from "@/components/ui/progress"
import { CheckCircle, User, FileText, Eye, CreditCard } from "lucide-react"

const steps = [
  { id: 1, title: "Details", icon: User },
  { id: 2, title: "Policies", icon: FileText },
  { id: 3, title: "Review", icon: Eye },
  { id: 4, title: "Pay", icon: CreditCard },
  { id: 5, title: "Done", icon: CheckCircle },
]

interface ProgressIndicatorProps {
  currentStep: number
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const progress = (currentStep / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto mb-12">
      {/* Step Icons */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                currentStep >= step.id
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                  : "border-slate-300 text-slate-400 bg-white"
              }`}
            >
              {currentStep > step.id ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <step.icon className="h-6 w-6" />
              )}

              {/* Pulse animation for current step */}
              {currentStep === step.id && (
                <div className="absolute inset-0 rounded-full bg-slate-900 opacity-25 animate-ping"></div>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${
                  currentStep > step.id ? "bg-slate-900" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Progress
          value={progress}
          className="h-3 bg-slate-100"
        />
      </div>

      {/* Step Labels */}
      <div className="flex justify-between">
        {steps.map((step) => (
          <div key={step.id} className="text-center flex-1">
            <span
              className={`text-sm font-semibold transition-colors duration-300 ${
                currentStep >= step.id ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {step.title}
            </span>
            {currentStep === step.id && (
              <div className="mt-1 text-xs text-amber-600 font-medium">Current Step</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}