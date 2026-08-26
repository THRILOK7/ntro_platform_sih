/**
 * API integration layer for NTRO Platform frontend.
 * Provides strongly-typed Axios instance and request/response handlers.
 */

import axios, { AxiosError } from "axios"
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios"

// ==================== Type Definitions ====================

export const TargetAudience = {
  GENERAL_PUBLIC: "General Public",
  EXECUTIVES: "Executives",
  TECHNICAL_EXPERTS: "Technical Experts",
  MEDIA: "Media",
} as const

export type TargetAudience = (typeof TargetAudience)[keyof typeof TargetAudience]

export const Tone = {
  FORMAL: "Formal",
  URGENT: "Urgent",
  CONVERSATIONAL: "Conversational",
  REASSURING: "Reassuring",
} as const

export type Tone = (typeof Tone)[keyof typeof Tone]

export const Language = {
  ENGLISH: "English",
  HINDI: "Hindi",
} as const

export type Language = (typeof Language)[keyof typeof Language]

export const DetailLevel = {
  BRIEF: "Brief",
  STANDARD: "Standard",
  COMPREHENSIVE: "Comprehensive",
} as const

export type DetailLevel = (typeof DetailLevel)[keyof typeof DetailLevel]

export interface IngestionParams {
  target_audience: TargetAudience
  tone: Tone
  language: Language
  detail_level: DetailLevel
  selected_outputs: string[]
}

export interface FileInfo {
  filename?: string | null
  size_bytes?: number | null
}

export interface IngestionResponse {
  status: string
  ingestion_id: string
  file_info: FileInfo | null
  extracted_text: string
  char_count: number
  word_count: number
  parameters: Record<string, unknown>
  timestamp: string
}

export interface GenerationResponse {
  status: string
  generation_id: string
  deliverables: Record<string, string | string[]>
  errors?: Record<string, string> | null
  execution_time_seconds: number
}

export interface ApiError {
  status: string
  code: string
  message: string
  error_id?: string
  timestamp: string
}

export interface HealthResponse {
  status: string
  phase: string
}

// ==================== Axios Instance Configuration ====================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

/**
 * Create and configure Axios instance with sensible defaults.
 * Includes request/response interceptors for error handling.
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 second timeout for file uploads
    headers: {
      "Content-Type": "application/json",
    },
  })

  // Request interceptor: log outgoing requests in development
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (import.meta.env.DEV) {
        console.debug(
          `[API] ${config.method?.toUpperCase()} ${config.url}`,
          config.data
        )
      }
      return config
    },
    (error) => {
      console.error("[API] Request error:", error)
      return Promise.reject(error)
    }
  )

  // Response interceptor: handle errors globally
  instance.interceptors.response.use(
    (response) => {
      if (import.meta.env.DEV) {
        console.debug(`[API] Response (${response.status}):`, response.data)
      }
      return response
    },
    (error: AxiosError<ApiError>) => {
      // Parse error response
      const apiError = error.response?.data || {
        status: "error",
        code: "NETWORK_ERROR",
        message: error.message,
        timestamp: new Date().toISOString(),
      }

      console.error("[API] Response error:", {
        status: error.response?.status,
        data: apiError,
        originalError: error.message,
      })

      return Promise.reject(apiError)
    }
  )

  return instance
}

export const apiClient = createApiClient()

// ==================== API Request Functions ====================

/**
 * Perform health check on backend service.
 *
 * @returns {Promise<HealthResponse>} Service health status
 * @throws {ApiError} If health check fails
 */
export const checkHealth = async (): Promise<HealthResponse> => {
  try {
    const response = await apiClient.get<HealthResponse>("/health")
    return response.data
  } catch (error) {
    console.error("Health check failed:", error)
    throw error
  }
}

