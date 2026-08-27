/**
 * DeliverablesWorkspace Component
 * Matches exact design from reference image with stat cards and visual groupings
 */

import React, { useState, useMemo } from "react"
import {
  Copy,
  CheckCircle,
  FileText,
  Share2,
  Zap,
  AlertTriangle,
  FileVideo,
  Palette,
  Presentation as PresentationIcon,
  Clock,
  Hash,
  MessageSquare,
  RefreshCw,
  Link2,
  Image as ImageIcon,
  BarChart3,
  Download,
  Volume2,
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
  Infographic: <ImageIcon className="h-4 w-4" />,
  Presentation: <PresentationIcon className="h-4 w-4" />,
}

interface StatCard {
  value: string
  label: string
}

interface ContentSection {
  sectionNumber: number
  title: string
  stats?: StatCard[]
  items: { number: string; text: string }[]
}

// Parse content into structured sections with stats
const parseContentSections = (content: string): ContentSection[] => {
  const sections: ContentSection[] = []
  const lines = content.split('\n').filter(l => l.trim())
  
  let currentSection: ContentSection | null = null
  let currentStats: StatCard[] = []
  let sectionCounter = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Section headers (## or **TITLE**)
    if (line.match(/^##\s+/) || (line.startsWith('**') && line.endsWith('**') && line.length < 100)) {
      // Save previous section
      if (currentSection) {
        if (currentStats.length > 0) {
          currentSection.stats = currentStats
        }
        sections.push(currentSection)
      }
      
      sectionCounter++
      const title = line.replace(/^##\s+/, '').replace(/^\*\*|\*\*$/g, '').toUpperCase()
      currentSection = {
        sectionNumber: sectionCounter,
        title,
        items: []
      }
      currentStats = []
    }
    // Detect stat patterns (number/value followed by description)
    else if (line.match(/^[\d+<>%→-]+/) && i + 1 < lines.length) {
      const value = line.replace(/^\*\*|\*\*$/g, '').trim()
      const nextLine = lines[i + 1]?.trim()
      if (nextLine && !nextLine.match(/^[\d+<>%→-]/) && !nextLine.startsWith('-') && !nextLine.startsWith('*')) {
        currentStats.push({
          value: value,
          label: nextLine.replace(/^\*\*|\*\*$/g, '')
        })
        i++ // Skip next line as we've consumed it
        continue
      }
    }
    // Numbered list items (01, 1., etc.)
    else if (line.match(/^(\d{1,2}\.?|\d{1,2})\s+/)) {
      if (currentSection) {
        const match = line.match(/^(\d{1,2}\.?)/)
        const number = match ? match[1].replace('.', '') : String(currentSection.items.length + 1)
        const text = line.replace(/^(\d{1,2}\.?)\s+/, '').replace(/^\*\*|\*\*$/g, '')
        currentSection.items.push({
          number: number.padStart(2, '0'),
          text
        })
      }
    }
    // Bullet points
    else if (line.match(/^[-*]\s+/)) {
      if (currentSection) {
        const text = line.replace(/^[-*]\s+/, '').replace(/^\*\*|\*\*$/g, '')
        currentSection.items.push({
          number: String(currentSection.items.length + 1).padStart(2, '0'),
          text
        })
      }
    }
  }
  
  // Save last section
  if (currentSection) {
    if (currentStats.length > 0) {
      currentSection.stats = currentStats
    }
    sections.push(currentSection)
  }
  
  return sections
}

// Format inline markdown
const formatInlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[#1a1a1a]">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
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
  
  // Parse content into sections
  const parsedSections = useMemo(() => {
    if (!activeContent || Array.isArray(activeContent)) return null
    return parseContentSections(activeContent)
  }, [activeContent])

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FC]">
      
      {/* Top Bar - Full Width */}
      <div className="w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-[#1a1a1a] leading-tight">NTRO Platform</h1>
              <p className="text-[13px] text-[#6B7280] leading-tight">Content Transformation Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-[#F3F4F6] rounded-full">
            <div className="w-2 h-2 bg-[#10B981] rounded-full" />
            <span className="text-[13px] font-medium text-[#374151]">
              Connected · {executionTime.toFixed(0)}ms
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[32px] font-bold text-[#1a1a1a] leading-tight mb-2">
              Transformation complete
            </h2>
            <p className="text-[15px] text-[#6B7280]">
              {Object.keys(deliverables).length} deliverable{Object.keys(deliverables).length !== 1 ? 's' : ''} generated in {executionTime.toFixed(2)}s
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-3 bg-[#1a1a1a] text-white text-[14px] font-semibold rounded-lg hover:bg-[#2d2d2d] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            New transformation
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#E5E7EB] mb-6">
          {[
            { id: 'deliverables', label: 'Deliverables', icon: <FileText className="w-4 h-4" /> },
            { id: 'refine', label: 'Refine', icon: <RefreshCw className="w-4 h-4" /> },
            { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'audio', label: 'Audio', icon: <Volume2 className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`relative flex items-center gap-2 px-5 py-3 text-[14px] font-medium transition-colors ${
                tab.id === 'deliverables'
                  ? 'text-[#4F46E5]'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'deliverables' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F46E5]" />
              )}
            </button>
          ))}
        </div>

        {/* Metadata Strip */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg">
            <Link2 className="w-4 h-4 text-[#9CA3AF]" />
            <span className="text-[13px] font-mono text-[#6B7280]">
              {generationId.slice(0, 13)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg">
            <Clock className="w-4 h-4 text-[#9CA3AF]" />
            <span className="text-[13px] font-mono text-[#6B7280]">
              {executionTime.toFixed(2)}s
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg">
            <Hash className="w-4 h-4 text-[#4F46E5]" />
            <span className="text-[13px] font-mono font-semibold text-[#4F46E5]">
              {Object.keys(deliverables).length} deliverable{Object.keys(deliverables).length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Active Deliverable Type Tag */}
        {activeTab && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg">
              {FORMAT_ICONS[activeTab] || <FileText className="h-4 w-4 text-[#4F46E5]" />}
              <span className="text-[14px] font-semibold text-[#4F46E5]">
                {activeTab}
              </span>
            </div>
          </div>
        )}

        {/* Content Panel */}
        {activeContent && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
            
            {/* Content Header */}
            <div className="flex items-start justify-between px-8 py-6 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-[20px] font-bold text-[#1a1a1a] mb-1">{activeTab}</h3>
                <p className="text-[13px] font-mono text-[#9CA3AF]">
                  {getWordCount(activeContent)} words · {getCharCount(activeContent).toLocaleString()} characters
                </p>
              </div>
              
              <button
                onClick={() => handleCopy(activeTab, activeContent)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D1D5DB] text-[#374151] text-[14px] font-medium rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                {copiedFormat === activeTab ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-[#10B981]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy content</span>
                  </>
                )}
              </button>
            </div>

            {/* Content Body */}
            <div className="px-8 py-8 max-h-[800px] overflow-y-auto">
              {parsedSections && parsedSections.length > 0 ? (
                <div className="space-y-12">
                  {parsedSections.map((section) => (
                    <div key={section.sectionNumber} className="space-y-6">
                      
                      {/* Section Header */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 bg-[#4F46E5] text-white text-[13px] font-bold font-mono rounded">
                          {section.sectionNumber}
                        </div>
                        <h4 className="text-[13px] font-bold text-[#4F46E5] uppercase tracking-wider">
                          {section.title}
                        </h4>
                      </div>

                      {/* Stats Grid */}
                      {section.stats && section.stats.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {section.stats.map((stat, idx) => (
                            <div
                              key={idx}
                              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5"
                            >
                              <div className="text-[28px] font-bold text-[#1a1a1a] mb-2 leading-none">
                                {stat.value}
                              </div>
                              <div className="text-[13px] text-[#6B7280] leading-snug">
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content Items */}
                      {section.items.length > 0 && (
                        <div className="space-y-0">
                          {section.items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex items-start gap-4 py-5 ${
                                idx < section.items.length - 1 ? 'border-b border-[#F3F4F6]' : ''
                              }`}
                            >
                              <div className="flex items-center justify-center min-w-[36px] h-8 px-2 bg-white border border-[#E5E7EB] text-[#6B7280] text-[13px] font-mono font-semibold rounded flex-shrink-0">
                                {item.number}
                              </div>
                              <div className="flex-1 pt-1">
                                <p className="text-[15px] text-[#374151] leading-relaxed">
                                  {formatInlineMarkdown(item.text)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : Array.isArray(activeContent) ? (
                // Twitter thread mode
                <div className="space-y-4">
                  {activeContent.map((tweet, index) => (
                    <div
                      key={index}
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[12px] font-bold font-mono text-[#4F46E5] uppercase">
                          Tweet {index + 1} of {activeContent.length}
                        </span>
                        <span className="text-[12px] font-mono text-[#9CA3AF]">
                          {tweet.length} / 280
                        </span>
                      </div>
                      <p className="text-[15px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                        {tweet}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                // Fallback: plain text
                <div className="text-[15px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {activeContent}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliverablesWorkspace
