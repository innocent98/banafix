"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { InstructorFormModal } from "@/components/admin/instructor-form-modal"
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  X,
  AlertCircle,
  BookOpen,
  User,
  Settings,
  HelpCircle,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Loader2,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface DeliveryMode {
  id: string
  name: string
  order: number
}

interface CourseFormData {
  title: string
  description: string
  instrument: string
  level: string
  duration: string
  location: string
  session: string
  sessionStartDate: string
  availableModes: string[]
  pricing: Record<string, number>
  totalSeats: number
  outcomes: string[]
  equipment: string[]
  image: string
  sampleVideoUrl: string
  sampleVideoTitle: string
  sampleVideoDuration: string
  instructor?: {
    name: string
    bio: string
    experience: string
    credentials: string[]
    rating: number
    availability: string
    verified: boolean
    avatar?: string
  }
  curriculum: {
    title: string
    weeks: string
    outcomes: string[]
    tasks: string[]
  }[]
  faqs: {
    question: string
    answer: string
  }[]
}

const INSTRUMENTS = ['Guitar', 'Piano', 'Drums', 'Vocals', 'Violin', 'Production']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
const LOCATIONS = ['Lagos', 'Abuja', 'Akure', 'Ondo', 'Port Harcourt', 'Ibadan', 'Online', 'Diaspora']

