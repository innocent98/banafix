"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, SlidersHorizontal } from "lucide-react"

interface InstructorFiltersProps {
  searchTerm: string
  selectedSpecialty: string
  selectedLocation: string
  sortBy: string
  onSearchChange: (value: string) => void
  onSpecialtyChange: (value: string) => void
  onLocationChange: (value: string) => void
  onSortChange: (value: string) => void
  resultsCount: number
  totalCount: number
}

export function InstructorFilters({
  searchTerm,
  selectedSpecialty,
  selectedLocation,
  sortBy,
  onSearchChange,
  onSpecialtyChange,
  onLocationChange,
  onSortChange,
  resultsCount,
  totalCount,
}: InstructorFiltersProps) {
  return (
    <section className="py-8 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto px-4">
        {/* Filter Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-2xl">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-slate-900">Find Your Perfect Instructor</h2>
            <p className="text-sm text-slate-600">Filter by specialty, location, and experience level</p>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Search Instructors
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or instrument..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-11 h-12 border-slate-200 rounded-2xl bg-white/70 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Specialty Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Specialty
                </label>
                <Select value={selectedSpecialty} onValueChange={onSpecialtyChange}>
                  <SelectTrigger className="h-12 border-slate-200 rounded-2xl bg-white/70 focus:bg-white">
                    <SelectValue placeholder="All Specialties" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 rounded-2xl">
                    <SelectItem value="all">All Specialties</SelectItem>
                    <SelectItem value="Guitar">🎸 Guitar</SelectItem>
                    <SelectItem value="Piano">🎹 Piano</SelectItem>
                    <SelectItem value="Drums">🥁 Drums</SelectItem>
                    <SelectItem value="Vocals">🎤 Vocals</SelectItem>
                    <SelectItem value="Violin">🎻 Violin</SelectItem>
                    <SelectItem value="Music Production">🎧 Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Location
                </label>
                <Select value={selectedLocation} onValueChange={onLocationChange}>
                  <SelectTrigger className="h-12 border-slate-200 rounded-2xl bg-white/70 focus:bg-white">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 rounded-2xl">
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Lagos">🏙️ Lagos</SelectItem>
                    <SelectItem value="Abuja">🏛️ Abuja</SelectItem>
                    <SelectItem value="Port Harcourt">🏘️ Port Harcourt</SelectItem>
                    <SelectItem value="Ondo">🏞️ Ondo</SelectItem>
                    <SelectItem value="Enugu">🌆 Enugu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger className="h-12 border-slate-200 rounded-2xl bg-white/70 focus:bg-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 rounded-2xl">
                    <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                    <SelectItem value="experience">🎓 Most Experienced</SelectItem>
                    <SelectItem value="students">👥 Most Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Counter */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-blue-600">{resultsCount}</span> of{" "}
                  <span className="font-semibold">{totalCount}</span> instructors
                </span>
              </div>

              {(searchTerm || selectedSpecialty !== "all" || selectedLocation !== "all") && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600 font-medium">Filters active</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}