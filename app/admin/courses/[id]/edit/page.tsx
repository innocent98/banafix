"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
  GripVertical,
} from "lucide-react"

interface Course {
  id: string
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
  seatsLeft: number
  outcomes: string[]
  equipment: string[]
  image: string
  sampleVideoUrl?: string
  sampleVideoTitle?: string
  sampleVideoDuration?: string
  isPublished: boolean
  isActive: boolean
  instructor?: {
    id: string
    name: string
    bio: string
    avatar: string
    credentials: string[]
    rating: number
    experience: string
    availability: string
    verified: boolean
  }
  curriculum: {
    id: string
    module: number
    title: string
    weeks: string
    outcomes: string[]
    tasks: string[]
    order: number
  }[]
  faqs: {
    id: string
    question: string
    answer: string
    order: number
  }[]
}

interface DeliveryMode {
  id: string
  name: string
  order: number
}

const INSTRUMENTS = ['Guitar', 'Piano', 'Drums', 'Vocals', 'Violin', 'Production']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
const LOCATIONS = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Online']

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states for new items
  const [newCurriculumModule, setNewCurriculumModule] = useState({
    title: "",
    weeks: "",
    outcomes: [""],
    tasks: [""],
  })
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" })

  // Helper functions for delivery modes and pricing
  const handleModeChange = (modeName: string, checked: boolean) => {
    setCourse(prev => {
      if (!prev) return prev
      const newModes = checked
        ? [...(prev.availableModes || []), modeName]
        : (prev.availableModes || []).filter(mode => mode !== modeName)

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
    setCourse(prev => {
      if (!prev) return prev
      return {
        ...prev,
        pricing: { ...prev.pricing, [modeName]: price }
      }
    })
  }

  // Helper functions for arrays (outcomes, equipment)
  const handleArrayChange = (field: 'outcomes' | 'equipment', index: number, value: string) => {
    setCourse(prev => {
      if (!prev) return prev
      const currentArray = prev[field] || []
      return {
        ...prev,
        [field]: currentArray.map((item, i) => i === index ? value : item)
      }
    })
  }

  const addArrayItem = (field: 'outcomes' | 'equipment') => {
    setCourse(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: [...(prev[field] || []), ""]
      }
    })
  }

  const removeArrayItem = (field: 'outcomes' | 'equipment', index: number) => {
    setCourse(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: (prev[field] || []).filter((_, i) => i !== index)
      }
    })
  }

  // Instructor modal state
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    loadDeliveryModes()
    loadCourse()
  }, [courseId])

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

  const loadCourse = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCourse(data.course)
      } else {
        setError("Failed to load course")
      }
    } catch (error) {
      setError("Failed to load course")
    } finally {
      setIsLoading(false)
    }
  }

  const updateCourse = async (updates: Partial<Course>) => {
    setIsSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const data = await response.json()
        setCourse(data.course)
        setSuccess("Course updated successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update course")
      }
    } catch (error) {
      setError("Failed to update course")
    } finally {
      setIsSaving(false)
    }
  }

  const updateInstructor = async (instructorData: any) => {
    setIsSaving(true)

    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/courses/${courseId}/instructor`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(instructorData),
      })

      if (response.ok) {
        await loadCourse() // Reload to get updated data
        setSuccess("Instructor updated successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update instructor")
      }
    } catch (error) {
      setError("Failed to update instructor")
    } finally {
      setIsSaving(false)
    }
  }

  // Instructor modal handlers
  const handleOpenInstructorModal = (instructor?: any) => {
    setEditingInstructor(instructor || null)
    setIsInstructorModalOpen(true)
  }

  const handleCloseInstructorModal = () => {
    setIsInstructorModalOpen(false)
    setEditingInstructor(null)
  }

  const handleInstructorSubmit = async (instructorData: any) => {
    await updateInstructor(instructorData)
  }

  const addCurriculumModule = async () => {
    if (!newCurriculumModule.title || !newCurriculumModule.weeks) {
      setError("Module title and weeks are required")
      return
    }

    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/courses/${courseId}/curriculum`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newCurriculumModule,
          outcomes: newCurriculumModule.outcomes.filter(o => o.trim()),
          tasks: newCurriculumModule.tasks.filter(t => t.trim()),
        }),
      })

      if (response.ok) {
        await loadCourse()
        setNewCurriculumModule({ title: "", weeks: "", outcomes: [""], tasks: [""] })
        setSuccess("Module added successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to add module")
      }
    } catch (error) {
      setError("Failed to add module")
    }
  }

  const deleteCurriculumModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return

    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/courses/${courseId}/curriculum/${moduleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        await loadCourse()
        setSuccess("Module deleted successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("Failed to delete module")
      }
    } catch (error) {
      setError("Failed to delete module")
    }
  }

  const addFAQ = async () => {
    if (!newFAQ.question || !newFAQ.answer) {
      setError("Both question and answer are required")
      return
    }

    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/courses/${courseId}/faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFAQ),
      })

      if (response.ok) {
        await loadCourse()
        setNewFAQ({ question: "", answer: "" })
        setSuccess("FAQ added successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to add FAQ")
      }
    } catch (error) {
      setError("Failed to add FAQ")
    }
  }

  const deleteFAQ = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return

    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/courses/${courseId}/faqs/${faqId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        await loadCourse()
        setSuccess("FAQ deleted successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("Failed to delete FAQ")
      }
    } catch (error) {
      setError("Failed to delete FAQ")
    }
  }

  const togglePublish = async () => {
    await updateCourse({ isPublished: !course?.isPublished })
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!course) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/admin/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-heading font-bold">
                  {course.title}
                </h1>
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
                {!course.isActive && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{course.instrument} • {course.level} • {course.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={togglePublish}
              disabled={isSaving}
            >
              <Eye className="h-4 w-4 mr-2" />
              {course.isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button
              onClick={() => window.open(`/courses/${courseId}`, '_blank')}
              variant="outline"
            >
              Preview
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

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full h-auto grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Basic Info</span>
                <span className="sm:hidden">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Delivery & Pricing</span>
                <span className="sm:hidden">Delivery</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Course Content</span>
                <span className="sm:hidden">Content</span>
              </TabsTrigger>
              <TabsTrigger value="instructor" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Instructor</span>
                <span className="sm:hidden">Teacher</span>
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Curriculum</span>
                <span className="sm:hidden">Modules</span>
              </TabsTrigger>
              <TabsTrigger value="faqs" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">FAQs</span>
                <span className="sm:hidden">FAQs</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
                <span className="sm:hidden">Time</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Config</span>
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
                        value={course.title}
                        onChange={(e) => setCourse(prev => ({ ...prev!, title: e.target.value }))}
                        placeholder="e.g., Guitar Fundamentals"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instrument" className="text-sm font-semibold">
                        Instrument *
                      </Label>
                      <Select
                        value={course.instrument}
                        onValueChange={(value) => setCourse(prev => ({ ...prev!, instrument: value }))}
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
                        value={course.level}
                        onValueChange={(value) => setCourse(prev => ({ ...prev!, level: value }))}
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
                        value={course.duration}
                        onChange={(e) => setCourse(prev => ({ ...prev!, duration: e.target.value }))}
                        placeholder="e.g., 12 weeks"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location" className="text-sm font-semibold">
                        Location
                      </Label>
                      <Select
                        value={course.location}
                        onValueChange={(value) => setCourse(prev => ({ ...prev!, location: value }))}
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
                        value={course.totalSeats}
                        onChange={(e) => setCourse(prev => ({ ...prev!, totalSeats: parseInt(e.target.value) || 20 }))}
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
                      value={course.description || ""}
                      onChange={(e) => setCourse(prev => ({ ...prev!, description: e.target.value }))}
                      placeholder="Describe what students will learn in this course..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="image" className="text-sm font-semibold">
                      Course Image URL
                    </Label>
                    <Input
                      id="image"
                      value={course.image || ""}
                      onChange={(e) => setCourse(prev => ({ ...prev!, image: e.target.value }))}
                      placeholder="https://example.com/course-image.jpg"
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={() => updateCourse({
                      title: course.title,
                      instrument: course.instrument,
                      level: course.level,
                      duration: course.duration,
                      location: course.location,
                      totalSeats: course.totalSeats,
                      description: course.description,
                      image: course.image,
                    })}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Basic Info
                  </Button>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliveryModes.map((mode) => (
                        <div key={mode.id} className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={mode.id}
                              checked={course.availableModes?.includes(mode.name) || false}
                              onCheckedChange={(checked) =>
                                handleModeChange(mode.name, checked as boolean)
                              }
                            />
                            <Label htmlFor={mode.id} className="font-medium">
                              {mode.name}
                            </Label>
                          </div>
                          {course.availableModes?.includes(mode.name) && (
                            <div className="ml-6">
                              <Label className="text-sm text-slate-600">
                                Price (₦)
                              </Label>
                              <Input
                                type="number"
                                value={course.pricing?.[mode.name] || ""}
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
                  </div>

                  <Button
                    onClick={() => updateCourse({
                      availableModes: course.availableModes,
                      pricing: course.pricing,
                    })}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Delivery & Pricing
                  </Button>
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
                    {(course.outcomes && course.outcomes.length > 0 ? course.outcomes : [""]).map((outcome, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Input
                          value={outcome}
                          onChange={(e) => handleArrayChange("outcomes", index, e.target.value)}
                          placeholder={`Learning outcome ${index + 1}`}
                        />
                        {(course.outcomes?.length || 1) > 1 && (
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
                    {(course.equipment && course.equipment.length > 0 ? course.equipment : [""]).map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Input
                          value={item}
                          onChange={(e) => handleArrayChange("equipment", index, e.target.value)}
                          placeholder={`Equipment item ${index + 1}`}
                        />
                        {(course.equipment?.length || 1) > 1 && (
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

                  <Button
                    onClick={() => updateCourse({
                      outcomes: (course.outcomes || []).filter(item => item.trim()),
                      equipment: (course.equipment || []).filter(item => item.trim()),
                      sampleVideoUrl: course.sampleVideoUrl,
                      sampleVideoTitle: course.sampleVideoTitle,
                      sampleVideoDuration: course.sampleVideoDuration,
                    })}
                    disabled={isSaving}
                    className="mt-6"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Course Content
                  </Button>
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
                      value={course.sampleVideoUrl || ""}
                      onChange={(e) => setCourse(prev => ({ ...prev!, sampleVideoUrl: e.target.value }))}
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
                        value={course.sampleVideoTitle || ""}
                        onChange={(e) => setCourse(prev => ({ ...prev!, sampleVideoTitle: e.target.value }))}
                        placeholder="e.g., Your First Guitar Lesson"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Duration</Label>
                      <Input
                        value={course.sampleVideoDuration || ""}
                        onChange={(e) => setCourse(prev => ({ ...prev!, sampleVideoDuration: e.target.value }))}
                        placeholder="e.g., 3:45"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {course.sampleVideoUrl && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                      <h4 className="font-semibold text-blue-900 mb-2">Preview</h4>
                      <p className="text-sm text-blue-700">
                        Video URL: {course.sampleVideoUrl}
                      </p>
                      {course.sampleVideoTitle && (
                        <p className="text-sm text-blue-700">
                          Title: {course.sampleVideoTitle}
                        </p>
                      )}
                      {course.sampleVideoDuration && (
                        <p className="text-sm text-blue-700">
                          Duration: {course.sampleVideoDuration}
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
                  <CardTitle>Instructor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {course.instructor ? (
                    <div className="space-y-6">
                      {/* Instructor Display Card */}
                      <div className="border rounded-lg p-6 bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-16 h-16">
                              <AvatarFallback className="text-lg font-bold bg-amber-100 text-amber-800">
                                {course.instructor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg text-slate-900">{course.instructor.name}</h3>
                              <p className="text-slate-600">{course.instructor.experience}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {course.instructor.verified && (
                                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  ★ {course.instructor.rating || 0}/5
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInstructorModal(course.instructor)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>

                        {course.instructor.bio && (
                          <p className="text-slate-700 mt-4">{course.instructor.bio}</p>
                        )}

                        {course.instructor.credentials && course.instructor.credentials.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-slate-700 mb-2">Credentials:</p>
                            <div className="flex flex-wrap gap-2">
                              {course.instructor.credentials.map((credential, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {credential}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {course.instructor.availability && (
                          <p className="text-sm text-slate-600 mt-2">
                            <strong>Availability:</strong> {course.instructor.availability}
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
              {/* Existing Modules */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Modules ({course.curriculum.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.curriculum.length > 0 ? (
                    <div className="space-y-4">
                      {course.curriculum
                        .sort((a, b) => a.order - b.order)
                        .map((module) => (
                          <div key={module.id} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">Module {module.module}</Badge>
                                  <h3 className="font-semibold">{module.title}</h3>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">{module.weeks}</p>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-sm font-medium text-slate-700">Outcomes:</span>
                                    <ul className="text-sm text-slate-600 ml-4">
                                      {module.outcomes.map((outcome, i) => (
                                        <li key={i}>• {outcome}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-slate-700">Tasks:</span>
                                    <ul className="text-sm text-slate-600 ml-4">
                                      {module.tasks.map((task, i) => (
                                        <li key={i}>• {task}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteCurriculumModule(module.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Modules Yet</h3>
                      <p className="text-slate-600">Add your first curriculum module below</p>
                    </div>
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
                            onChange={(e) => {
                              const newOutcomes = [...newCurriculumModule.outcomes]
                              newOutcomes[index] = e.target.value
                              setNewCurriculumModule(prev => ({ ...prev, outcomes: newOutcomes }))
                            }}
                            placeholder={`Outcome ${index + 1}`}
                          />
                          {newCurriculumModule.outcomes.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOutcomes = newCurriculumModule.outcomes.filter((_, i) => i !== index)
                                setNewCurriculumModule(prev => ({ ...prev, outcomes: newOutcomes }))
                              }}
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
                        onClick={() => setNewCurriculumModule(prev => ({ ...prev, outcomes: [...prev.outcomes, ""] }))}
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
                            onChange={(e) => {
                              const newTasks = [...newCurriculumModule.tasks]
                              newTasks[index] = e.target.value
                              setNewCurriculumModule(prev => ({ ...prev, tasks: newTasks }))
                            }}
                            placeholder={`Task ${index + 1}`}
                          />
                          {newCurriculumModule.tasks.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newTasks = newCurriculumModule.tasks.filter((_, i) => i !== index)
                                setNewCurriculumModule(prev => ({ ...prev, tasks: newTasks }))
                              }}
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
                        onClick={() => setNewCurriculumModule(prev => ({ ...prev, tasks: [...prev.tasks, ""] }))}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </div>

                  <Button onClick={addCurriculumModule} disabled={isSaving}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs" className="space-y-6 mt-6">
              {/* Existing FAQs */}
              <Card>
                <CardHeader>
                  <CardTitle>Course FAQs ({course.faqs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.faqs.length > 0 ? (
                    <div className="space-y-4">
                      {course.faqs
                        .sort((a, b) => a.order - b.order)
                        .map((faq) => (
                          <div key={faq.id} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2">{faq.question}</h3>
                                <p className="text-slate-600">{faq.answer}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteFAQ(faq.id)}
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
                  <Button onClick={addFAQ} disabled={isSaving}>
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
                        value={course.session || ""}
                        onChange={(e) => setCourse(prev => ({ ...prev!, session: e.target.value }))}
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
                        value={course.sessionStartDate ? new Date(course.sessionStartDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setCourse(prev => ({ ...prev!, sessionStartDate: e.target.value }))}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => updateCourse({
                      session: course.session,
                      sessionStartDate: course.sessionStartDate,
                    })}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Schedule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Publication Status</h3>
                      <p className="text-sm text-slate-600">
                        {course.isPublished ? "This course is live and visible to students" : "This course is saved as a draft"}
                      </p>
                    </div>
                    <Button
                      onClick={togglePublish}
                      variant={course.isPublished ? "outline" : "primary"}
                      disabled={isSaving}
                    >
                      {course.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Course Status</h3>
                      <p className="text-sm text-slate-600">
                        {course.isActive ? "Course is active and accepting enrollments" : "Course is inactive"}
                      </p>
                    </div>
                    <Button
                      onClick={() => updateCourse({ isActive: !course.isActive })}
                      variant={course.isActive ? "outline" : "primary"}
                      disabled={isSaving}
                    >
                      {course.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              {activeTab === "basic" && "1 of 8 - Basic Information"}
              {activeTab === "delivery" && "2 of 8 - Delivery & Pricing"}
              {activeTab === "content" && "3 of 8 - Course Content"}
              {activeTab === "instructor" && "4 of 8 - Instructor"}
              {activeTab === "curriculum" && "5 of 8 - Curriculum"}
              {activeTab === "faqs" && "6 of 8 - FAQs"}
              {activeTab === "schedule" && "7 of 8 - Schedule"}
              {activeTab === "settings" && "8 of 8 - Settings"}
            </div>

            <div className="flex gap-3">
              {activeTab !== "basic" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "delivery", "content", "instructor", "curriculum", "faqs", "schedule", "settings"]
                    const currentIndex = tabs.indexOf(activeTab)
                    setActiveTab(tabs[currentIndex - 1])
                  }}
                >
                  Previous
                </Button>
              )}

              {activeTab !== "settings" && (
                <Button
                  onClick={() => {
                    const tabs = ["basic", "delivery", "content", "instructor", "curriculum", "faqs", "schedule", "settings"]
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
          isLoading={isSaving}
        />
      </div>
    </AdminLayout>
  )
}