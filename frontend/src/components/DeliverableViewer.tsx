/**
 * DeliverableViewer
 * -------------------------------------------------------
 * Complete transformation result screen with functional tabs.
 * All tabs are fully wired to backend endpoints.
 * -------------------------------------------------------
 */

import React, { useState } from "react"
import {
  FileText,
  RefreshCw,
  Download,
  BarChart3,
  Volume2,
  Copy,
  Link2,
  Clock,
  Share2,
  Zap,
  CheckCircle,
  Loader,
  FileDown,
  Play,
  Pause,
} from "lucide-react"

const TABS = [
  { id: "deliverables", label: "Deliverables", icon: FileText },
  { id: "refine", label: "Refine", icon: RefreshCw },
  { id: "export", label: "Export", icon: Download },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audio", label: "Audio", icon: Volume2 },
]

interface DeliverableViewerProps {
  productName?: string
  productTagline?: string
  connectionMs?: number
  deliverableCount?: number
  generationTime?: string
  transformationId?: string
  deliverableType?: string
  contentTitle?: string
  wordCount?: number
  charCount?: number
  sections?: { label: string; items: { text: string }[] }[]
  onNewTransformation?: () => void
  onCopy?: () => void
  allDeliverables?: Record<string, string | string[]>
  onDeliverableChange?: (key: string) => void
  parameters?: any
  onContentRefresh?: (newContent: string) => void
  analytics?: Record<string, any> | null
}

