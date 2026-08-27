/**
 * Analytics Panel Component
 * Displays metrics and analytics in Flat Design.
 */

import React from 'react';
import { Activity, Clock, FileText, TrendingUp, Sparkles } from 'lucide-react';

interface AnalyticsData {
  reading_time_minutes: number;
  word_count: number;
  character_count: number;
  sentiment: string;
  sentiment_score: number;
  entities: string[];
  format: string;
  estimated_audience_match: number;
}

interface AnalyticsPanelProps {
  analytics: Record<string, AnalyticsData>;
  isLoading?: boolean;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  analytics,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-[#6B7280]">
        Computing deliverable analytics...
      </div>
    );
  }

  if (!analytics || Object.keys(analytics).length === 0) {
    return (
      <div className="p-12 text-center text-sm text-[#6B7280]">
        No analytics data available for these formats.
      </div>
    );
  }

  const aggregated = aggregateAnalytics(analytics);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <Clock className="w-4 h-4 text-[#3B82F6]" />
            <span>Reading Time</span>
          </div>
          <div className="text-2xl font-bold text-[#111827]">{aggregated.totalReadingTime} min</div>
        </div>

        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <FileText className="w-4 h-4 text-[#10B981]" />
            <span>Total Words</span>
          </div>
          <div className="text-2xl font-bold text-[#111827]">{aggregated.totalWords.toLocaleString()}</div>
        </div>

        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
            <span>Sentiment</span>
          </div>
          <div className="text-2xl font-bold text-[#111827] capitalize">{aggregated.dominantSentiment}</div>
        </div>

        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <Activity className="w-4 h-4 text-[#3B82F6]" />
            <span>Active Formats</span>
          </div>
          <div className="text-2xl font-bold text-[#111827]">{Object.keys(analytics).length}</div>
        </div>
      </div>

      {/* Breakdown per format */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-[#111827]">
            Format Performance &amp; Audience Match
          </h4>
          <p className="text-xs text-[#6B7280]">Detailed breakdown of volume, readability, and estimated relevance.</p>
        </div>

        <div className="space-y-3">
          {Object.entries(analytics).map(([format, data]) => (
            <div key={format} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#111827] text-sm">{format}</span>
                <span className="text-[#6B7280]">
                  {data.word_count.toLocaleString()} words • {data.reading_time_minutes}m read • <span className="font-semibold text-[#111827] capitalize">{data.sentiment}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#4B5563] min-w-fit">
                  Audience Match: {(data.estimated_audience_match * 100).toFixed(0)}%
                </span>
                <div className="h-2 flex-1 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3B82F6] rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, data.estimated_audience_match * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Entities */}
      {aggregated.topEntities.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            <h4 className="text-sm font-bold text-[#111827]">
              Extracted Key Entities
            </h4>
          </div>
          <p className="text-xs text-[#6B7280]">Salient terms and topics discovered during analysis.</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {aggregated.topEntities.map((entity, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-md text-xs font-semibold text-[#374151]"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function aggregateAnalytics(analytics: Record<string, AnalyticsData>) {
  let totalReadingTime = 0;
  let totalWords = 0;
  const sentiments: string[] = [];
  const allEntities: string[] = [];

  Object.values(analytics).forEach((data) => {
    totalReadingTime += data.reading_time_minutes || 0;
    totalWords += data.word_count || 0;
    if (data.sentiment) sentiments.push(data.sentiment);
    if (data.entities && Array.isArray(data.entities)) {
      allEntities.push(...data.entities);
    }
  });

  const sentimentCounts = sentiments.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantSentiment =
    Object.entries(sentimentCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

  const entityCounts = allEntities.reduce((acc, e) => {
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topEntities = Object.entries(entityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([entity]) => entity);

  return {
    totalReadingTime,
    totalWords,
    dominantSentiment,
    topEntities,
  };
}

export default AnalyticsPanel;
