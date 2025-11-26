"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface VideoPlayerProps {
  videoUrl: string
  title?: string
  duration?: string
  className?: string
  showTitle?: boolean
  autoPlay?: boolean
}

// Video platform detection functions
const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

const getVimeoVideoId = (url: string): string | null => {
  const regex = /(?:vimeo\.com\/)([0-9]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

const isDirectVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(url)
}

export function VideoPlayer({
  videoUrl,
  title,
  duration,
  className = "",
  showTitle = true,
  autoPlay = false
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [hasError, setHasError] = useState(false)

  // Platform detection
  const youtubeId = getYouTubeVideoId(videoUrl)
  const vimeoId = getVimeoVideoId(videoUrl)
  const isDirect = isDirectVideoUrl(videoUrl)

  const handlePlayClick = () => {
    setIsPlaying(true)
    setHasError(false)
  }

  const handleError = () => {
    setHasError(true)
  }

  // If no valid video platform detected, show error
  if (!youtubeId && !vimeoId && !isDirect) {
    return (
      <div className={`relative aspect-video bg-slate-100 rounded-2xl flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <div className="text-slate-400 mb-2">⚠️</div>
          <p className="text-slate-600 font-medium">Invalid video URL</p>
          <p className="text-sm text-slate-500 mt-1">
            Please use YouTube, Vimeo, or direct video file URLs
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (hasError) {
    return (
      <div className={`relative aspect-video bg-slate-100 rounded-2xl flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <div className="text-slate-400 mb-2">⚠️</div>
          <p className="text-slate-600 font-medium">Failed to load video</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHasError(false)
              setIsPlaying(false)
            }}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative aspect-video bg-slate-100 rounded-2xl overflow-hidden ${className}`}>
      {!isPlaying ? (
        // Thumbnail/Preview State
        <div className="relative w-full h-full">
          {/* Background - try to show thumbnail if possible */}
          {youtubeId && (
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
              alt={title || "Video thumbnail"}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default YouTube thumbnail
                e.currentTarget.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
              }}
            />
          )}

          {/* Fallback background for non-YouTube or when thumbnail fails */}
          {(!youtubeId || vimeoId || isDirect) && (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="h-8 w-8 text-white/80" />
                </div>
                {showTitle && title && (
                  <p className="text-white font-semibold text-lg drop-shadow-lg">{title}</p>
                )}
              </div>
            </div>
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              onClick={handlePlayClick}
              className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-slate-900 hover:text-slate-900 shadow-2xl backdrop-blur-sm transform hover:scale-110 transition-all duration-300"
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
          </div>

          {/* Title and Duration Overlay */}
          {showTitle && (
            <div className="absolute bottom-4 left-4 right-4">
              {title && (
                <h3 className="text-white font-semibold text-lg drop-shadow-lg mb-1">
                  {title}
                </h3>
              )}
              {duration && (
                <div className="inline-block bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                  <p className="text-white text-sm font-medium">{duration}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Video Player State
        <div className="w-full h-full">
          {youtubeId && (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={title || "YouTube video"}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={handleError}
            />
          )}

          {vimeoId && (
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
              title={title || "Vimeo video"}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              onError={handleError}
            />
          )}

          {isDirect && (
            <video
              src={videoUrl}
              title={title || "Video"}
              className="w-full h-full object-cover"
              controls
              autoPlay
              onError={handleError}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
    </div>
  )
}