export default function DeliverableViewer({
  productName = "NTRO Platform",
  productTagline = "Content Transformation Engine",
  connectionMs = 7,
  deliverableCount = 1,
  generationTime = "3.77s",
  transformationId = "6f34e67a-b86",
  deliverableType = "LinkedIn Post",
  contentTitle = "LinkedIn Post",
  wordCount = 148,
  charCount = 1165,
  sections = [],
  onNewTransformation = () => {},
  onCopy = () => {},
  allDeliverables = {},
  onDeliverableChange = (key: string) => {},
  parameters = {},
  onContentRefresh = (newContent: string) => {},
  analytics = null,
}: DeliverableViewerProps) {
  const [activeTab, setActiveTab] = useState("deliverables")
  const deliverableKeys = Object.keys(allDeliverables || {})
  const [selectedDeliverable, setSelectedDeliverable] = useState(deliverableKeys[0] || "")
  
  // Refine tab state
  const [refineInstruction, setRefineInstruction] = useState("")
  const [isRefining, setIsRefining] = useState(false)
  const [refineError, setRefineError] = useState("")
  
  // Export tab state
  const [isExporting, setIsExporting] = useState<string | null>(null)
  
  // Audio tab state
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const handleDeliverableChange = (key: string) => {
    setSelectedDeliverable(key)
    if (onDeliverableChange) {
      onDeliverableChange(key)
    }
  }

  const currentContent = allDeliverables[selectedDeliverable] || ""
  const currentContentText = Array.isArray(currentContent) ? currentContent.join("\n\n") : currentContent

  // Refine handler
  const handleRefine = async () => {
    if (!refineInstruction.trim()) {
      setRefineError("Please enter an instruction")
      return
    }

    setIsRefining(true)
    setRefineError("")

    try {
      // Dynamic import to avoid circular dependency
      const { api } = await import("../api")
      
      const response = await api.refineContent({
        original_content: currentContentText,
        instruction: refineInstruction,
        format_type: selectedDeliverable,
        parameters: parameters,
      })

      // Update the content and switch back to deliverables tab
      if (onContentRefresh) {
        onContentRefresh(response.refined_content)
      }
      setRefineInstruction("")
      setActiveTab("deliverables")
      
      // Show success message
      const toast = await import("../utils/toast")
      toast.toast.success("Content refined successfully!", 2000)
    } catch (error: any) {
      setRefineError(error.message || "Failed to refine content")
    } finally {
      setIsRefining(false)
    }
  }

  // Export handler
  const handleExport = async (format: "pdf" | "docx" | "json" | "txt" | "md") => {
    setIsExporting(format)

    try {
      if (format === "txt" || format === "md") {
        // Client-side export
        const text = format === "md" ? currentContentText : currentContentText.replace(/[#*_\-]/g, "")
        const blob = new Blob([text], { type: "text/plain" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${selectedDeliverable}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        // Server-side export
        const { api } = await import("../api")
        const blob = await api.exportDeliverables(
          { [selectedDeliverable]: currentContent },
          parameters,
          format as "pdf" | "docx" | "json"
        )
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${selectedDeliverable}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }

      const toast = await import("../utils/toast")
      toast.toast.success(`${format.toUpperCase()} exported!`, 2000)
    } catch (error: any) {
      const toast = await import("../utils/toast")
      toast.toast.error(`Export failed: ${error.message}`, 2000)
    } finally {
      setIsExporting(null)
    }
  }

  // Audio generation handler
  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true)

    try {
      const { api } = await import("../api")
      const audioBlob = await api.generateTTS({
        content: currentContentText,
        language: parameters.language || "English",
        tone: parameters.tone || "Formal",
        format_type: selectedDeliverable,
      })

      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

      // Create audio element
      const audio = new Audio(url)
      setAudioElement(audio)

      const toast = await import("../utils/toast")
      toast.toast.success("Audio generated!", 2000)
    } catch (error: any) {
      const toast = await import("../utils/toast")
      toast.toast.error(`Audio generation failed: ${error.message}`, 2000)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  // Audio playback handlers
  const togglePlayback = () => {
    if (!audioElement) return

    if (isPlaying) {
      audioElement.pause()
      setIsPlaying(false)
    } else {
      audioElement.play()
      setIsPlaying(true)
    }
  }

  return (
    <div style={{ background: "#F7F8FA", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 24px 80px" }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg,#4C6BFF,#3D5AFE)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(61,90,254,0.35)",
              }}
            >
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "-0.01em",
                  color: "#12151C",
                }}
              >
                {productName}
              </div>
              <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 1 }}>
                {productTagline}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12.5,
              fontWeight: 500,
              color: "#3A3F4B",
              background: "#fff",
              border: "1px solid #E6E8EC",
              padding: "6px 12px",
              borderRadius: 999,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#12A150",
                boxShadow: "0 0 0 3px #E9F9EF",
              }}
            />
            Connected · {connectionMs}ms
          </div>
        </div>

        {/* Header card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E6E8EC",
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(18,21,28,0.04)",
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "26px 26px 20px",
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 23,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  margin: "0 0 5px",
                  color: "#12151C",
                }}
              >
                Transformation complete
              </h1>
              <div style={{ fontSize: 13.5, color: "#6B7280" }}>
                {deliverableCount} deliverable{deliverableCount !== 1 ? "s" : ""} generated in{" "}
                {generationTime}
              </div>
            </div>
            <button
              onClick={onNewTransformation}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "#12151C",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 7,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New transformation
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "0 18px",
              borderTop: "1px solid #E6E8EC",
              overflowX: "auto",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "13px 14px",
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#2A3FD1" : "#6B7280",
                    borderBottom: isActive ? "2px solid #3D5AFE" : "2px solid transparent",
                    background: "none",
                    border: "none",
                    borderBottomWidth: 2,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={15} color={isActive ? "#2A3FD1" : "#6B7280"} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Meta strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              padding: "14px 26px",
              background: "#FBFBFC",
              borderTop: "1px solid #E6E8EC",
            }}
          >
            <MetaChip icon={<Link2 size={12} />}>{transformationId}</MetaChip>
            <MetaChip icon={<Clock size={12} />}>{generationTime}</MetaChip>
            <MetaChip accent>
              {deliverableCount} deliverable{deliverableCount !== 1 ? "s" : ""}
            </MetaChip>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              margin: "14px 26px 22px",
              fontSize: 13,
              fontWeight: 600,
              color: "#2A3FD1",
              background: "#EEF1FF",
              padding: "7px 13px",
              borderRadius: 8,
              width: "fit-content",
            }}
          >
            <Share2 size={14} color="#2A3FD1" />
            {deliverableType}
          </div>

          {/* Deliverable Selector - if multiple deliverables */}
          {deliverableKeys.length > 1 && (
            <div style={{ padding: "0 26px 20px" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Select Deliverable
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {deliverableKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleDeliverableChange(key)}
                    style={{
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: selectedDeliverable === key ? 600 : 500,
                      color: selectedDeliverable === key ? "#2A3FD1" : "#6B7280",
                      background: selectedDeliverable === key ? "#EEF1FF" : "#fff",
                      border: selectedDeliverable === key ? "1.5px solid #3D5AFE" : "1px solid #E6E8EC",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content panel */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E6E8EC",
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(18,21,28,0.04)",
            overflow: "hidden",
          }}
        >
          {/* DELIVERABLES TAB */}
          {activeTab === "deliverables" && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "22px 26px 18px",
                  borderBottom: "1px solid #E6E8EC",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      margin: "0 0 4px",
                      color: "#12151C",
                    }}
                  >
                    {contentTitle}
                  </h2>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#6B7280",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {wordCount} words · {charCount.toLocaleString()} characters
                  </div>
                </div>
                <button
                  onClick={onCopy}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#fff",
                    border: "1px solid #D7DAE0",
                    padding: "8px 13px",
                    borderRadius: 7,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#3A3F4B",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Copy size={13} />
                  Copy content
                </button>
              </div>
              <div style={{ maxHeight: 640, overflowY: "auto", padding: "22px 26px 30px" }}>
                {sections.map((section, i) => (
                  <SectionBlock key={i} section={section} index={i + 1} />
                ))}
              </div>
            </>
          )}

          {/* REFINE TAB */}
          {activeTab === "refine" && (
            <div style={{ padding: "26px" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#12151C", marginBottom: 6 }}>
                Refine Content
              </h3>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
                Provide instructions to adjust the tone, length, or content of "{selectedDeliverable}"
              </p>

              {/* Quick select chips */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                  Quick Actions
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Make tone more formal", "Make tone more conversational", "Shorten by 30%", "Add more detail", "Simplify language"].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setRefineInstruction(suggestion)}
                      style={{
                        padding: "6px 12px",
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: "#6B7280",
                        background: "#F9FAFB",
                        border: "1px solid #E6E8EC",
                        borderRadius: 6,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#EEF1FF"
                        e.currentTarget.style.borderColor = "#3D5AFE"
                        e.currentTarget.style.color = "#2A3FD1"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#F9FAFB"
                        e.currentTarget.style.borderColor = "#E6E8EC"
                        e.currentTarget.style.color = "#6B7280"
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instruction textarea */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                  Your Instruction
                </label>
                <textarea
                  value={refineInstruction}
                  onChange={(e) => {
                    setRefineInstruction(e.target.value)
                    setRefineError("")
                  }}
                  placeholder="e.g., Make the tone more formal, or Shorten the hook by half"
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: "12px 14px",
                    fontSize: 14,
                    color: "#3A3F4B",
                    background: "#fff",
                    border: refineError ? "1.5px solid #EF4444" : "1px solid #E6E8EC",
                    borderRadius: 8,
                    fontFamily: "Inter, sans-serif",
                    resize: "vertical",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    if (!refineError) e.currentTarget.style.borderColor = "#3D5AFE"
                  }}
                  onBlur={(e) => {
                    if (!refineError) e.currentTarget.style.borderColor = "#E6E8EC"
                  }}
                />
                {refineError && (
                  <p style={{ fontSize: 12.5, color: "#EF4444", marginTop: 6 }}>
                    {refineError}
                  </p>
                )}
              </div>

              {/* Regenerate button */}
              <button
                onClick={handleRefine}
                disabled={isRefining}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  background: isRefining ? "#9AA0AC" : "#3D5AFE",
                  border: "none",
                  borderRadius: 8,
                  cursor: isRefining ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isRefining) e.currentTarget.style.background = "#2A3FD1"
                }}
                onMouseLeave={(e) => {
                  if (!isRefining) e.currentTarget.style.background = "#3D5AFE"
                }}
              >
                {isRefining ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Regenerate</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* EXPORT TAB */}
          {activeTab === "export" && (
            <div style={{ padding: "26px" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#12151C", marginBottom: 6 }}>
                Export Options
              </h3>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
                Download "{selectedDeliverable}" in your preferred format
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {[
                  { format: "pdf" as const, label: "PDF Document", icon: "📄", desc: "Formatted PDF file" },
                  { format: "docx" as const, label: "Word Document", icon: "📝", desc: "Editable DOCX file" },
                  { format: "txt" as const, label: "Plain Text", icon: "📋", desc: "Simple text file" },
                  { format: "md" as const, label: "Markdown", icon: "📑", desc: "Markdown format" },
                  { format: "json" as const, label: "JSON Data", icon: "⚙️", desc: "Structured data" },
                ].map(({ format, label, icon, desc }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    disabled={isExporting === format}
                    style={{
                      padding: "16px",
                      background: "#F9FAFB",
                      border: "1px solid #E6E8EC",
                      borderRadius: 10,
                      cursor: isExporting === format ? "not-allowed" : "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (isExporting !== format) {
                        e.currentTarget.style.borderColor = "#3D5AFE"
                        e.currentTarget.style.background = "#EEF1FF"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isExporting !== format) {
                        e.currentTarget.style.borderColor = "#E6E8EC"
                        e.currentTarget.style.background = "#F9FAFB"
                      }
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#12151C", marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>
                      {desc}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: isExporting === format ? "#9AA0AC" : "#3D5AFE" }}>
                      {isExporting === format ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <FileDown size={14} />
                          <span>Export</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <div style={{ padding: "26px" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#12151C", marginBottom: 6 }}>
                Content Analytics
              </h3>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
                Quality metrics and insights for "{selectedDeliverable}"
              </p>

              {analytics && analytics[selectedDeliverable] ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {Object.entries(analytics[selectedDeliverable]).map(([key, value]: [string, any]) => (
                    <div
                      key={key}
                      style={{
                        padding: "16px",
                        background: "#F9FAFB",
                        border: "1px solid #E6E8EC",
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#3D5AFE", marginBottom: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {typeof value === "number" ? value.toFixed(1) : value}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280", textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <BarChart3 size={48} color="#D7DAE0" style={{ margin: "0 auto 16px" }} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#3A3F4B", marginBottom: 8 }}>
                    Analytics Not Available
                  </p>
                  <p style={{ fontSize: 13, color: "#6B7280", maxWidth: 400, margin: "0 auto" }}>
                    Detailed metrics like readability score, sentiment analysis, and keyword density will appear here once analytics processing is complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AUDIO TAB */}
          {activeTab === "audio" && (
            <div style={{ padding: "26px" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#12151C", marginBottom: 6 }}>
                Audio Narration
              </h3>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
                Generate and play text-to-speech audio for "{selectedDeliverable}"
              </p>

              {!audioUrl ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "#EEF1FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}>
                    <Volume2 size={36} color="#3D5AFE" />
                  </div>
                  <button
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 24px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#fff",
                      background: isGeneratingAudio ? "#9AA0AC" : "#3D5AFE",
                      border: "none",
                      borderRadius: 8,
                      cursor: isGeneratingAudio ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isGeneratingAudio) e.currentTarget.style.background = "#2A3FD1"
                    }}
                    onMouseLeave={(e) => {
                      if (!isGeneratingAudio) e.currentTarget.style.background = "#3D5AFE"
                    }}
                  >
                    {isGeneratingAudio ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        <span>Generating Audio...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={16} />
                        <span>Generate Audio Narration</span>
                      </>
                    )}
                  </button>
                  <p style={{ fontSize: 12, color: "#9AA0AC", marginTop: 12, maxWidth: 320, margin: "12px auto 0" }}>
                    This will generate a natural-sounding voice narration of your content
                  </p>
                </div>
              ) : (
                <div>
                  {/* Audio player */}
                  <div style={{
                    padding: 20,
                    background: "#F9FAFB",
                    border: "1px solid #E6E8EC",
                    borderRadius: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <button
                        onClick={togglePlayback}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "#3D5AFE",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {isPlaying ? (
                          <Pause size={20} color="#fff" fill="#fff" />
                        ) : (
                          <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                        )}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#12151C", marginBottom: 4 }}>
                          Audio Narration Ready
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          {wordCount} words · {Math.ceil(wordCount / 150)} min estimated
                        </div>
                      </div>
                      <audio
                        ref={(el) => {
                          if (el && audioUrl && !audioElement) {
                            el.src = audioUrl
                            setAudioElement(el)
                            el.onended = () => setIsPlaying(false)
                          }
                        }}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (audioElement) {
                        audioElement.pause()
                        setIsPlaying(false)
                      }
                      setAudioUrl(null)
                      setAudioElement(null)
                    }}
                    style={{
                      marginTop: 12,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#6B7280",
                      background: "transparent",
                      border: "1px solid #E6E8EC",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Generate New Audio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Sub-components ---------------- */

interface MetaChipProps {
  children: React.ReactNode
  icon?: React.ReactNode
  accent?: boolean
}

function MetaChip({ children, icon, accent }: MetaChipProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: accent ? "#2A3FD1" : "#6B7280",
        background: accent ? "#EEF1FF" : "#fff",
        border: accent ? "1px solid transparent" : "1px solid #E6E8EC",
        padding: "5px 10px",
        borderRadius: 999,
        fontFamily: accent ? "Inter, sans-serif" : "'IBM Plex Mono', monospace",
        fontWeight: accent ? 600 : 400,
      }}
    >
      {icon}
      {children}
    </div>
  )
}

interface SectionBlockProps {
  section: { label: string; items: { text: string }[] }
  index: number
}

function SectionBlock({ section, index }: SectionBlockProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: "#3D5AFE",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10.5,
            fontWeight: 700,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#12151C",
          }}
        >
          {section.label}
        </span>
      </div>
      {section.items.length > 1 ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {section.items.map((item, j) => (
            <li
              key={j}
              style={{
                position: "relative",
                paddingLeft: 18,
                marginBottom: 10,
                fontSize: 13.5,
                lineHeight: 1.6,
                color: "#3A3F4B",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 2,
                  top: 8,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#3D5AFE",
                }}
              />
              {item.text}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#3A3F4B" }}>
          {section.items[0]?.text}
        </p>
      )}
    </div>
  )
}

/* ---------------- Content Parser ---------------- */

/**
 * Parses markdown content into sections
 * Expected input format:
 *   ## HOOK
 *   Imagine turning...
 *
 *   ## BODY
 *   - point one
 *   - point two
 */
export function parseContent(raw: string): { label: string; items: { text: string }[] }[] {
  const blocks = raw.split(/\n(?=##\s)/).filter(Boolean)
  return blocks.map((block) => {
    const lines = block.trim().split("\n").filter(Boolean)
    const label = lines[0].replace(/^##\s*/, "").trim()
    const body = lines.slice(1)
    const isList = body.some((l) => l.trim().startsWith("-"))
    const items = isList
      ? body
          .filter((l) => l.trim().startsWith("-"))
          .map((l) => ({ text: l.replace(/^-+\s*/, "").trim() }))
      : [{ text: body.join(" ").trim() }]
    return { label, items }
  })
}
