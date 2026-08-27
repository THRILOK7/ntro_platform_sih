/**
 * DeliverablesWorkspace Component
 * Flat design deliverable viewer for generated content.
 */

import React, { useState } from "react"
import {
  Copy,
  CheckCircle,
  FileText,
  Share2,
  Zap,
  AlertTriangle,
  FileVideo,
  Palette,
  Presentation,
  Clock,
  KeyRound,
  X,
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
  "Executive Summary": <FileText className="h-4 w-4" />,
  "LinkedIn Post": <Share2 className="h-4 w-4" />,
  "Twitter/X Post": <Zap className="h-4 w-4" />,
  Advisory: <AlertTriangle className="h-4 w-4" />,
  "Video Package": <FileVideo className="h-4 w-4" />,
  Infographic: <Palette className="h-4 w-4" />,
  Presentation: <Presentation className="h-4 w-4" />,
}

export const DeliverablesWorkspace: React.FC<DeliverablesWorkspaceProps> = ({
  deliverables,
  executionTime,
  generationId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>(Object.keys(deliverables)[0] || "")
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
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  const getCharCount = (content: string | string[]): number => {
    const text = Array.isArray(content) ? content.join(" ") : content
    return text.length
  }

  const activeContent = deliverables[activeTab]

  return (
    <div className="space-y-4">
      {/* Top Metadata Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-2.5 text-xs text-[#6B7280]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono">
            <KeyRound className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="font-semibold text-[#111827]">ID:</span> {generationId.slice(0, 8)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="font-semibold text-[#111827]">Time:</span> {executionTime.toFixed(2)}s
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827] p-1 rounded hover:bg-[#E5E7EB]"
            aria-label="Close workspace"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Format Selector Bar */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
        {Object.entries(deliverables).map(([format, content]) => (
          <button
            key={format}
            type="button"
            onClick={() => setActiveTab(format)}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === format
                ? "bg-[#3B82F6] text-white"
                : "bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E7EB]"
            }`}
          >
            {FORMAT_ICONS[format] || <FileText className="h-4 w-4" />}
            <span>{format}</span>
            {Array.isArray(content) && (
              <span className="text-[10px] opacity-80 font-mono">
                ({content.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Deliverable Viewer */}
      {activeContent && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#111827]">{activeTab}</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {getWordCount(activeContent).toLocaleString()} words • {getCharCount(activeContent).toLocaleString()} characters
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(activeTab, activeContent)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB] rounded-md transition-colors"
            >
              {copiedFormat === activeTab ? (
                <>
                  <CheckCircle className="h-4 w-4 text-[#10B981]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Content</span>
                </>
              )}
            </button>
          </div>

          {/* Deliverable Body */}
          <div>
            {Array.isArray(activeContent) ? (
              <div className="space-y-3">
                {activeContent.map((tweet, index) => (
                  <div
                    key={index}
                    className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
                      <span className="text-[#3B82F6]">Tweet {index + 1} of {activeContent.length}</span>
                      <span className="font-mono">{tweet.length} / 280 chars</span>
                    </div>
                    <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed">
                      {tweet}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto pr-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                <div className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed font-sans">
                  {activeContent}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => handleCopy(activeTab, activeContent)}
              className="flex-1 py-2.5 text-xs font-semibold text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-md transition-colors"
            >
              Copy Full Deliverable
            </button>
            <button
              type="button"
              onClick={() => {
                const text = Array.isArray(activeContent) ? activeContent.join("\n\n") : activeContent
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text.substring(0, 280))}`, "_blank")
              }}
              className="flex-1 py-2.5 text-xs font-semibold text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-md transition-colors"
            >
              Share Preview on Twitter/X
            </button>
          </div>
        </div>
      )}

      {!activeContent && (
        <div className="p-8 text-center text-sm text-[#6B7280]">
          No format selected.
        </div>
      )}
    </div>
  )
}

export default DeliverablesWorkspace
