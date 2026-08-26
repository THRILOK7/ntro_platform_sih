/**
 * Analytics Panel Component
 * Displays metrics and analytics for generated deliverables.
 */

import React from 'react';
import { Activity, Clock, FileText, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

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
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
        <div className="h-6 bg-slate-700 rounded animate-pulse w-1/3"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics || Object.keys(analytics).length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No analytics available</p>
      </div>
    );
  }

  // Aggregate analytics across all deliverables
  const aggregated = aggregateAnalytics(analytics);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        Analytics Overview
      </h3>

      {/* Summary badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsBadge
          icon={<Clock className="w-4 h-4" />}
          label="Reading Time"
          value={`${aggregated.totalReadingTime} min`}
          color="blue"
        />
        <AnalyticsBadge
          icon={<FileText className="w-4 h-4" />}
          label="Total Words"
          value={aggregated.totalWords.toLocaleString()}
          color="green"
        />
        <AnalyticsBadge
          icon={<TrendingUp className="w-4 h-4" />}
          label="Sentiment"
          value={aggregated.dominantSentiment}
          color={getSentimentColor(aggregated.dominantSentiment)}
        />
        <AnalyticsBadge
          icon={<Activity className="w-4 h-4" />}
          label="Formats"
          value={Object.keys(analytics).length.toString()}
          color="purple"
        />
      </div>

      {/* Per-deliverable analytics */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300">Per-Deliverable Breakdown</h4>
        <div className="space-y-2">
          {Object.entries(analytics).map(([format, data]) => (
            <DeliverableAnalyticsRow key={format} format={format} data={data} />
          ))}
        </div>
      </div>

      {/* Top entities */}
      {aggregated.topEntities.length > 0 && (
        <div className="space-y-3 border-t border-slate-700 pt-4">
          <h4 className="text-sm font-medium text-slate-300">Key Entities</h4>
          <div className="flex flex-wrap gap-2">
            {aggregated.topEntities.map((entity, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-slate-800 border border-slate-600 rounded-full text-xs text-slate-300"
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

interface AnalyticsBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const AnalyticsBadge: React.FC<AnalyticsBadgeProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    green: 'bg-green-500/10 border-green-500/30 text-green-300',
    red: 'bg-red-500/10 border-red-500/30 text-red-300',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
  };

  return (
    <div className={clsx('p-3 rounded-lg border', colorClasses[color])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
};

interface DeliverableAnalyticsRowProps {
  format: string;
  data: AnalyticsData;
}

const DeliverableAnalyticsRow: React.FC<DeliverableAnalyticsRowProps> = ({
  format,
  data,
}) => {
  return (
    <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-200">{format}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {data.word_count} words • {data.reading_time_minutes} min read
          </span>
          <span
            className={clsx(
              'text-xs px-2 py-1 rounded',
              getSentimentBadgeClass(data.sentiment)
            )}
          >
            {data.sentiment}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-slate-400">
          Audience Match: {(data.estimated_audience_match * 100).toFixed(0)}%
        </div>
        <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${data.estimated_audience_match * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper functions
 */

function getSentimentColor(
  sentiment: string
): 'blue' | 'green' | 'red' | 'yellow' | 'purple' {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'green';
    case 'negative':
      return 'red';
    case 'urgent':
      return 'yellow';
    default:
      return 'blue';
  }
}

function getSentimentBadgeClass(sentiment: string): string {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'bg-green-500/20 text-green-300';
    case 'negative':
      return 'bg-red-500/20 text-red-300';
    case 'urgent':
      return 'bg-yellow-500/20 text-yellow-300';
    default:
      return 'bg-blue-500/20 text-blue-300';
  }
}

interface AggregatedAnalytics {
  totalReadingTime: number;
  totalWords: number;
  dominantSentiment: string;
  topEntities: string[];
}

function aggregateAnalytics(analytics: Record<string, AnalyticsData>): AggregatedAnalytics {
  let totalReadingTime = 0;
  let totalWords = 0;
  const sentiments: string[] = [];
  const allEntities: string[] = [];

  Object.values(analytics).forEach((data) => {
    totalReadingTime += data.reading_time_minutes;
    totalWords += data.word_count;
    sentiments.push(data.sentiment);
    allEntities.push(...data.entities);
  });

  // Find dominant sentiment
  const sentimentCounts = sentiments.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const dominantSentiment = Object.entries(sentimentCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] || 'neutral';

  // Get top unique entities
  const entityCounts = allEntities.reduce(
    (acc, e) => {
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topEntities = Object.entries(entityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([entity]) => entity);

  return {
    totalReadingTime,
    totalWords,
    dominantSentiment,
    topEntities,
  };
}
