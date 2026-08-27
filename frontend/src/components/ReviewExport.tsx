/**
 * Review, Refinement & Export Component
 * Inline editing and AI refinement of deliverables in Flat Design.
 */

import React, { useState } from 'react';
import { RefreshCw, Copy, Check, Sparkles } from 'lucide-react';
import { toast } from '../utils/toast';
import { api } from '../api';

interface ReviewExportProps {
  deliverables: Record<string, string | string[]>;
  parameters: Record<string, any>;
}

type RefinementPreset = 'shorten' | 'formal' | 'translate' | 'custom';

export const ReviewExport: React.FC<ReviewExportProps> = ({
  deliverables,
  parameters,
}) => {
  const [selectedFormat, setSelectedFormat] = useState(
    Object.keys(deliverables)[0] || ''
  );
  const [editedContent, setEditedContent] = useState<string>('');
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  React.useEffect(() => {
    if (selectedFormat && deliverables[selectedFormat]) {
      const content = deliverables[selectedFormat];
      setEditedContent(Array.isArray(content) ? content.join('\n\n') : content);
    }
  }, [selectedFormat, deliverables]);

  const currentContent = editedContent || (
    deliverables[selectedFormat]
      ? Array.isArray(deliverables[selectedFormat])
        ? (deliverables[selectedFormat] as string[]).join('\n\n')
        : (deliverables[selectedFormat] as string)
      : ''
  );

  const handleApplyPreset = async (preset: RefinementPreset) => {
    const instructions: Record<RefinementPreset, string> = {
      shorten: 'Make this content significantly more concise (30% shorter)',
      formal: 'Make this content more formal and professional',
      translate: 'Translate this content to Hindi',
      custom: refinementInstruction,
    };

    if (!instructions[preset]) {
      toast.error('Please enter a refinement instruction', 3000);
      return;
    }

    await handleRefine(instructions[preset]);
  };

  const handleRefine = async (instruction: string) => {
    if (!selectedFormat || !currentContent.trim()) {
      toast.error('Select a deliverable to refine', 3000);
      return;
    }

    setIsRefining(true);
    try {
      const result = await api.refineContent({
        original_content: currentContent,
        instruction,
        format_type: selectedFormat,
        parameters,
      });

      if (result.refined_content) {
        setEditedContent(result.refined_content);
        toast.success(`Refinement applied: ${result.change_summary}`, 3000);
      }
    } catch (err) {
      console.error('Refinement error:', err);
      toast.error('Failed to refine content', 3000);
    } finally {
      setIsRefining(false);
      setRefinementInstruction('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent).then(() => {
      setIsCopied(true);
      toast.success('Copied to clipboard!', 2000);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!selectedFormat) {
    return (
      <div className="p-8 text-center text-sm text-[#6B7280]">
        No deliverables available to review.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Format Selector Pills */}
      <div className="flex gap-2 flex-wrap border-b border-[#E5E7EB] pb-3">
        {Object.keys(deliverables).map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => setSelectedFormat(format)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              selectedFormat === format
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E7EB]'
            }`}
          >
            {format}
          </button>
        ))}
      </div>

      {/* Editor Box */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#111827]">
            Review &amp; Edit: <span className="text-[#3B82F6]">{selectedFormat}</span>
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB] rounded-md transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>

        <textarea
          value={currentContent}
          onChange={(e) => setEditedContent(e.target.value)}
          rows={11}
          className="w-full text-sm leading-relaxed font-sans"
          placeholder="Content will appear here..."
        />
      </div>

      {/* Quick AI Refinements */}
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#3B82F6]" />
          <h4 className="text-sm font-bold text-[#111827]">
            Refinement Presets
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleApplyPreset('shorten')}
            disabled={isRefining}
            className="py-2.5 px-4 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-blue-50/20 text-[#111827] rounded-md transition-colors"
          >
            ✂️ Make Concise (30% shorter)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('formal')}
            disabled={isRefining}
            className="py-2.5 px-4 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-blue-50/20 text-[#111827] rounded-md transition-colors"
          >
            👔 Formal Tone
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('translate')}
            disabled={isRefining}
            className="py-2.5 px-4 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-blue-50/20 text-[#111827] rounded-md transition-colors"
          >
            🌐 Translate to Hindi
          </button>
        </div>

        {/* Custom instruction */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-[#4B5563]">Custom Refinement Prompt</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 'Format key metrics as bullet points' or 'Make it suitable for social media'..."
              value={refinementInstruction}
              onChange={(e) => setRefinementInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && refinementInstruction.trim() && !isRefining) {
                  handleApplyPreset('custom');
                }
              }}
              className="flex-1 text-xs"
            />
            <button
              type="button"
              onClick={() => handleApplyPreset('custom')}
              disabled={isRefining || !refinementInstruction.trim()}
              className="px-5 py-2.5 text-xs font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-md transition-colors disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
            >
              {isRefining && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Apply Prompt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewExport;
