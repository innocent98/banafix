"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, X, Upload, Save, Loader2 } from "lucide-react"

interface InstructorFormData {
  name: string
  bio: string
  experience: string
  credentials: string[]
  rating: number
  availability: string
  verified: boolean
  avatar?: string
}

interface InstructorFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InstructorFormData) => Promise<void>
  initialData?: InstructorFormData | null
  isLoading?: boolean
}

export function InstructorFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false
}: InstructorFormModalProps) {
  const [formData, setFormData] = useState<InstructorFormData>({
    name: "",
    bio: "",
    experience: "",
    credentials: [],
    rating: 0,
    availability: "",
    verified: false,
    avatar: ""
  })

  const [newCredential, setNewCredential] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        name: "",
        bio: "",
        experience: "",
        credentials: [],
        rating: 0,
        availability: "",
        verified: false,
        avatar: ""
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Instructor name is required"
    }

    if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!formData.experience.trim()) {
      newErrors.experience = "Experience is required"
    }

    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = "Rating must be between 0 and 5"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      // Error will be handled by parent component
      console.error("Form submission error:", error)
    }
  }

  const addCredential = () => {
    if (newCredential.trim() && !formData.credentials.includes(newCredential.trim())) {
      setFormData(prev => ({
        ...prev,
        credentials: [...prev.credentials, newCredential.trim()]
      }))
      setNewCredential("")
    }
  }

  const removeCredential = (index: number) => {
    setFormData(prev => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index)
    }))
  }

  const handleInputChange = (field: keyof InstructorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Edit Instructor" : "Add New Instructor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={formData.avatar} />
              <AvatarFallback className="text-lg font-bold bg-amber-100 text-amber-800">
                {formData.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'IN'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar">Profile Picture URL</Label>
              <Input
                id="avatar"
                value={formData.avatar || ""}
                onChange={(e) => handleInputChange('avatar', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter a URL for the instructor's profile picture
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="experience">Experience *</Label>
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="15 years"
                className={`mt-1 ${errors.experience ? 'border-red-500' : ''}`}
              />
              {errors.experience && (
                <p className="text-sm text-red-600 mt-1">{errors.experience}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about the instructor's background, expertise, and teaching style..."
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Rating and Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                className={`mt-1 ${errors.rating ? 'border-red-500' : ''}`}
              />
              {errors.rating && (
                <p className="text-sm text-red-600 mt-1">{errors.rating}</p>
              )}
            </div>

            <div>
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                value={formData.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                placeholder="Mon-Fri: 9AM-6PM"
                className="mt-1"
              />
            </div>
          </div>

          {/* Credentials */}
          <div>
            <Label>Credentials & Certifications</Label>
            <div className="mt-2 space-y-3">
              {/* Add new credential */}
              <div className="flex gap-2">
                <Input
                  value={newCredential}
                  onChange={(e) => setNewCredential(e.target.value)}
                  placeholder="Add a credential..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCredential())}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCredential}
                  disabled={!newCredential.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Display credentials */}
              {formData.credentials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.credentials.map((credential, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {credential}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-red-100"
                        onClick={() => removeCredential(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Verified Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="verified"
              checked={formData.verified}
              onCheckedChange={(checked) => handleInputChange('verified', checked)}
            />
            <Label htmlFor="verified">Verified Instructor</Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {initialData ? "Update" : "Create"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}