export default function CreateCoursePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    instrument: "",
    level: "",
    duration: "",
    location: "",
    session: "",
    sessionStartDate: "",
    availableModes: [],
    pricing: {},
    totalSeats: 20,
    outcomes: [""],
    equipment: [""],
    image: "",
    sampleVideoUrl: "",
    sampleVideoTitle: "",
    sampleVideoDuration: "",
    instructor: undefined,
    curriculum: [],
    faqs: [],
  })

  useEffect(() => {
    checkAuth()
    loadDeliveryModes()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    }
  }

  const loadDeliveryModes = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("/api/admin/delivery-modes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setDeliveryModes(data.deliveryModes.filter((mode: DeliveryMode) => mode.name))
      }
    } catch (error) {
      console.error("Failed to load delivery modes:", error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleArrayChange = (field: 'outcomes' | 'equipment', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'outcomes' | 'equipment') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }))
  }

  const removeArrayItem = (field: 'outcomes' | 'equipment', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // Instructor management functions
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<any>(null)

  const handleOpenInstructorModal = (instructor?: any) => {
    setEditingInstructor(instructor || null)
    setIsInstructorModalOpen(true)
  }

  const handleCloseInstructorModal = () => {
    setIsInstructorModalOpen(false)
    setEditingInstructor(null)
  }

  const handleInstructorSubmit = async (instructorData: any) => {
    setFormData(prev => ({
      ...prev,
      instructor: instructorData
    }))
    handleCloseInstructorModal()
  }

  // Curriculum management functions
  const [newCurriculumModule, setNewCurriculumModule] = useState({
    title: "",
    weeks: "",
    outcomes: [""],
    tasks: [""],
  })

  const addCurriculumModule = () => {
    if (!newCurriculumModule.title || !newCurriculumModule.weeks) {
      setError("Module title and weeks are required")
      return
    }

    setFormData(prev => ({
      ...prev,
      curriculum: [...prev.curriculum, {
        ...newCurriculumModule,
        outcomes: newCurriculumModule.outcomes.filter(o => o.trim()),
        tasks: newCurriculumModule.tasks.filter(t => t.trim()),
      }]
    }))

    setNewCurriculumModule({ title: "", weeks: "", outcomes: [""], tasks: [""] })
    setError("")
  }

  const removeCurriculumModule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      curriculum: prev.curriculum.filter((_, i) => i !== index)
    }))
  }

  const handleCurriculumArrayChange = (field: 'outcomes' | 'tasks', index: number, value: string) => {
    setNewCurriculumModule(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addCurriculumArrayItem = (field: 'outcomes' | 'tasks') => {
    setNewCurriculumModule(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }))
  }

  const removeCurriculumArrayItem = (field: 'outcomes' | 'tasks', index: number) => {
    setNewCurriculumModule(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // FAQ management functions
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" })

  const addFAQ = () => {
    if (!newFAQ.question || !newFAQ.answer) {
      setError("Both question and answer are required")
      return
    }

    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, newFAQ]
    }))

    setNewFAQ({ question: "", answer: "" })
    setError("")
  }

  const removeFAQ = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }))
  }

  const handleModeChange = (modeName: string, checked: boolean) => {
    setFormData(prev => {
      const newModes = checked
        ? [...prev.availableModes, modeName]
        : prev.availableModes.filter(mode => mode !== modeName)

      // Update pricing - remove pricing for unchecked modes
      const newPricing = { ...prev.pricing }
      if (!checked) {
        delete newPricing[modeName]
      }

      return {
        ...prev,
        availableModes: newModes,
        pricing: newPricing
      }
    })
  }

  const handlePricingChange = (modeName: string, price: number) => {
    setFormData(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [modeName]: price }
    }))
  }

  const validateForm = () => {
    if (!formData.title || !formData.instrument || !formData.level || !formData.duration) {
      setError("Please fill in all required fields (Title, Instrument, Level, Duration)")
      return false
    }

    if (formData.availableModes.length === 0) {
      setError("Please select at least one delivery mode")
      return false
    }

    // Check if all selected modes have pricing
    for (const mode of formData.availableModes) {
      if (!formData.pricing[mode] || formData.pricing[mode] <= 0) {
        setError(`Please set a price for ${mode} delivery mode`)
        return false
      }
    }

    // Optional validation for instructor
    if (formData.instructor) {
      if (!formData.instructor.name || !formData.instructor.experience) {
        setError("Instructor name and experience are required when an instructor is assigned")
        return false
      }
    }

    // Optional validation for curriculum modules
    for (let i = 0; i < formData.curriculum.length; i++) {
      const module = formData.curriculum[i]
      if (!module.title || !module.weeks) {
        setError(`Module ${i + 1} is incomplete. Please provide title and weeks.`)
        return false
      }
    }

    // Optional validation for FAQs
    for (let i = 0; i < formData.faqs.length; i++) {
      const faq = formData.faqs[i]
      if (!faq.question || !faq.answer) {
        setError(`FAQ ${i + 1} is incomplete. Please provide both question and answer.`)
        return false
      }
    }

    return true
  }

  const handleSave = async (publish = false) => {
    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          outcomes: formData.outcomes.filter(item => item.trim()),
          equipment: formData.equipment.filter(item => item.trim()),
          sessionStartDate: formData.sessionStartDate || null,
          instructor: formData.instructor || null,
          curriculum: formData.curriculum || [],
          faqs: formData.faqs || [],
          isPublished: publish,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create course")
      }

      setSuccess(`Course ${publish ? 'created and published' : 'saved as draft'} successfully!`)

      // Redirect to course editing page after a short delay
      setTimeout(() => {
        router.push(`/admin/courses/${data.course.id}/edit`)
      }, 1500)

    } catch (err: any) {
      setError(err.message || "Failed to save course")
    } finally {
      setIsLoading(false)
    }
  }

  const isTabComplete = (tab: string) => {
    switch (tab) {
      case "basic":
        return !!(formData.title && formData.instrument && formData.level && formData.duration)
      case "delivery":
        return formData.availableModes.length > 0 && formData.availableModes.every(mode => formData.pricing[mode] > 0)
      case "content":
        return formData.outcomes.some(o => o.trim()) && formData.equipment.some(e => e.trim())
      case "instructor":
        return !!formData.instructor
      case "curriculum":
        return formData.curriculum.length > 0 && formData.curriculum.every(m => m.title && m.weeks)
      case "faqs":
        return formData.faqs.length > 0 && formData.faqs.every(f => f.question && f.answer)
      default:
        return false
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-bold">
                Create New Course
              </h1>
              <p className="text-muted-foreground">Build your course step by step</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Save & Publish
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full h-auto grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              {isTabComplete("basic") ? <CheckCircle className="h-4 w-4 text-green-600" /> : <BookOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">Basic Info</span>
              <span className="sm:hidden">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              {isTabComplete("delivery") ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Settings className="h-4 w-4" />}
              <span className="hidden sm:inline">Delivery & Pricing</span>
              <span className="sm:hidden">Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              {isTabComplete("content") ? <CheckCircle className="h-4 w-4 text-green-600" /> : <BookOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">Course Content</span>
              <span className="sm:hidden">Content</span>
            </TabsTrigger>
            <TabsTrigger value="instructor" className="flex items-center gap-2">
              {isTabComplete("instructor") ? <CheckCircle className="h-4 w-4 text-green-600" /> : <User className="h-4 w-4" />}
              <span className="hidden sm:inline">Instructor</span>
              <span className="sm:hidden">Teacher</span>
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="flex items-center gap-2">
              {isTabComplete("curriculum") ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Settings className="h-4 w-4" />}
              <span className="hidden sm:inline">Curriculum</span>
              <span className="sm:hidden">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-2">
              {isTabComplete("faqs") ? <CheckCircle className="h-4 w-4 text-green-600" /> : <HelpCircle className="h-4 w-4" />}
              <span className="hidden sm:inline">FAQs</span>
              <span className="sm:hidden">FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
              <span className="sm:hidden">Time</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold">
                      Course Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., Guitar Fundamentals"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instrument" className="text-sm font-semibold">
                      Instrument *
                    </Label>
                    <Select
                      value={formData.instrument}
                      onValueChange={(value) => handleInputChange("instrument", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select instrument" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTRUMENTS.map((instrument) => (
                          <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="level" className="text-sm font-semibold">
                      Level *
                    </Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => handleInputChange("level", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration" className="text-sm font-semibold">
                      Duration *
                    </Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", e.target.value)}
                      placeholder="e.g., 12 weeks"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-semibold">
                      Location
                    </Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => handleInputChange("location", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="totalSeats" className="text-sm font-semibold">
                      Total Seats
                    </Label>
                    <Input
                      id="totalSeats"
                      type="number"
                      value={formData.totalSeats}
                      onChange={(e) => handleInputChange("totalSeats", parseInt(e.target.value) || 20)}
                      min="1"
                      max="100"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what students will learn in this course..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                  <div>
                    <Label htmlFor="image" className="text-sm font-semibold">
                      Course Image URL
                    </Label>
                    <div className="flex gap-4 items-start mt-2">
                      <div className="flex-1">
                        <Input
                          id="image"
                          value={formData.image}
                          onChange={(e) => handleInputChange("image", e.target.value)}
                          placeholder="https://example.com/course-image.jpg"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Provide a direct URL to an image (JPG, PNG, WebP)
                        </p>
                      </div>
                      {formData.image && (
                        <div className="w-24 h-24 rounded-lg border overflow-hidden bg-muted flex-shrink-0 relative">
                          <img 
                            src={formData.image} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Invalid+Image"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery & Pricing Tab */}
          <TabsContent value="delivery" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Modes & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold mb-4 block">
                    Available Delivery Modes *
                  </Label>
                  {deliveryModes.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-muted/50">
                      <p className="text-muted-foreground mb-4">No delivery modes found.</p>
                      <Button 
                        onClick={async () => {
                          try {
                            setIsLoading(true)
                            const token = localStorage.getItem("admin_token")
                            const res = await fetch("/api/admin/delivery-modes/seed", {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` }
                            })
                            if (res.ok) {
                              await loadDeliveryModes()
                              setSuccess("Delivery modes seeded successfully")
                            } else {
                              setError("Failed to seed delivery modes")
                            }
                          } catch (err) {
                            setError("An error occurred")
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                        variant="outline"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                        Seed Default Modes
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliveryModes.map((mode) => (
                      <div key={mode.id} className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={mode.id}
                            checked={formData.availableModes.includes(mode.name)}
                            onCheckedChange={(checked) =>
                              handleModeChange(mode.name, checked as boolean)
                            }
                          />
                          <Label htmlFor={mode.id} className="font-medium">
                            {mode.name}
                          </Label>
                        </div>

                        {formData.availableModes.includes(mode.name) && (
                          <div className="ml-6">
                            <Label className="text-sm text-slate-600">
                              Price (₦)
                            </Label>
                            <Input
                              type="number"
                              value={formData.pricing[mode.name] || ""}
                              onChange={(e) =>
                                handlePricingChange(mode.name, parseInt(e.target.value) || 0)
                              }
                              placeholder="25000"
                              min="0"
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Content Tab */}
          <TabsContent value="content" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input
                        value={outcome}
                        onChange={(e) => handleArrayChange("outcomes", index, e.target.value)}
                        placeholder={`Learning outcome ${index + 1}`}
                      />
                      {formData.outcomes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem("outcomes", index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem("outcomes")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Learning Outcome
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.equipment.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange("equipment", index, e.target.value)}
                        placeholder={`Equipment item ${index + 1}`}
                      />
                      {formData.equipment.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem("equipment", index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem("equipment")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sample Video Card */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Lesson Video (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Video URL</Label>
                  <Input
                    value={formData.sampleVideoUrl}
                    onChange={(e) => handleInputChange("sampleVideoUrl", e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Supports YouTube, Vimeo, or direct video file URLs
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Video Title</Label>
                    <Input
                      value={formData.sampleVideoTitle}
                      onChange={(e) => handleInputChange("sampleVideoTitle", e.target.value)}
                      placeholder="e.g., Your First Guitar Lesson"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Duration</Label>
                    <Input
                      value={formData.sampleVideoDuration}
                      onChange={(e) => handleInputChange("sampleVideoDuration", e.target.value)}
                      placeholder="e.g., 3:45"
                      className="mt-2"
                    />
                  </div>
                </div>

                {formData.sampleVideoUrl && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <h4 className="font-semibold text-blue-900 mb-2">Preview</h4>
                    <p className="text-sm text-blue-700">
                      Video URL: {formData.sampleVideoUrl}
                    </p>
                    {formData.sampleVideoTitle && (
                      <p className="text-sm text-blue-700">
                        Title: {formData.sampleVideoTitle}
                      </p>
                    )}
                    {formData.sampleVideoDuration && (
                      <p className="text-sm text-blue-700">
                        Duration: {formData.sampleVideoDuration}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instructor Tab */}
          <TabsContent value="instructor" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Instructor Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.instructor ? (
                  <div className="space-y-6">
                    {/* Instructor Display Card */}
                    <div className="border rounded-lg p-6 bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarFallback className="text-lg font-bold bg-amber-100 text-amber-800">
                              {formData.instructor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900">{formData.instructor.name}</h3>
                            <p className="text-slate-600">{formData.instructor.experience}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {formData.instructor.verified && (
                                <Badge variant="secondary" className="text-xs">Verified</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                ★ {formData.instructor.rating || 0}/5
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInstructorModal(formData.instructor)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>

                      {formData.instructor.bio && (
                        <p className="text-slate-700 mt-4">{formData.instructor.bio}</p>
                      )}

                      {formData.instructor.credentials && formData.instructor.credentials.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-700 mb-2">Credentials:</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.instructor.credentials.map((credential, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {credential}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {formData.instructor.availability && (
                        <p className="text-sm text-slate-600 mt-2">
                          <strong>Availability:</strong> {formData.instructor.availability}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <User className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No Instructor Assigned</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Add an instructor to provide teaching expertise for this course.
                      Students will be able to see instructor information and credentials.
                    </p>
                    <Button
                      onClick={() => handleOpenInstructorModal()}
                      className="min-w-[140px]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Instructor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Existing Modules</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.curriculum.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No modules added yet. Use the form below to add your first module.
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {formData.curriculum.map((module, index) => (
                      <AccordionItem key={index} value={`module-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-4 text-left">
                            <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{module.title}</p>
                              <p className="text-xs text-muted-foreground">{module.weeks}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Learning Outcomes</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {module.outcomes.map((outcome, i) => (
                                <li key={i}>{outcome}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Tasks & Assignments</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {module.tasks.map((task, i) => (
                                <li key={i}>{task}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex justify-end pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCurriculumModule(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Module
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>

            {/* Add New Module */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Module Title</Label>
                    <Input
                      value={newCurriculumModule.title}
                      onChange={(e) => setNewCurriculumModule(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Guitar Basics & First Chords"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Weeks</Label>
                    <Input
                      value={newCurriculumModule.weeks}
                      onChange={(e) => setNewCurriculumModule(prev => ({ ...prev, weeks: e.target.value }))}
                      placeholder="e.g., Weeks 1-2"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-3 block">Learning Outcomes</Label>
                  <div className="space-y-2">
                    {newCurriculumModule.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={outcome}
                          onChange={(e) => handleCurriculumArrayChange("outcomes", index, e.target.value)}
                          placeholder={`Outcome ${index + 1}`}
                        />
                        {newCurriculumModule.outcomes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCurriculumArrayItem("outcomes", index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addCurriculumArrayItem("outcomes")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Outcome
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-3 block">Tasks</Label>
                  <div className="space-y-2">
                    {newCurriculumModule.tasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={task}
                          onChange={(e) => handleCurriculumArrayChange("tasks", index, e.target.value)}
                          placeholder={`Task ${index + 1}`}
                        />
                        {newCurriculumModule.tasks.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCurriculumArrayItem("tasks", index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addCurriculumArrayItem("tasks")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>

                <Button onClick={addCurriculumModule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course FAQs ({formData.faqs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.faqs.length > 0 ? (
                  <div className="space-y-4">
                    {formData.faqs.map((faq, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{faq.question}</h3>
                            <p className="text-slate-600">{faq.answer}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFAQ(index)}
                            className="ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No FAQs Yet</h3>
                    <p className="text-slate-600">Add your first FAQ below</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add New FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Add New FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Question</Label>
                  <Input
                    value={newFAQ.question}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="e.g., Do I need my own guitar to start?"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Answer</Label>
                  <Textarea
                    value={newFAQ.answer}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Provide a detailed answer..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
                <Button onClick={addFAQ}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="session" className="text-sm font-semibold">
                      Session Name
                    </Label>
                    <Input
                      id="session"
                      value={formData.session}
                      onChange={(e) => handleInputChange("session", e.target.value)}
                      placeholder="e.g., Spring 2025, Fall 2024"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sessionStartDate" className="text-sm font-semibold">
                      Session Start Date
                    </Label>
                    <Input
                      id="sessionStartDate"
                      type="date"
                      value={formData.sessionStartDate}
                      onChange={(e) => handleInputChange("sessionStartDate", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            {activeTab === "basic" && "1 of 7 - Basic Information"}
            {activeTab === "delivery" && "2 of 7 - Delivery & Pricing"}
            {activeTab === "content" && "3 of 7 - Course Content"}
            {activeTab === "instructor" && "4 of 7 - Instructor"}
            {activeTab === "curriculum" && "5 of 7 - Curriculum"}
            {activeTab === "faqs" && "6 of 7 - FAQs"}
            {activeTab === "schedule" && "7 of 7 - Schedule"}
          </div>

          <div className="flex gap-3">
            {activeTab !== "basic" && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabs = ["basic", "delivery", "content", "instructor", "curriculum", "faqs", "schedule"]
                  const currentIndex = tabs.indexOf(activeTab)
                  setActiveTab(tabs[currentIndex - 1])
                }}
              >
                Previous
              </Button>
            )}

            {activeTab !== "schedule" && (
              <Button
                onClick={() => {
                  const tabs = ["basic", "delivery", "content", "instructor", "curriculum", "faqs", "schedule"]
                  const currentIndex = tabs.indexOf(activeTab)
                  setActiveTab(tabs[currentIndex + 1])
                }}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Instructor Form Modal */}
        <InstructorFormModal
          isOpen={isInstructorModalOpen}
          onClose={handleCloseInstructorModal}
          onSubmit={handleInstructorSubmit}
          initialData={editingInstructor}
          isLoading={false}
        />
      </div>
    </AdminLayout>
  )
}