"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface DeliveryMode {
  id: string
  name: string
  order: number
}

interface CourseFilterProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  selectedInstrument: string
  setSelectedInstrument: (value: string) => void
  selectedLevel: string
  setSelectedLevel: (value: string) => void
  selectedType: string
  setSelectedType: (value: string) => void
  selectedLocation: string
  setSelectedLocation: (value: string) => void
  filteredCourses: any[]
  totalCourses: number
  deliveryModes: DeliveryMode[]
}

export function CourseFilter({
  searchTerm,
  setSearchTerm,
  selectedInstrument,
  setSelectedInstrument,
  selectedLevel,
  setSelectedLevel,
  selectedType,
  setSelectedType,
  selectedLocation,
  setSelectedLocation,
  filteredCourses,
  totalCourses,
  deliveryModes,
}: CourseFilterProps) {
  return (
    <section className="py-8 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search courses or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 rounded-full shadow-sm"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3 lg:gap-4">
            <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
              <SelectTrigger className="w-44 h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 rounded-full shadow-sm">
                <SelectValue placeholder="Instrument" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instruments</SelectItem>
                <SelectItem value="Guitar">Guitar</SelectItem>
                <SelectItem value="Piano">Piano</SelectItem>
                <SelectItem value="Drums">Drums</SelectItem>
                <SelectItem value="Vocals">Vocals</SelectItem>
                <SelectItem value="Violin">Violin</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-36 h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 rounded-full shadow-sm">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-44 h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 rounded-full shadow-sm">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                {deliveryModes.map((mode) => (
                  <SelectItem key={mode.id} value={mode.name}>
                    {mode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-36 h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 rounded-full shadow-sm">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Lagos">Lagos</SelectItem>
                <SelectItem value="Abuja">Abuja</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-6 text-center lg:text-left">
          <p className="text-slate-600 font-medium">
            Showing <span className="font-bold text-slate-900">{filteredCourses.length}</span> of{" "}
            <span className="font-bold text-slate-900">{totalCourses}</span> courses
          </p>
        </div>
      </div>
    </section>
  )
}