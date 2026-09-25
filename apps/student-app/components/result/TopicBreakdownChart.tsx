'use client';

import React, { useState } from 'react';
import { TopicPerformance } from '@exam-platform/shared-types';

interface TopicBreakdownChartProps {
  topics?: TopicPerformance[];
  strengths?: string[];
  weaknesses?: string[];
}

export const TopicBreakdownChart: React.FC<TopicBreakdownChartProps> = ({
  topics = [],
  strengths = [],
  weaknesses = [],
}) => {
  const [filter, setFilter] = useState<'ALL' | 'WEAKNESSES' | 'MASTERED'>('ALL');

  if (!topics || topics.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center text-slate-400">
        <p className="text-sm">No topic categorization available for this exam.</p>
      </div>
    );
  }

  const filteredTopics = topics.filter((topic) => {
    if (filter === 'WEAKNESSES') {
      return topic.proficiencyLevel === 'NEEDS_FOCUS' || topic.percentage < 60;
    }
    if (filter === 'MASTERED') {
      return topic.proficiencyLevel === 'MASTERED' || topic.percentage >= 80;
    }
    return true;
  });

  const masteredCount = topics.filter((t) => t.proficiencyLevel === 'MASTERED' || t.percentage >= 80).length;
  const focusCount = topics.filter((t) => t.proficiencyLevel === 'NEEDS_FOCUS' || t.percentage < 50).length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Topic-Wise Weakness & Strength Analysis
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Detailed breakdown of your accuracy, concept mastery, and prioritized revision areas.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-950/70 p-1 rounded-2xl border border-slate-800 text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Topics ({topics.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('WEAKNESSES')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'WEAKNESSES'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Focus Needed ({focusCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('MASTERED')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'MASTERED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mastered ({masteredCount})
          </button>
        </div>
      </div>

      {/* Summary Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths Card */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Key Strengths ({strengths.length})</span>
          </div>
          {strengths.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {strengths.map((str, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold"
                >
                  {str}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-1">Keep practicing to build your core strengths.</p>
          )}
        </div>

        {/* Priority Focus Card */}
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold tracking-wide uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Priority Focus Areas ({weaknesses.length})</span>
          </div>
          {weaknesses.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {weaknesses.map((weak, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold"
                >
                  {weak}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-1">Excellent job! No critical weakness detected.</p>
          )}
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => {
          const isMastered = topic.proficiencyLevel === 'MASTERED' || topic.percentage >= 80;
          const isDeveloping = topic.proficiencyLevel === 'DEVELOPING' || (topic.percentage >= 50 && topic.percentage < 80);
          const isNeedsFocus = topic.proficiencyLevel === 'NEEDS_FOCUS' || topic.percentage < 50;

          const barColor = isMastered
            ? 'from-emerald-500 to-teal-400'
            : isDeveloping
              ? 'from-amber-500 to-yellow-400'
              : 'from-rose-500 to-red-400';

          const badgeBg = isMastered
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : isDeveloping
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400';

          const badgeLabel = isMastered
            ? 'Mastered'
            : isDeveloping
              ? 'Developing'
              : 'Needs Practice';

          return (
            <div
              key={topic.topicId}
              className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
            >
              {/* Top Row: Topic Title, Badge, & Percentage */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 text-sm font-bold">
                    {topic.topicName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      {topic.topicName}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span>{topic.totalQuestions} {topic.totalQuestions === 1 ? 'Question' : 'Questions'}</span>
                      <span>•</span>
                      <span>{topic.earnedPoints} / {topic.totalPoints} pts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
                    {badgeLabel}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-100">{topic.percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                  style={{ width: `${Math.max(topic.percentage, 3)}%` }}
                />
              </div>

              {/* Bottom Row: Detailed counts & Recommendation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400 font-medium">✓ {topic.correctCount} Correct</span>
                  <span className="text-rose-400 font-medium">✗ {topic.incorrectCount} Incorrect</span>
                  {topic.unansweredCount > 0 && (
                    <span className="text-slate-500 font-medium">○ {topic.unansweredCount} Unanswered</span>
                  )}
                </div>

                {topic.recommendation && (
                  <p className="text-slate-300 italic text-left sm:text-right max-w-md">
                    💡 {topic.recommendation}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400 bg-slate-950/30 rounded-2xl border border-slate-800">
            No topics found matching this filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicBreakdownChart;
