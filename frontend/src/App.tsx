/**
 * NTRO Platform - Phase 1 & 2 Integrated Application
 * Content Ingestion + Multi-Platform Generation
 */

import React, { useState, useRef, useEffect } from "react"
import {
  Upload,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
  FileText,
  Activity,
  GitBranch,
  Zap,
  ArrowRight,
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
} from "./api"
import { DeliverablesWorkspace } from "./components/DeliverablesWorkspace"
import "./App.css"

// ==================== Type Definitions ====================

interface HealthStatus {
  operational: boolean
  lastChecked: Date
}

type AppPhase = "input" | "ingesting" | "generating" | "complete"

interface AppState {
  selectedFile: File | null
  rawText: string
  currentPhase: AppPhase
  ingestionResult: IngestionResponse | null
  generationResult: GenerationResponse | null
  error: string | null
  healthStatus: HealthStatus
  resultTabActive: "text" | "json"
  showInputPanel: boolean
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

// ==================== App Component ====================

function App(): React.ReactElement {
  // State management
  const [appState, setAppState] = useState<AppState>({
    selectedFile: null,
    rawText: "",
    currentPhase: "input",
    ingestionResult: null,
    generationResult: null,
    error: null,
    healthStatus: {
      operational: false,
      lastChecked: new Date(),
    },
    resultTabActive: "text",
    showInputPanel: true,
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
   * Ping backend health endpoint
   */
  const checkServiceHealth = async (): Promise<void> => {
    try {
      await checkHealth()
      setAppState((prev) => ({
        ...prev,
        healthStatus: {
          operational: true,
          lastChecked: new Date(),
        },
      }))
    } catch (error) {
      console.error("Health check failed:", error)
      setAppState((prev) => ({
        ...prev,
        healthStatus: {
          operational: false,
          lastChecked: new Date(),
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
   * Handle generation
   */
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
    } catch (error) {
      const apiError = error as ApiError
      setAppState((prev) => ({
        ...prev,
        currentPhase: "input",
        error: apiError.message || "An unexpected error occurred during generation.",
      }))
    }
  }

  /**
   * Reset to input phase
   */
  const handleReset = (): void => {
    setAppState((prev) => ({
      ...prev,
      currentPhase: "input",
      ingestionResult: null,
      generationResult: null,
      error: null,
      selectedFile: null,
      rawText: "",
      showInputPanel: true,
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="h-8 w-8 text-cyan-500" />
              <div>
                <h1 className="text-xl font-bold text-slate-100">NTRO Platform</h1>
                <p className="text-xs text-slate-400">Phase 1 & 2: Complete Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                  appState.healthStatus.operational
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                <Activity
                  className={`h-4 w-4 ${
                    appState.healthStatus.operational
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                />
                <span>
                  {appState.healthStatus.operational
                    ? "Operational"
                    : "Checking..."}
                </span>
              </div>
            </div>
          </div>

          {/* Phase Indicator */}
          {appState.currentPhase !== "input" && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <div
                className={`flex items-center gap-2 rounded px-2 py-1 ${
                  appState.currentPhase === "ingesting" ||
                  appState.currentPhase === "generating" ||
                  appState.currentPhase === "complete"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Zap className="h-4 w-4" />
                Phase 1: Ingestion
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <div
                className={`flex items-center gap-2 rounded px-2 py-1 ${
                  appState.currentPhase === "generating" ||
                  appState.currentPhase === "complete"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Zap className="h-4 w-4" />
                Phase 2: Generation
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {appState.error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-800/50 bg-red-900/20 p-4 text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="mt-1 text-sm">{appState.error}</p>
            </div>
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  error: null,
                }))
              }
              className="text-red-300 hover:text-red-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Phase 1: Input */}
        {appState.currentPhase === "input" && appState.showInputPanel && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Column 1: Source Material */}
            <div className="space-y-6">
              {/* Drag-Drop Area */}
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="relative rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 p-8 transition-colors hover:border-slate-600 drag-zone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".pdf,.docx,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.mp3,.wav,.m4a,.flac,.ogg,.mp4,.webm,.mov,.avi"
                />

                {appState.selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                          <FileText className="h-6 w-6 text-cyan-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-100">
                            {appState.selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {fileTypeInfo?.label} • {formatFileSize(appState.selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={clearFile}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-slate-100"
                    >
                      Choose Different File
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer text-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto h-12 w-12 text-slate-600" />
                    <p className="mt-2 font-medium text-slate-200">
                      Drop file here or click to upload
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      PDF, DOCX, Images, Audio, Video
                    </p>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Raw Text Input
                </label>
                <textarea
                  value={appState.rawText}
                  onChange={(e) =>
                    setAppState((prev) => ({
                      ...prev,
                      rawText: e.currentTarget.value,
                    }))
                  }
                  placeholder="Paste raw text, notes, or transcripts here..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500">
                  {appState.rawText.length} characters
                </p>
              </div>
            </div>

            {/* Column 2: Parameters */}
            <div className="space-y-6">
              {/* Output Deliverables */}
              <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <label className="block text-sm font-medium text-slate-300">
                  Output Deliverables
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OUTPUT_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={parameters.selected_outputs.includes(option)}
                        onChange={() => toggleOutput(option)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500"
                      />
                      <span className="text-sm text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Target Audience
                </label>
                <select
                  value={parameters.target_audience}
                  onChange={(e) =>
                    updateParameter("target_audience", e.currentTarget.value as TargetAudience)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition-colors focus:border-cyan-500 focus:outline-none"
                >
                  <option value={TargetAudience.GENERAL_PUBLIC}>{TargetAudience.GENERAL_PUBLIC}</option>
                  <option value={TargetAudience.EXECUTIVES}>{TargetAudience.EXECUTIVES}</option>
                  <option value={TargetAudience.TECHNICAL_EXPERTS}>{TargetAudience.TECHNICAL_EXPERTS}</option>
                  <option value={TargetAudience.MEDIA}>{TargetAudience.MEDIA}</option>
                </select>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Tone
                </label>
                <select
                  value={parameters.tone}
                  onChange={(e) =>
                    updateParameter("tone", e.currentTarget.value as Tone)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition-colors focus:border-cyan-500 focus:outline-none"
                >
                  <option value={Tone.FORMAL}>{Tone.FORMAL}</option>
                  <option value={Tone.URGENT}>{Tone.URGENT}</option>
                  <option value={Tone.CONVERSATIONAL}>{Tone.CONVERSATIONAL}</option>
                  <option value={Tone.REASSURING}>{Tone.REASSURING}</option>
                </select>
              </div>

              {/* Language Toggle */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[Language.ENGLISH, Language.HINDI].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => updateParameter("language", lang)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        parameters.language === lang
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                          : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Level */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Detail Level
                </label>
                <div className="space-y-2">
                  {[DetailLevel.BRIEF, DetailLevel.STANDARD, DetailLevel.COMPREHENSIVE].map(
                    (level) => (
                      <label
                        key={level}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                          parameters.detail_level === level
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
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
                        <span className="text-sm text-slate-300">{level}</span>
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
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <div className="flex flex-col items-center justify-center space-y-4 py-16">
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-3">
                <Loader className="h-8 w-8 animate-spin text-cyan-500" />
                <h2 className="text-2xl font-bold text-slate-100">
                  {appState.currentPhase === "ingesting"
                    ? "Ingesting Content..."
                    : "Generating Deliverables..."}
                </h2>
              </div>
              <p className="text-slate-400">
                {appState.currentPhase === "ingesting"
                  ? "Extracting and analyzing your source material"
                  : "Creating targeted multi-platform content"}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-2">
              {appState.currentPhase === "ingesting" && (
                <>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    Validating input
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Loader className="h-5 w-5 animate-spin text-cyan-500" />
                    Parsing content
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="h-5 w-5 rounded-full border-2 border-slate-700" />
                    Counting metrics
                  </div>
                </>
              )}

              {appState.currentPhase === "generating" && (
                <>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    Ingestion complete
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Loader className="h-5 w-5 animate-spin text-cyan-500" />
                    Building prompts
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="h-5 w-5 rounded-full border-2 border-slate-700" />
                    Generating outputs
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Phase 2: Deliverables */}
        {appState.currentPhase === "complete" && appState.generationResult && (
          <div className="space-y-6">
            <DeliverablesWorkspace
              deliverables={appState.generationResult.deliverables}
              executionTime={appState.generationResult.execution_time_seconds}
              generationId={appState.generationResult.generation_id}
              onClose={() => {}}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-200 transition-colors hover:bg-slate-700"
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
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 font-medium text-slate-200 transition-colors hover:bg-slate-800"
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
