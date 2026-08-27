/**
 * NTRO Platform - Full Width Centered Workspace (1200px)
 * Complete Flat Design Content Transformation Platform
 */

import React, { useState, useRef, useEffect } from "react"
import {
  Upload,
  X,
  Loader,
  AlertCircle,
  FileText,
  RefreshCw,
  Download,
  Volume2,
  BarChart3,
  Zap,
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

// ==================== Types & Defaults ====================

interface HealthStatus {
  operational: boolean
  lastChecked: Date
  latency?: number
}

type AppPhase = "input" | "ingesting" | "generating" | "complete"
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
  resultTab: ResultTab
  isLoadingAnalytics: boolean
  isGeneratingTTS: boolean
}

const DEFAULT_PARAMETERS: IngestionParams = {
  target_audience: TargetAudience.GENERAL_PUBLIC,
  tone: Tone.FORMAL,
  language: Language.ENGLISH,
  detail_level: DetailLevel.STANDARD,
  selected_outputs: ["Executive Summary"],
}

const OUTPUT_OPTIONS = [
  "Video Package",
  "LinkedIn Post",
  "Twitter/X Post",
  "Advisory",
  "Infographic",
  "Executive Summary",
  "Presentation",
]

const RESULT_TABS: { id: ResultTab; label: string; icon: React.ReactNode }[] = [
  { id: "deliverables", label: "Deliverables", icon: <FileText className="w-4 h-4" /> },
  { id: "refine", label: "Refine", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "export", label: "Export", icon: <Download className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "tts", label: "Audio", icon: <Volume2 className="w-4 h-4" /> },
]

// ==================== Main App Component ====================

