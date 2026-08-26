/**
 * NTRO Platform - Phases 1-5: Complete Enterprise Content Transformation
 * Ingestion → Generation → Refinement → Export → Analytics → TTS
 */

import React, { useState, useRef, useEffect } from "react"
import {
  Upload,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap,
  RefreshCw,
  Download,
  Volume2,
  BarChart3,
} from "lucide-react"
import type {
  IngestionParams,
  IngestionResponse,
  GenerationResponse,
  ApiError,
} from "./api"
import {
  ingestContent,
  generateContent,
  checkHealth,
  formatFileSize,
  getFileTypeInfo,
  TargetAudience,
  Tone,
  Language,
  DetailLevel,
  api,
} from "./api"
import { DeliverablesWorkspace } from "./components/DeliverablesWorkspace"
import { ReviewExport } from "./components/ReviewExport"
import { AnalyticsPanel } from "./components/AnalyticsPanel"
import { AudioPlayer } from "./components/AudioPlayer"
import { toast } from "./utils/toast"
import "./App.css"

// ==================== Type Definitions ====================

interface HealthStatus {
  operational: boolean
  lastChecked: Date
  latency?: number
}

interface OperationalMetrics {
  parsingActive: boolean
  generationActive: boolean
  ttsActive: boolean
  refinementActive: boolean
  exportActive: boolean
}

type AppPhase = "input" | "ingesting" | "generating" | "complete" | "refining" | "exporting"

type ResultTab = "deliverables" | "refine" | "export" | "analytics" | "tts"

interface AppState {
  selectedFile: File | null
  rawText: string
  currentPhase: AppPhase
  ingestionResult: IngestionResponse | null
  generationResult: GenerationResponse | null
  analyticsResult: Record<string, any> | null
  ttsAudioUrl: string | null
  error: string | null
  healthStatus: HealthStatus
  showInputPanel: boolean
  resultTab: ResultTab
  metrics: OperationalMetrics
  isLoadingAnalytics: boolean
  isGeneratingTTS: boolean
}

// Default parameters
const DEFAULT_PARAMETERS: IngestionParams = {
  target_audience: TargetAudience.GENERAL_PUBLIC,
  tone: Tone.FORMAL,
  language: Language.ENGLISH,
  detail_level: DetailLevel.STANDARD,
  selected_outputs: ["Executive Summary"],
}

// Output Deliverables Options
const OUTPUT_OPTIONS = [
  "Video Package",
  "LinkedIn Post",
  "Twitter/X Post",
  "Advisory",
  "Infographic",
  "Executive Summary",
  "Presentation",
]

// Result tab definitions
const RESULT_TABS: { id: ResultTab; label: string; icon: React.ReactNode }[] = [
  { id: "deliverables", label: "Deliverables", icon: <FileText className="w-4 h-4" /> },
  { id: "refine", label: "Refine", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "export", label: "Export", icon: <Download className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "tts", label: "Audio", icon: <Volume2 className="w-4 h-4" /> },
]

// ==================== App Component ====================

