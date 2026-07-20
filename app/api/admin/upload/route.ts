import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// POST /api/admin/upload - Upload an image to Vercel Blob, returns its public URL
export const POST = withAuth(async (req: NextRequest) => {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return createErrorResponse(
        'Image uploads are not configured. Add a BLOB_READ_WRITE_TOKEN env var (create a Blob store in the Vercel dashboard).',
        500,
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return createErrorResponse('No file provided', 400)
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return createErrorResponse('Unsupported file type. Use JPG, PNG, WebP, or GIF.', 400)
    }
    if (file.size > MAX_BYTES) {
      return createErrorResponse('File too large. Maximum size is 5MB.', 400)
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
    const key = `courses/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(key, file, {
      access: 'public',
      contentType: file.type,
    })

    return createResponse({ url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return createErrorResponse('Failed to upload image', 500)
  }
})
