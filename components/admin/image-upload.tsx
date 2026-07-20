"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

/**
 * Admin image picker: select a file from the device, upload it to Vercel Blob
 * via /api/admin/upload, and return the hosted URL through onChange.
 */
export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFile = async (file: File) => {
    setError("")
    setUploading(true)
    try {
      const token = localStorage.getItem("admin_token")
      const body = new FormData()
      body.append("file", file)

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      onChange(data.url)
    } catch (e: any) {
      setError(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = "" // allow re-selecting the same file
        }}
      />
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? "Uploading..." : value ? "Change Image" : "Upload Image"}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, WebP, or GIF — max 5MB
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        {value && (
          <div className="w-24 h-24 rounded-lg border overflow-hidden bg-muted flex-shrink-0 relative">
            <img
              src={value}
              alt="Course image preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Image"
              }}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