function App(): React.ReactElement {
  // State management
  const [appState, setAppState] = useState<AppState>({
    selectedFile: null,
    rawText: "",
    currentPhase: "input",
    ingestionResult: null,
    generationResult: null,
    analyticsResult: null,
    ttsAudioUrl: null,
    error: null,
    healthStatus: {
      operational: false,
      lastChecked: new Date(),
      latency: undefined,
    },
    showInputPanel: true,
    resultTab: "deliverables",
    metrics: {
      parsingActive: false,
      generationActive: false,
      ttsActive: false,
      refinementActive: false,
      exportActive: false,
    },
    isLoadingAnalytics: false,
    isGeneratingTTS: false,
  })

  const [parameters, setParameters] = useState<IngestionParams>(DEFAULT_PARAMETERS)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Health check on mount
  useEffect(() => {
    checkServiceHealth()
    const healthInterval = setInterval(checkServiceHealth, 30000)
    return () => clearInterval(healthInterval)
  }, [])

  /**
   * Ping backend health endpoint and measure latency
   */
  const checkServiceHealth = async (): Promise<void> => {
    const startTime = performance.now()
    try {
      await checkHealth()
      const latency = Math.round(performance.now() - startTime)
      setAppState((prev) => ({
        ...prev,
        healthStatus: {
          operational: true,
          lastChecked: new Date(),
          latency,
        },
      }))
    } catch (error) {
      console.error("Health check failed:", error)
      setAppState((prev) => ({
        ...prev,
        healthStatus: {
          operational: false,
          lastChecked: new Date(),
          latency: undefined,
        },
      }))
    }
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = (file: File): void => {
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      setAppState((prev) => ({
        ...prev,
        error: `File size exceeds 500 MB limit. Your file: ${formatFileSize(file.size)}`,
      }))
      return
    }

    setAppState((prev) => ({
      ...prev,
      selectedFile: file,
      error: null,
    }))
  }

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("drag-active")
    }
  }

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("drag-active")
    }
  }

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("drag-active")
    }

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  /**
   * Clear file
   */
  const clearFile = (): void => {
    setAppState((prev) => ({
      ...prev,
      selectedFile: null,
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  /**
   * Update parameter
   */
  const updateParameter = <K extends keyof IngestionParams>(
    key: K,
    value: IngestionParams[K]
  ): void => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  /**
   * Toggle output
   */
  const toggleOutput = (output: string): void => {
    setParameters((prev) => ({
      ...prev,
      selected_outputs: prev.selected_outputs.includes(output)
        ? prev.selected_outputs.filter((o) => o !== output)
        : [...prev.selected_outputs, output],
    }))
  }

  /**
   * Handle ingestion
   */
  const handleIngest = async (): Promise<void> => {
    if (!appState.selectedFile && !appState.rawText.trim()) {
      setAppState((prev) => ({
        ...prev,
        error: "Please provide either a file or raw text content.",
      }))
      return
    }

    if (parameters.selected_outputs.length === 0) {
      setAppState((prev) => ({
        ...prev,
        error: "Please select at least one output format.",
      }))
      return
    }

    setAppState((prev) => ({
      ...prev,
      currentPhase: "ingesting",
      error: null,
    }))

    try {
      const result = await ingestContent(
        appState.selectedFile,
        appState.rawText,
        parameters
      )

      setAppState((prev) => ({
        ...prev,
        ingestionResult: result,
        currentPhase: "generating",
        selectedFile: null,
        rawText: "",
      }))

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Automatically start generation
      await handleGenerate(result)
    } catch (error) {
      const apiError = error as ApiError
      setAppState((prev) => ({
        ...prev,
        currentPhase: "input",
        error: apiError.message || "An unexpected error occurred during ingestion.",
      }))
    }
  }

  /**
   * Handle generation and load analytics automatically
   */
  const handleGenerate = async (ingestionResult: IngestionResponse): Promise<void> => {
    try {
      setAppState((prev) => ({
        ...prev,
        currentPhase: "generating",
        error: null,
        metrics: { ...prev.metrics, generationActive: true },
      }))

      const result = await generateContent(ingestionResult.extracted_text, parameters)

      setAppState((prev) => ({
        ...prev,
        generationResult: result,
        currentPhase: "complete",
        metrics: { ...prev.metrics, generationActive: false },
      }))

      // Auto-load analytics
      await handleLoadAnalytics(result.deliverables)

      // Show success toast
      toast.success("Content generation complete!", 3000)
    } catch (error) {
      const apiError = error as ApiError
      setAppState((prev) => ({
        ...prev,
        currentPhase: "input",
        error: apiError.message || "An unexpected error occurred during generation.",
        metrics: { ...prev.metrics, generationActive: false },
      }))
      toast.error("Generation failed", 3000)
    }
  }

  /**
   * Load analytics for generated deliverables
   */
  const handleLoadAnalytics = async (deliverables: Record<string, any>): Promise<void> => {
    try {
      setAppState((prev) => ({
        ...prev,
        isLoadingAnalytics: true,
        metrics: { ...prev.metrics, generationActive: true },
      }))

      const analyticsData = await api.computeAnalytics(deliverables, parameters)

      setAppState((prev) => ({
        ...prev,
        analyticsResult: analyticsData.analytics,
        isLoadingAnalytics: false,
        metrics: { ...prev.metrics, generationActive: false },
      }))

      toast.success("Analytics computed!", 2000)
    } catch (error) {
      console.error("Analytics load error:", error)
      setAppState((prev) => ({
        ...prev,
        isLoadingAnalytics: false,
        metrics: { ...prev.metrics, generationActive: false },
      }))
      toast.error("Failed to load analytics", 2000)
    }
  }

  /**
   * Generate TTS audio for selected format
   */
  const handleGenerateTTS = async (format: string): Promise<void> => {
    if (!appState.generationResult) return

    const content = appState.generationResult.deliverables[format]
    if (!content) {
      toast.error("Format not found", 2000)
      return
    }

    try {
      setAppState((prev) => ({
        ...prev,
        isGeneratingTTS: true,
        metrics: { ...prev.metrics, ttsActive: true },
      }))

      const contentText = Array.isArray(content) ? content.join(" ") : content

      const audioBlob = await api.generateTTS({
        content: contentText,
        language: parameters.language,
        tone: parameters.tone,
        format_type: format,
      })

      const audioUrl = URL.createObjectURL(audioBlob)

      setAppState((prev) => ({
        ...prev,
        ttsAudioUrl: audioUrl,
        isGeneratingTTS: false,
        metrics: { ...prev.metrics, ttsActive: false },
      }))

      toast.success("Audio generated successfully!", 2000)
    } catch (error) {
      console.error("TTS generation error:", error)
      setAppState((prev) => ({
        ...prev,
        isGeneratingTTS: false,
        metrics: { ...prev.metrics, ttsActive: false },
      }))
      toast.error("Failed to generate audio", 2000)
    }
  }

  /**
   * Reset to input phase
   */
  const handleReset = (): void => {
    // Cleanup TTS audio URL
    if (appState.ttsAudioUrl) {
      URL.revokeObjectURL(appState.ttsAudioUrl)
    }

    setAppState((prev) => ({
      ...prev,
      currentPhase: "input",
      ingestionResult: null,
      generationResult: null,
      analyticsResult: null,
      ttsAudioUrl: null,
      error: null,
      selectedFile: null,
      rawText: "",
      showInputPanel: true,
      resultTab: "deliverables",
      isLoadingAnalytics: false,
      isGeneratingTTS: false,
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // ==================== Render ====================

  const fileTypeInfo = appState.selectedFile
    ? getFileTypeInfo(appState.selectedFile.name)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">NTRO Platform</h1>
                <p className="text-sm text-slate-400">Content Transformation Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  appState.healthStatus.operational
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${appState.healthStatus.operational ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>
                  {appState.healthStatus.operational
                    ? `Online ${appState.healthStatus.latency ? `(${appState.healthStatus.latency}ms)` : ""}`
                    : "Connecting..."}
                </span>
              </div>
            </div>
          </div>

          {/* Phase Indicator */}
          {appState.currentPhase !== "input" && (
            <div className="mx-auto max-w-7xl px-6">
              <div className="mt-6 flex items-center gap-4 text-sm overflow-x-auto pb-3">
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 whitespace-nowrap font-medium transition-all ${
                    appState.currentPhase === "ingesting" ||
                    appState.currentPhase === "generating" ||
                    appState.currentPhase === "complete"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
                  }`}
                >
                  <div className="h-2 w-2 rounded-full bg-current" />
                  <span>Phase 1: Ingest</span>
                </div>
                <div className="h-0.5 w-6 bg-slate-600/50" />
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 whitespace-nowrap font-medium transition-all ${
                    appState.currentPhase === "generating" ||
                    appState.currentPhase === "complete"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
                  }`}
                >
                  <div className="h-2 w-2 rounded-full bg-current" />
                  <span>Phase 2: Generate</span>
                </div>
                <div className="h-0.5 w-6 bg-slate-600/50" />
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 whitespace-nowrap font-medium transition-all ${
                    appState.currentPhase === "complete"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
                  }`}
                >
                  <div className="h-2 w-2 rounded-full bg-current" />
                  <span>Phase 3-5: Results</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Error Alert */}
        {appState.error && (
          <div className="mb-8 flex items-start gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400 backdrop-blur-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="font-semibold text-red-300">Error Occurred</p>
              <p className="mt-1 text-sm text-red-400/80">{appState.error}</p>
            </div>
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  error: null,
                }))
              }
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Phase 1: Input */}
        {appState.currentPhase === "input" && appState.showInputPanel && (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Column 1: Source Material (2 columns) */}
            <div className="space-y-8 lg:col-span-2">
              <div className="rounded-2xl bg-slate-800/50 p-8 backdrop-blur-sm border border-slate-700/50">
                <h2 className="text-xl font-semibold text-white mb-7">Upload Your Content</h2>
                
                {/* Drag-Drop Area */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="relative rounded-2xl border-2 border-dashed border-slate-600/50 bg-slate-900/30 p-12 transition-all hover:border-indigo-500/50 hover:bg-slate-900/50 drag-zone cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    className="hidden"
                    accept=".pdf,.docx,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.mp3,.wav,.m4a,.flac,.ogg,.mp4,.webm,.mov,.avi"
                  />

                  {appState.selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                            <FileText className="h-6 w-6 text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {appState.selectedFile.name}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              {fileTypeInfo?.label} • {formatFileSize(appState.selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={clearFile}
                          className="text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full rounded-xl border border-slate-600 bg-slate-900/50 hover:bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-200 transition-colors"
                      >
                        Choose Different File
                      </button>
                    </div>
                  ) : (
                    <div
                      className="text-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto h-14 w-14 text-slate-500 mb-4" />
                      <p className="text-lg font-semibold text-slate-100">
                        Drop your file or click to browse
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        PDF, DOCX, Images, Audio, Video (Max 500MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Text Input */}
                <div className="mt-8 space-y-3">
                  <label className="block text-sm font-medium text-slate-200">
                    Or Paste Your Text
                  </label>
                  <textarea
                    value={appState.rawText}
                    onChange={(e) =>
                      setAppState((prev) => ({
                        ...prev,
                        rawText: e.currentTarget.value,
                      }))
                    }
                    placeholder="Paste your content here..."
                    rows={8}
                    className="w-full rounded-xl border border-slate-600/50 bg-slate-900/50 px-5 py-4 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-xs text-slate-400">
                    {appState.rawText.length} characters
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Parameters */}
            <div className="space-y-8">
              {/* Output Deliverables */}
              <div className="rounded-2xl bg-slate-800/50 p-7 backdrop-blur-sm border border-slate-700/50">
                <h3 className="text-sm font-semibold text-white mb-5">
                  Output Formats
                </h3>
                <div className="space-y-3">
                  {OUTPUT_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-700/30 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={parameters.selected_outputs.includes(option)}
                        onChange={() => toggleOutput(option)}
                        className="h-4 w-4 rounded border-slate-500 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-200">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="rounded-2xl bg-slate-800/50 p-7 backdrop-blur-sm border border-slate-700/50">
                <label className="block text-sm font-semibold text-white mb-4">
                  Target Audience
                </label>
                <select
                  value={parameters.target_audience}
                  onChange={(e) =>
                    updateParameter("target_audience", e.currentTarget.value as TargetAudience)
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={TargetAudience.GENERAL_PUBLIC}>{TargetAudience.GENERAL_PUBLIC}</option>
                  <option value={TargetAudience.EXECUTIVES}>{TargetAudience.EXECUTIVES}</option>
                  <option value={TargetAudience.TECHNICAL_EXPERTS}>{TargetAudience.TECHNICAL_EXPERTS}</option>
                  <option value={TargetAudience.MEDIA}>{TargetAudience.MEDIA}</option>
                </select>
              </div>

              {/* Tone */}
              <div className="rounded-2xl bg-slate-800/50 p-7 backdrop-blur-sm border border-slate-700/50">
                <label className="block text-sm font-semibold text-white mb-4">
                  Tone
                </label>
                <select
                  value={parameters.tone}
                  onChange={(e) =>
                    updateParameter("tone", e.currentTarget.value as Tone)
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={Tone.FORMAL}>{Tone.FORMAL}</option>
                  <option value={Tone.URGENT}>{Tone.URGENT}</option>
                  <option value={Tone.CONVERSATIONAL}>{Tone.CONVERSATIONAL}</option>
                  <option value={Tone.REASSURING}>{Tone.REASSURING}</option>
                </select>
              </div>

              {/* Language Toggle */}
              <div className="rounded-2xl bg-slate-800/50 p-7 backdrop-blur-sm border border-slate-700/50">
                <label className="block text-sm font-semibold text-white mb-4">
                  Language
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[Language.ENGLISH, Language.HINDI].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => updateParameter("language", lang)}
                      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                        parameters.language === lang
                          ? "border border-indigo-500/50 bg-indigo-500/20 text-indigo-200"
                          : "border border-slate-600 bg-slate-900/50 text-slate-300 hover:bg-slate-800/50"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Level */}
              <div className="rounded-2xl bg-slate-800/50 p-7 backdrop-blur-sm border border-slate-700/50">
                <label className="block text-sm font-semibold text-white mb-4">
                  Detail Level
                </label>
                <div className="space-y-2.5">
                  {[DetailLevel.BRIEF, DetailLevel.STANDARD, DetailLevel.COMPREHENSIVE].map(
                    (level) => (
                      <label
                        key={level}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-all ${
                          parameters.detail_level === level
                            ? "border-indigo-500/50 bg-indigo-500/10"
                            : "border-slate-600 bg-slate-900/50 hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="detail_level"
                          value={level}
                          checked={parameters.detail_level === level}
                          onChange={() => updateParameter("detail_level", level)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-slate-200">{level}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={handleIngest}
                disabled={
                  appState.currentPhase !== "input" ||
                  (!appState.selectedFile && !appState.rawText.trim())
                }
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {appState.currentPhase !== "input" ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Process & Generate
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Phase 1-2: Processing Indicator */}
        {(appState.currentPhase === "ingesting" || appState.currentPhase === "generating") && (
          <div className="flex flex-col items-center justify-center space-y-10 py-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
            <div className="space-y-6 text-center max-w-md">
              <div className="flex items-center justify-center gap-4">
                <Loader className="h-10 w-10 animate-spin text-indigo-400" />
                <h2 className="text-3xl font-bold text-white">
                  {appState.currentPhase === "ingesting"
                    ? "Analyzing Content"
                    : "Generating Content"}
                </h2>
              </div>
              <p className="text-slate-300 text-base leading-relaxed">
                {appState.currentPhase === "ingesting"
                  ? "Extracting and analyzing your source material to prepare for generation..."
                  : "Creating targeted multi-platform content customized to your specifications..."}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="w-full max-w-md space-y-4 px-6">
              {appState.currentPhase === "ingesting" && (
                <>
                  <div className="flex items-center gap-4 rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/30">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-200">Validating input</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-indigo-500/10 p-4 border border-indigo-500/30">
                    <Loader className="h-5 w-5 animate-spin flex-shrink-0 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-200">Parsing content</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-slate-700/20 p-4 border border-slate-600/30">
                    <div className="h-5 w-5 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-300">Computing metrics</span>
                  </div>
                </>
              )}

              {appState.currentPhase === "generating" && (
                <>
                  <div className="flex items-center gap-4 rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/30">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-200">Ingestion complete</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-indigo-500/10 p-4 border border-indigo-500/30">
                    <Loader className="h-5 w-5 animate-spin flex-shrink-0 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-200">Generating outputs</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-slate-700/20 p-4 border border-slate-600/30">
                    <div className="h-5 w-5 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-300">Computing analytics</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Phase 2-5: Deliverables & Refinement */}
        {appState.currentPhase === "complete" && appState.generationResult && (
          <div className="space-y-6">
            {/* Result Tabs */}
            <div className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
                {RESULT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAppState((prev) => ({ ...prev, resultTab: tab.id }))}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      appState.resultTab === tab.id
                        ? "border-blue-600 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {appState.resultTab === "deliverables" && (
                  <DeliverablesWorkspace
                    deliverables={appState.generationResult.deliverables}
                    executionTime={appState.generationResult.execution_time_seconds}
                    generationId={appState.generationResult.generation_id}
                    onClose={() => {}}
                  />
                )}

                {appState.resultTab === "refine" && appState.generationResult && (
                  <ReviewExport
                    deliverables={appState.generationResult.deliverables}
                    parameters={parameters}
                  />
                )}

                {appState.resultTab === "export" && appState.generationResult && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Download Your Content</h3>
                    <p className="text-sm text-gray-600">
                      Export your generated content in multiple formats
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <button
                        onClick={() => {
                          setAppState((prev) => ({
                            ...prev,
                            metrics: { ...prev.metrics, exportActive: true },
                          }))
                          api
                            .exportDeliverables(
                              appState.generationResult!.deliverables,
                              parameters,
                              "pdf"
                            )
                            .then((blob) => {
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = `deliverables_${appState.generationResult!.generation_id.slice(0, 8)}.pdf`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              window.URL.revokeObjectURL(url)
                              toast.success("PDF downloaded!", 2000)
                              setAppState((prev) => ({
                                ...prev,
                                metrics: { ...prev.metrics, exportActive: false },
                              }))
                            })
                            .catch(() => {
                              toast.error("PDF export failed", 2000)
                              setAppState((prev) => ({
                                ...prev,
                                metrics: { ...prev.metrics, exportActive: false },
                              }))
                            })
                        }}
                        className="px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg font-medium transition-colors text-center"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => {
                          setAppState((prev) => ({
                            ...prev,
                            metrics: { ...prev.metrics, exportActive: true },
                          }))
                          api
                            .exportDeliverables(
                              appState.generationResult!.deliverables,
                              parameters,
                              "docx"
                            )
                            .then((blob) => {
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = `deliverables_${appState.generationResult!.generation_id.slice(0, 8)}.docx`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              window.URL.revokeObjectURL(url)
                              toast.success("DOCX downloaded!", 2000)
                              setAppState((prev) => ({
                                ...prev,
                                metrics: { ...prev.metrics, exportActive: false },
                              }))
                            })
                            .catch(() => {
                              toast.error("DOCX export failed", 2000)
                              setAppState((prev) => ({
                                ...prev,
                                metrics: { ...prev.metrics, exportActive: false },
                              }))
                            })
                        }}
                        className="px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg font-medium transition-colors text-center"
                      >
                        📊 DOCX
                      </button>
                      <button
                        onClick={() => {
                          setAppState((prev) => ({
                            ...prev,
                            metrics: { ...prev.metrics, exportActive: true },
                          }))
                          api
                            .exportDeliverables(
                              appState.generationResult!.deliverables,
                              parameters,
                              "json"
                            )
                            .then((blob) => {
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = `deliverables_${appState.generationResult!.generation_id.slice(0, 8)}.json`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              window.URL.revokeObjectURL(url)
                              toast.success("JSON downloaded!", 2000)
                              setAppState((prev) => ({
                                ...prev,
                                metrics: { ...prev.metrics, exportActive: false },
                              }))
                            })
                            .catch(() => {
                              toast.error("JSON export failed", 2000)
                              setAppState((prev) => ({
                                ...prev,
                                metrics: { ...prev.metrics, exportActive: false },
                              }))
                            })
                        }}
                        className="px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg font-medium transition-colors text-center"
                      >
                        {} JSON
                      </button>
                      <button
                        onClick={() => {
                          const text = Object.entries(appState.generationResult!.deliverables)
                            .map(([k, v]) => `${k}:\n${Array.isArray(v) ? v.join("\n") : v}`)
                            .join("\n\n")
                          const blob = new Blob([text], { type: "text/plain" })
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = url
                          a.download = `deliverables.txt`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          window.URL.revokeObjectURL(url)
                          toast.success("TXT downloaded!", 2000)
                        }}
                        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-center"
                      >
                        📝 TXT
                      </button>
                    </div>
                  </div>
                )}

                {appState.resultTab === "analytics" && (
                  <AnalyticsPanel
                    analytics={appState.analyticsResult || {}}
                    isLoading={appState.isLoadingAnalytics}
                  />
                )}

                {appState.resultTab === "tts" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Audio</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Convert your content to speech in multiple languages
                      </p>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-900">
                          Select content to narrate:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Object.keys(appState.generationResult.deliverables).map(
                            (format) => (
                              <button
                                key={format}
                                onClick={() => handleGenerateTTS(format)}
                                disabled={appState.isGeneratingTTS}
                                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 border border-purple-200 text-purple-700 rounded-lg font-medium transition-colors text-sm"
                              >
                                {appState.isGeneratingTTS ? (
                                  <>
                                    <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-4 h-4 inline mr-2" />
                                    {format}
                                  </>
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {appState.ttsAudioUrl && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <AudioPlayer
                          audioUrl={appState.ttsAudioUrl}
                          title="Generated Narration"
                          isLoading={appState.isGeneratingTTS}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-3 font-medium text-gray-900 transition-colors border border-gray-200"
              >
                Start New Pipeline
              </button>
              <button
                onClick={() =>
                  setAppState((prev) => ({
                    ...prev,
                    showInputPanel: !prev.showInputPanel,
                  }))
                }
                className="flex-1 rounded-lg bg-gray-50 hover:bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors border border-gray-200"
              >
                {appState.showInputPanel ? "Hide Input" : "Show Input"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
