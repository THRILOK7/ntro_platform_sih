/**
 * Review, Refinement & Export Component
 * Allows inline editing, refinement, and multi-format export of deliverables.
 */

import React, { useState } from 'react';
import {
  Download,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
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
  const [isEditing, setIsEditing] = useState(false);
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize edited content when format changes
  React.useEffect(() => {
    if (selectedFormat && deliverables[selectedFormat]) {
      const content = deliverables[selectedFormat];
      setEditedContent(Array.isArray(content) ? content.join('\n\n') : content);
      setIsEditing(false);
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
    navigator.clipboard
      .writeText(currentContent)
      .then(() => {
        setIsCopied(true);
        toast.success('Copied to clipboard!', 2000);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => {
        toast.error('Failed to copy', 2000);
      });
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'json') => {
    setIsExporting(true);
    try {
      const response = await api.exportDeliverables(
        deliverables,
        parameters,
        format
      );

      // Create blob and trigger download
      const blob = new Blob([response], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : format === 'docx'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deliverables.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported as ${format.toUpperCase()}!`, 2000);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Failed to export as ${format.toUpperCase()}`, 2000);
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedFormat) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No deliverables to review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Format Selector */}
      <div className="flex gap-2 flex-wrap">
        {Object.keys(deliverables).map((format) => (
          <button
            key={format}
            onClick={() => setSelectedFormat(format)}
            className={clsx(
              'px-3 py-2 text-sm font-medium rounded-lg transition-all',
              selectedFormat === format
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            {format}
          </button>
        ))}
      </div>

      {/* Content Editor */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">
            {selectedFormat}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
        </div>

        <textarea
          value={currentContent}
          onChange={(e) => {
            setEditedContent(e.target.value);
            setIsEditing(true);
          }}
          className="w-full h-48 bg-slate-800 border border-slate-700 rounded p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
          placeholder="Content will appear here..."
        />

        {isEditing && (
          <div className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Unsaved changes
          </div>
        )}
      </div>

      {/* Quick Refinement Actions */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Quick Refinements
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <button
            onClick={() => handleApplyPreset('shorten')}
            disabled={isRefining}
            className="px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded transition-colors"
          >
            Shorten
          </button>
          <button
            onClick={() => handleApplyPreset('formal')}
            disabled={isRefining}
            className="px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded transition-colors"
          >
            Make Formal
          </button>
          <button
            onClick={() => handleApplyPreset('translate')}
            disabled={isRefining}
            className="px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded transition-colors"
          >
            Hindi
          </button>
        </div>

        {/* Custom Refinement */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Custom instruction..."
            value={refinementInstruction}
            onChange={(e) => setRefinementInstruction(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => handleApplyPreset('custom')}
            disabled={isRefining || !refinementInstruction.trim()}
            className="px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            {isRefining ? 'Refining...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="px-3 py-2 text-xs font-medium bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-300 border border-red-600/30 rounded transition-colors"
          >
            PDF
          </button>
          <button
            onClick={() => handleExport('docx')}
            disabled={isExporting}
            className="px-3 py-2 text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-300 border border-blue-600/30 rounded transition-colors"
          >
            DOCX
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="px-3 py-2 text-xs font-medium bg-green-600/20 hover:bg-green-600/30 disabled:opacity-50 text-green-300 border border-green-600/30 rounded transition-colors"
          >
            JSON
          </button>
          <button
            onClick={() => {
              const text = Object.entries(deliverables)
                .map(([k, v]) => `${k}:\n${Array.isArray(v) ? v.join('\n') : v}`)
                .join('\n\n');
              const blob = new Blob([text], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'deliverables.txt';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
              toast.success('Exported as TXT!', 2000);
            }}
            disabled={isExporting}
            className="px-3 py-2 text-xs font-medium bg-gray-600/20 hover:bg-gray-600/30 disabled:opacity-50 text-gray-300 border border-gray-600/30 rounded transition-colors"
          >
            TXT
          </button>
        </div>
      </div>
    </div>
  );
};