export function App(): React.ReactElement {
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
    resultTab: "deliverables",
    isLoadingAnalytics: false,
    isGeneratingTTS: false,
  })

  const [parameters, setParameters] = useState<IngestionParams>(DEFAULT_PARAMETERS)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Health check on mount and interval
  useEffect(() => {
    checkServiceHealth()
    const interval = setInterval(checkServiceHealth, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const handleFileSelect = (file: File): void => {
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      setAppState((prev) => ({
        ...prev,
        error: `File size exceeds 500 MB limit (${formatFileSize(file.size)}).`,
      }))
      return
    }

    setAppState((prev) => ({
      ...prev,
      selectedFile: file,
      error: null,
    }))
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("drag-active")
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("drag-active")
    }
  }

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

  const clearFile = (): void => {
    setAppState((prev) => ({
      ...prev,
      selectedFile: null,
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const updateParameter = <K extends keyof IngestionParams>(
    key: K,
    value: IngestionParams[K]
  ): void => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const toggleOutput = (output: string): void => {
    setParameters((prev) => ({
      ...prev,
      selected_outputs: prev.selected_outputs.includes(output)
        ? prev.selected_outputs.filter((o) => o !== output)
        : [...prev.selected_outputs, output],
    }))
  }

  const handleIngest = async (): Promise<void> => {
    if (!appState.selectedFile && !appState.rawText.trim()) {
      setAppState((prev) => ({
        ...prev,
        error: "Please provide either a file or paste text content.",
      }))
      return
    }

    if (parameters.selected_outputs.length === 0) {
      setAppState((prev) => ({
        ...prev,
        error: "Please select at least one target output format.",
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

  const handleGenerate = async (ingestionResult: IngestionResponse): Promise<void> => {
    try {
      setAppState((prev) => ({
        ...prev,
        currentPhase: "generating",
        error: null,
      }))

      const result = await generateContent(ingestionResult.extracted_text, parameters)

      setAppState((prev) => ({
        ...prev,
        generationResult: result,
        currentPhase: "complete",
      }))

      await handleLoadAnalytics(result.deliverables)
      toast.success("Content generation complete!", 3000)
    } catch (error) {
      const apiError = error as ApiError
      setAppState((prev) => ({
        ...prev,
        currentPhase: "input",
        error: apiError.message || "An unexpected error occurred during generation.",
      }))
      toast.error("Generation failed", 3000)
    }
  }

  const handleLoadAnalytics = async (deliverables: Record<string, any>): Promise<void> => {
    try {
      setAppState((prev) => ({ ...prev, isLoadingAnalytics: true }))
      const analyticsData = await api.computeAnalytics(deliverables, parameters)
      setAppState((prev) => ({
        ...prev,
        analyticsResult: analyticsData.analytics,
        isLoadingAnalytics: false,
      }))
    } catch (error) {
      console.error("Analytics load error:", error)
      setAppState((prev) => ({ ...prev, isLoadingAnalytics: false }))
    }
  }

  const handleGenerateTTS = async (format: string): Promise<void> => {
    if (!appState.generationResult) return
    const content = appState.generationResult.deliverables[format]
    if (!content) {
      toast.error("Format not found", 2000)
      return
    }

    try {
      setAppState((prev) => ({ ...prev, isGeneratingTTS: true }))
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
      }))
      toast.success("Audio generated successfully!", 2000)
    } catch (error) {
      console.error("TTS generation error:", error)
      setAppState((prev) => ({ ...prev, isGeneratingTTS: false }))
      toast.error("Failed to generate audio", 2000)
    }
  }

  const handleReset = (): void => {
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
      resultTab: "deliverables",
      isLoadingAnalytics: false,
      isGeneratingTTS: false,
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const fileTypeInfo = appState.selectedFile
    ? getFileTypeInfo(appState.selectedFile.name)
    : null

  return (
    <div className="app-shell">

      {/* ── 1. Full-Width Header Bar (Inner Content 1200px Centered) ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-bold flex-shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#111827] tracking-tight leading-tight">NTRO Platform</h1>
              <p className="text-xs text-[#6B7280]">Content Transformation Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#F3F4F6] text-xs font-semibold">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                appState.healthStatus.operational ? "bg-[#10B981]" : "bg-[#F59E0B]"
              }`}
            />
            <span className="text-[#374151]">
              {appState.healthStatus.operational
                ? `Connected${appState.healthStatus.latency ? ` (${appState.healthStatus.latency}ms)` : ""}`
                : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      {/* ── 2. Full-Width Main Canvas (Inner Content 1200px Centered) ── */}
      <main className="app-main">
        <div className="workspace">

          {/* Error Alert */}
          {appState.error && (
            <div className="flex items-start gap-3.5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-medium">{appState.error}</div>
              <button
                onClick={() => setAppState((prev) => ({ ...prev, error: null }))}
                className="text-red-500 hover:text-red-700 p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Phase 1: Input Workspace ──────────────────────────── */}
          {appState.currentPhase === "input" && (
            <div className="flex flex-col gap-8 w-full">

              {/* Page Introduction */}
              <div className="border-b border-[#E5E7EB] pb-5">
                <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">Content Transformation</h2>
                <p className="text-base text-[#4B5563] mt-1.5">
                  Upload source material or paste text to transform it into the formats you need.
                </p>
              </div>

              {/* Source Input Area (Full 1200px Width) */}
              <div className="flex flex-col gap-6 w-full">

                {/* Upload Source Material */}
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-sm font-bold text-[#111827]">
                    Upload Source Material
                  </label>

                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="source-dropzone"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileInputChange}
                      className="hidden"
                      accept=".pdf,.docx,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.mp3,.wav,.m4a,.flac,.ogg,.mp4,.webm,.mov,.avi"
                    />

                    {appState.selectedFile ? (
                      <div
                        className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-lg p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3.5 text-left">
                          <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#3B82F6] flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#111827] truncate">
                              {appState.selectedFile.name}
                            </p>
                            <p className="text-xs text-[#6B7280] mt-0.5">
                              {fileTypeInfo?.label} • {formatFileSize(appState.selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-bold text-[#374151] hover:text-[#111827] px-4 py-2 rounded-md bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB]"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={clearFile}
                            className="text-[#6B7280] hover:text-[#111827] p-2 rounded-md hover:bg-[#F3F4F6]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center mb-3">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-base font-bold text-[#111827]">
                          Drag &amp; drop your file, or <span className="text-[#3B82F6] underline cursor-pointer">click to browse</span>
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1.5 font-medium">
                          PDF · DOCX · Images · Audio · Video (Up to 500MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* OR Separator */}
                <div className="or-separator">
                  <span>OR</span>
                </div>

                {/* Paste Text Content */}
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-sm font-bold text-[#111827]">
                    Paste Text Content
                  </label>

                  <div className="relative w-full">
                    <textarea
                      value={appState.rawText}
                      onChange={(e) =>
                        setAppState((prev) => ({ ...prev, rawText: e.currentTarget.value }))
                      }
                      placeholder="Enter or paste text content to analyze directly..."
                      rows={6}
                      className="source-textarea"
                    />
                    <div className="absolute right-3.5 bottom-3.5 pointer-events-none text-xs font-mono font-semibold text-[#6B7280] bg-[#F3F4F6] px-2.5 py-1 rounded border border-[#E5E7EB]">
                      {appState.rawText.length.toLocaleString()} chars
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Configuration Grid (1fr / 1fr Balanced Columns) */}
              <div className="config-grid">

                {/* Left Column: Target Outputs */}
                <div className="flex flex-col gap-3.5">
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">Target Outputs</h3>
                    <p className="text-xs text-[#6B7280]">Select the deliverables you want to generate.</p>
                  </div>

                  <div className="config-card flex flex-col gap-2">
                    {OUTPUT_OPTIONS.map((option) => {
                      const isChecked = parameters.selected_outputs.includes(option)
                      return (
                        <label
                          key={option}
                          className={`flex items-center gap-3.5 cursor-pointer select-none p-2.5 rounded-md transition-all ${
                            isChecked ? "bg-blue-50/70 text-[#111827]" : "hover:bg-white text-[#4B5563]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOutput(option)}
                          />
                          <span className={`text-sm ${isChecked ? "font-bold text-[#111827]" : "font-medium"}`}>
                            {option}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Right Column: Ingestion Settings */}
                <div className="flex flex-col gap-3.5">
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">Ingestion Settings</h3>
                    <p className="text-xs text-[#6B7280]">Configure target audience, tone, language, and depth.</p>
                  </div>

                  <div className="config-card flex flex-col gap-4">
                    {/* Target Audience */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">Target Audience</label>
                      <select
                        value={parameters.target_audience}
                        onChange={(e) =>
                          updateParameter("target_audience", e.currentTarget.value as TargetAudience)
                        }
                        className="select-input"
                      >
                        <option value={TargetAudience.GENERAL_PUBLIC}>{TargetAudience.GENERAL_PUBLIC}</option>
                        <option value={TargetAudience.EXECUTIVES}>{TargetAudience.EXECUTIVES}</option>
                        <option value={TargetAudience.TECHNICAL_EXPERTS}>{TargetAudience.TECHNICAL_EXPERTS}</option>
                        <option value={TargetAudience.MEDIA}>{TargetAudience.MEDIA}</option>
                      </select>
                    </div>

                    {/* Tone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">Tone</label>
                      <select
                        value={parameters.tone}
                        onChange={(e) =>
                          updateParameter("tone", e.currentTarget.value as Tone)
                        }
                        className="select-input"
                      >
                        <option value={Tone.FORMAL}>{Tone.FORMAL}</option>
                        <option value={Tone.URGENT}>{Tone.URGENT}</option>
                        <option value={Tone.CONVERSATIONAL}>{Tone.CONVERSATIONAL}</option>
                        <option value={Tone.REASSURING}>{Tone.REASSURING}</option>
                      </select>
                    </div>

                    {/* Output Language */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">Output Language</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[Language.ENGLISH, Language.HINDI].map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => updateParameter("language", lang)}
                            className={`py-2.5 text-xs font-bold rounded-md border transition-all ${
                              parameters.language === lang
                                ? "bg-[#3B82F6] border-[#3B82F6] text-white"
                                : "bg-white border-[#D1D5DB] text-[#4B5563] hover:bg-[#F3F4F6]"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detail Level */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">Detail Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[DetailLevel.BRIEF, DetailLevel.STANDARD, DetailLevel.COMPREHENSIVE].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateParameter("detail_level", level)}
                            className={`py-2.5 text-xs font-bold rounded-md border transition-all truncate px-1 ${
                              parameters.detail_level === level
                                ? "bg-[#3B82F6] border-[#3B82F6] text-white"
                                : "bg-white border-[#D1D5DB] text-[#4B5563] hover:bg-[#F3F4F6]"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Primary CTA Button (Full Workspace Width) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleIngest}
                  disabled={
                    (!appState.selectedFile && !appState.rawText.trim()) ||
                    parameters.selected_outputs.length === 0
                  }
                  className="btn-primary-generate"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>Process &amp; Generate</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Phase 2: Processing State ─────────────────────────── */}
          {(appState.currentPhase === "ingesting" || appState.currentPhase === "generating") && (
            <div className="py-28 flex flex-col items-center justify-center text-center gap-4 w-full">
              <Loader className="h-12 w-12 text-[#3B82F6] animate-spin" />
              <div>
                <h2 className="text-2xl font-bold text-[#111827]">
                  {appState.currentPhase === "ingesting" ? "Analyzing Source Content" : "Generating Deliverables"}
                </h2>
                <p className="text-sm text-[#6B7280] mt-1.5 max-w-md">
                  {appState.currentPhase === "ingesting"
                    ? "Parsing and extracting document structure..."
                    : "Synthesizing multi-format content tailored to your audience..."}
                </p>
              </div>
            </div>
          )}

          {/* ── Phase 3: Results State ────────────────────────────── */}
          {appState.currentPhase === "complete" && appState.generationResult && (
            <div className="flex flex-col gap-6 w-full">

              {/* Results Header */}
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#111827]">Transformation Complete</h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Generated {Object.keys(appState.generationResult.deliverables).length} deliverables in{" "}
                    {appState.generationResult.execution_time_seconds.toFixed(2)}s
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-md transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>New Transformation</span>
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-[#E5E7EB] gap-2 overflow-x-auto">
                {RESULT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAppState((prev) => ({ ...prev, resultTab: tab.id }))}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 rounded-none transition-colors whitespace-nowrap ${
                      appState.resultTab === tab.id
                        ? "border-[#3B82F6] text-[#3B82F6]"
                        : "border-transparent text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="pt-2">
                {appState.resultTab === "deliverables" && (
                  <DeliverablesWorkspace
                    deliverables={appState.generationResult.deliverables}
                    executionTime={appState.generationResult.execution_time_seconds}
                    generationId={appState.generationResult.generation_id}
                    onClose={() => {}}
                  />
                )}

                {appState.resultTab === "refine" && (
                  <ReviewExport
                    deliverables={appState.generationResult.deliverables}
                    parameters={parameters}
                  />
                )}

                {appState.resultTab === "export" && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#111827]">Export Deliverables</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { format: "pdf" as const, label: "Export PDF", icon: "📄" },
                        { format: "docx" as const, label: "Export Word", icon: "📝" },
                        { format: "json" as const, label: "Export JSON", icon: "⚙️" },
                      ].map(({ format, label, icon }) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => {
                            api
                              .exportDeliverables(
                                appState.generationResult!.deliverables,
                                parameters,
                                format
                              )
                              .then((blob) => {
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement("a")
                                a.href = url
                                a.download = `deliverables.${format}`
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                window.URL.revokeObjectURL(url)
                                toast.success(`${format.toUpperCase()} exported!`, 2000)
                              })
                              .catch(() => {
                                toast.error(`${format.toUpperCase()} export failed`, 2000)
                              })
                          }}
                          className="flex flex-col items-center justify-center p-5 bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-blue-50/30 rounded-lg text-xs font-bold text-[#111827] transition-colors gap-2"
                        >
                          <span className="text-2xl">{icon}</span>
                          <span>{label}</span>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const text = Object.entries(appState.generationResult!.deliverables)
                            .map(([k, v]) => `${k}:\n${Array.isArray(v) ? v.join("\n") : v}`)
                            .join("\n\n")
                          const blob = new Blob([text], { type: "text/plain" })
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = url
                          a.download = "deliverables.txt"
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          window.URL.revokeObjectURL(url)
                          toast.success("TXT exported!", 2000)
                        }}
                        className="flex flex-col items-center justify-center p-5 bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-blue-50/30 rounded-lg text-xs font-bold text-[#111827] transition-colors gap-2"
                      >
                        <span className="text-2xl">📋</span>
                        <span>Export TXT</span>
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
                      <h3 className="text-base font-bold text-[#111827]">Synthesize Speech Audio</h3>
                      <p className="text-xs text-[#6B7280]">Select a deliverable format to generate narrated speech audio.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.keys(appState.generationResult.deliverables).map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => handleGenerateTTS(format)}
                          disabled={appState.isGeneratingTTS}
                          className="flex items-center gap-2 p-3 bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-blue-50/30 rounded-lg text-xs font-semibold text-[#111827] transition-colors"
                        >
                          <Volume2 className="h-4 w-4 text-[#3B82F6] flex-shrink-0" />
                          <span className="truncate">{format}</span>
                        </button>
                      ))}
                    </div>

                  {appState.ttsAudioUrl && (
                    <div className="pt-4 border-t border-[#E5E7EB]">
                      <AudioPlayer
                        audioUrl={appState.ttsAudioUrl}
                        title="Speech Playback"
                        isLoading={appState.isGeneratingTTS}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}

export default App
