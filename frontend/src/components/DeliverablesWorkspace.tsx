/**
 * DeliverablesWorkspace Component
 * Enterprise-grade deliverable viewer for Phase 2 generated content
 */

import React, { useState } from "react"
import {
  Copy,
  CheckCircle,
  AlertCircle,
  FileText,
  Share2,
  Zap,
  AlertTriangle,
  FileVideo,
  Palette,
  Presentation,
} from "lucide-react"

export interface Deliverable {
  format: string
  content: string | string[]
}

export interface DeliverablesWorkspaceProps {
  deliverables: Record<string, string | string[]>
  executionTime: number
  generationId: string
  onClose?: () => void
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  "Executive Summary": <FileText className="h-5 w-5" />,
  "LinkedIn Post": <Share2 className="h-5 w-5" />,
  "Twitter/X Post": <Zap className="h-5 w-5" />,
  Advisory: <AlertTriangle className="h-5 w-5" />,
  "Video Package": <FileVideo className="h-5 w-5" />,
  Infographic: <Palette className="h-5 w-5" />,
  Presentation: <Presentation className="h-5 w-5" />,
}

export const DeliverablesWorkspace: React.FC<DeliverablesWorkspaceProps> = ({
  deliverables,
  executionTime,
  generationId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    Object.keys(deliverables)[0] || ""
  )
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)

  const handleCopy = (format: string, content: string | string[]) => {
    const textToCopy = Array.isArray(content) ? content.join("\n\n") : content
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 2000)
    })
  }

  const getWordCount = (content: string | string[]): number => {
    const text = Array.isArray(content) ? content.join(" ") : content
    return text.split(/\s+/).length
  }

  const getCharCount = (content: string | string[]): number => {
    const text = Array.isArray(content) ? content.join(" ") : content
    return text.length
  }

  const activeContent = deliverables[activeTab]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                Content Generation Complete
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {Object.keys(deliverables).length} deliverable(s) generated in{" "}
                {executionTime}s
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-mono text-slate-300">
            ID: {generationId.slice(0, 8)}
          </div>
          <div className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300">
            {Object.keys(deliverables).length} formats
          </div>
          <div className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300">
            {executionTime.toFixed(2)}s execution
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {Object.entries(deliverables).map(([format, content]) => (
          <button
            key={format}
            onClick={() => setActiveTab(format)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
              activeTab === format
                ? "border-b-2 border-cyan-500 bg-cyan-500/10 text-cyan-300"
                : "border-slate-700 text-slate-400 hover:text-slate-300"
            }`}
          >
            {FORMAT_ICONS[format] || <FileText className="h-4 w-4" />}
            <span className="text-sm font-medium">{format}</span>
            {Array.isArray(content) && (
              <span className="ml-1 rounded bg-slate-700 px-2 py-0.5 text-xs">
                {content.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Deliverable Content */}
      {activeContent && (
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          {/* Format Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                {FORMAT_ICONS[activeTab] || <FileText className="h-5 w-5" />}
                {activeTab}
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                {getCharCount(activeContent)} chars • {getWordCount(activeContent)} words
              </p>
            </div>
            <button
              onClick={() => handleCopy(activeTab, activeContent)}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              {copiedFormat === activeTab ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Content Rendering */}
          <div className="space-y-4">
            {Array.isArray(activeContent) ? (
              // Twitter/X Thread rendering
              <div className="space-y-3">
                {activeContent.map((tweet, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-700 bg-slate-950 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-cyan-400">
                        Tweet {index + 1} of {activeContent.length}
                      </span>
                      <span className="text-xs text-slate-500">
                        {tweet.length}/280 chars
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-100">
                      {tweet}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              // Standard text content rendering
              <div className="max-h-96 overflow-y-auto rounded-lg bg-slate-950 p-4">
                <div
                  className={`whitespace-pre-wrap break-words text-sm text-slate-100 ${
                    activeTab === "Executive Summary" ? "prose-headings:text-cyan-300" : ""
                  }`}
                >
                  {/* Simple markdown-like rendering for headers */}
                  {activeContent.split("\n").map((line, idx) => {
                    if (line.startsWith("## ")) {
                      return (
                        <h2
                          key={idx}
                          className="mt-4 text-lg font-semibold text-cyan-300"
                        >
                          {line.substring(3)}
                        </h2>
                      )
                    }
                    if (line.startsWith("# ")) {
                      return (
                        <h1
                          key={idx}
                          className="mt-4 text-xl font-bold text-cyan-400"
                        >
                          {line.substring(2)}
                        </h1>
                      )
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <div key={idx} className="ml-4">
                          • {line.substring(2)}
                        </div>
                      )
                    }
                    return (
                      <div key={idx} className="text-slate-100">
                        {line}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 border-t border-slate-800 pt-4">
            <button
              onClick={() => handleCopy(activeTab, activeContent)}
              className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              <Copy className="mb-1 inline h-4 w-4 mr-2" />
              Copy Full Content
            </button>
            <button
              onClick={() => {
                const text = Array.isArray(activeContent)
                  ? activeContent.join("\n\n")
                  : activeContent
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.substring(0, 280))}`,
                  "_blank"
                )
              }}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
            >
              <Share2 className="mb-1 inline h-4 w-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!activeContent && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-2 text-slate-400">No deliverable selected</p>
        </div>
      )}
    </div>
  )
}

export default DeliverablesWorkspace
