"use client"

import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle, Target, Download } from "lucide-react"

interface CourseCurriculumProps {
  curriculum: {
    module: number
    title: string
    weeks: string
    outcomes: string[]
    tasks: string[]
  }[]
}

export function CourseCurriculum({ curriculum }: CourseCurriculumProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">Course Curriculum</h3>
          <p className="text-slate-600">Comprehensive learning path designed by industry experts</p>
        </div>
        <Button
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-full px-6 py-3 font-semibold w-fit"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Syllabus (PDF)
        </Button>
      </div>

      {/* Curriculum Modules */}
      <Accordion type="single" collapsible className="w-full space-y-4">
        {curriculum.map((module) => (
          <AccordionItem
            key={module.module}
            value={`module-${module.module}`}
            className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white"
          >
            <AccordionTrigger className="text-left p-6 lg:p-8 hover:no-underline">
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {module.module}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-lg lg:text-xl text-slate-900 mb-1">
                    {module.title}
                  </div>
                  <div className="text-sm lg:text-base text-slate-500 font-medium">{module.weeks}</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 lg:px-8 pb-6 lg:pb-8">
              <div className="pl-16 space-y-6">
                {/* Learning Outcomes */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-amber-500 mr-2" />
                    Learning Outcomes
                  </h4>
                  <div className="space-y-3">
                    {module.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="text-slate-700 leading-relaxed">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practice Tasks */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 text-blue-500 mr-2" />
                    Practice & Assignments
                  </h4>
                  <div className="space-y-3">
                    {module.tasks.map((task, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-2xl">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Target className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-slate-700 leading-relaxed">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Module Progress Indicator */}
                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Module Duration:</span>
                    <span className="font-semibold text-slate-900">{module.weeks}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-600 font-medium">Estimated Study Time:</span>
                    <span className="font-semibold text-slate-900">3-4 hours/week</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Course Completion Info */}
      <div className="p-6 lg:p-8 bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl border border-amber-200">
        <h4 className="font-heading font-bold text-xl text-slate-900 mb-4">Upon Course Completion</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 mb-1">Certificate of Completion</h5>
              <p className="text-sm text-slate-600">Official recognition of your achievement</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 mb-1">Performance Portfolio</h5>
              <p className="text-sm text-slate-600">Showcase your newly acquired skills</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 mb-1">Alumni Network Access</h5>
              <p className="text-sm text-slate-600">Connect with fellow musicians</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 mb-1">Continued Learning Path</h5>
              <p className="text-sm text-slate-600">Advance to intermediate courses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}