/**
 * Ingest content from file and/or raw text with specified parameters.
 *
 * @param {File | null} file - Optional file to ingest
 * @param {string} rawText - Optional raw text to ingest
 * @param {IngestionParams} parameters - Ingestion configuration parameters
 * @returns {Promise<IngestionResponse>} Ingestion result with extracted content
 * @throws {ApiError} If ingestion fails
 *
 * @example
 * const result = await ingestContent(
 *   pdfFile,
 *   "Additional notes here",
 *   {
 *     target_audience: TargetAudience.EXECUTIVES,
 *     tone: Tone.FORMAL,
 *     language: Language.ENGLISH,
 *     detail_level: DetailLevel.COMPREHENSIVE,
 *     selected_outputs: ["Executive Summary", "LinkedIn Post"]
 *   }
 * )
 */
export const ingestContent = async (
  file: File | null,
  rawText: string,
  parameters: IngestionParams
): Promise<IngestionResponse> => {
  // Validate input: at least one of file or rawText must be provided
  if (!file && !rawText.trim()) {
    throw {
      status: "error",
      code: "VALIDATION_ERROR",
      message: "At least one of file or raw text must be provided.",
      timestamp: new Date().toISOString(),
    } as ApiError
  }

  // Validate parameters have at least one selected output
  if (!parameters.selected_outputs || parameters.selected_outputs.length === 0) {
    throw {
      status: "error",
      code: "VALIDATION_ERROR",
      message: "At least one output format must be selected.",
      timestamp: new Date().toISOString(),
    } as ApiError
  }

  // Construct FormData for multipart upload
  const formData = new FormData()

  if (file) {
    formData.append("file", file)
  }

  if (rawText.trim()) {
    formData.append("raw_text", rawText.trim())
  }

  // Append parameters as JSON-stringified form field
  formData.append("parameters", JSON.stringify(parameters))

  try {
    const response = await apiClient.post<IngestionResponse>(
      "/api/v1/ingest",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return response.data
  } catch (error) {
    console.error("Ingestion failed:", error)
    throw error
  }
}

/**
 * Format file size for human-readable display.
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Generate targeted deliverables from extracted content.
 *
 * @param {string} extractedText - Source content from Phase 1 ingestion
 * @param {IngestionParams} parameters - Generation configuration parameters
 * @returns {Promise<GenerationResponse>} Generated deliverables and metadata
 * @throws {ApiError} If generation fails
 */
export const generateContent = async (
  extractedText: string,
  parameters: IngestionParams
): Promise<GenerationResponse> => {
  // Validate input
  if (!extractedText || !extractedText.trim()) {
    throw {
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Extracted text cannot be empty.",
      timestamp: new Date().toISOString(),
    } as ApiError
  }

  if (!parameters.selected_outputs || parameters.selected_outputs.length === 0) {
    throw {
      status: "error",
      code: "VALIDATION_ERROR",
      message: "At least one output format must be selected.",
      timestamp: new Date().toISOString(),
    } as ApiError
  }

  // Construct FormData for multipart request
  const formData = new FormData()
  formData.append("extracted_text", extractedText.trim())
  formData.append("parameters", JSON.stringify(parameters))

  try {
    const response = await apiClient.post<GenerationResponse>(
      "/api/v1/generate",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return response.data
  } catch (error) {
    console.error("Content generation failed:", error)
    throw error
  }
}

/**
 * Get the appropriate file type label and icon name.
 *
 * @param {string} filename - Filename to analyze
 * @returns {object} File type info with label and icon name
 */
export const getFileTypeInfo = (
  filename: string
): { label: string; icon: string } => {
  const ext = filename.split(".").pop()?.toLowerCase() || ""

  const typeMap: Record<string, { label: string; icon: string }> = {
    pdf: { label: "PDF", icon: "file-pdf" },
    docx: { label: "Word", icon: "file-text" },
    doc: { label: "Word", icon: "file-text" },
    png: { label: "PNG", icon: "image" },
    jpg: { label: "JPEG", icon: "image" },
    jpeg: { label: "JPEG", icon: "image" },
    gif: { label: "GIF", icon: "image" },
    webp: { label: "WebP", icon: "image" },
    mp3: { label: "Audio", icon: "music" },
    wav: { label: "Audio", icon: "music" },
    m4a: { label: "Audio", icon: "music" },
    flac: { label: "Audio", icon: "music" },
    mp4: { label: "Video", icon: "video" },
    webm: { label: "Video", icon: "video" },
    mov: { label: "Video", icon: "video" },
    avi: { label: "Video", icon: "video" },
  }

  return (
    typeMap[ext] || {
      label: ext.toUpperCase(),
      icon: "file",
    }
  )
}

// ==================== Phase 3-5: New Endpoints ====================

/**
 * Refine generated content based on user instruction.
 *
 * @param {object} request - Refinement request
 * @returns {Promise<object>} Refined content and summary
 * @throws {ApiError} If refinement fails
 */
export const refineContent = async (request: {
  original_content: string
  instruction: string
  format_type: string
  parameters: Record<string, any>
}): Promise<{
  status: string
  refined_content: string
  change_summary: string
  original_length: number
  refined_length: number
}> => {
  try {
    const response = await apiClient.post<{
      status: string
      refined_content: string
      change_summary: string
      original_length: number
      refined_length: number
    }>("/api/v1/refine", request)
    return response.data
  } catch (error) {
    console.error("Content refinement failed:", error)
    throw error
  }
}

/**
 * Export deliverables in specified format.
 *
 * @param {Record<string, any>} deliverables - Deliverables to export
 * @param {Record<string, any>} parameters - Generation parameters
 * @param {string} format - Export format: pdf, docx, or json
 * @returns {Promise<Blob>} Binary file data
 * @throws {ApiError} If export fails
 */
export const exportDeliverables = async (
  deliverables: Record<string, any>,
  parameters: Record<string, any>,
  format: "pdf" | "docx" | "json"
): Promise<Blob> => {
  const formData = new FormData()
  formData.append("deliverables", JSON.stringify(deliverables))
  formData.append("parameters", JSON.stringify(parameters))

  try {
    const response = await apiClient.post(
      `/api/v1/export/${format}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      }
    )
    return response.data
  } catch (error) {
    console.error(`Export to ${format} failed:`, error)
    throw error
  }
}

/**
 * Compute analytics for deliverables.
 *
 * @param {Record<string, any>} deliverables - Deliverables to analyze
 * @param {Record<string, any>} parameters - Generation parameters
 * @returns {Promise<Record<string, any>>} Analytics results per format
 * @throws {ApiError} If analytics computation fails
 */
export const computeAnalytics = async (
  deliverables: Record<string, any>,
  parameters: Record<string, any>
): Promise<{
  status: string
  analytics: Record<string, any>
  timestamp: string
}> => {
  const formData = new FormData()
  formData.append("deliverables", JSON.stringify(deliverables))
  formData.append("parameters", JSON.stringify(parameters))

  try {
    const response = await apiClient.post("/api/v1/analytics", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error("Analytics computation failed:", error)
    throw error
  }
}

/**
 * Generate text-to-speech audio from content.
 *
 * @param {object} request - TTS request
 * @returns {Promise<Blob>} MP3 audio data
 * @throws {ApiError} If TTS generation fails
 */
export const generateTTS = async (request: {
  content: string
  language: string
  tone: string
  format_type: string
}): Promise<Blob> => {
  const formData = new FormData()
  formData.append("content", request.content)
  formData.append("language", request.language)
  formData.append("tone", request.tone)
  formData.append("format_type", request.format_type)

  try {
    const response = await apiClient.post("/api/v1/tts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      responseType: "blob",
    })
    return response.data
  } catch (error) {
    console.error("TTS generation failed:", error)
    throw error
  }
}

// ==================== Convenience Export ====================

export const api = {
  checkHealth,
  ingestContent,
  generateContent,
  refineContent,
  exportDeliverables,
  computeAnalytics,
  generateTTS,
  formatFileSize,
  getFileTypeInfo,
}
