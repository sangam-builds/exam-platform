'use client';

import React, { useState, useEffect } from 'react';
import { Topic } from '@exam-platform/shared-types';
import { Button, Input } from '@exam-platform/ui';
import { api } from '../../lib/apiClient';

export interface TopicTagSelectorProps {
  selectedTopicId?: string | null;
  onChange: (topicId?: string) => void;
}

export const TopicTagSelector: React.FC<TopicTagSelectorProps> = ({
  selectedTopicId,
  onChange,
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await api.topics.getTopics();
      setTopics(data);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const created = await api.topics.createTopic({ name: newTopicName.trim() });
      setTopics((prev) => [...prev, created]);
      onChange(created.id);
      setNewTopicName('');
      setIsCreatingNew(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create topic');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-slate-300">Topic / Domain</label>
        <button
          type="button"
          onClick={() => {
            setIsCreatingNew(!isCreatingNew);
            setError(null);
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          {isCreatingNew ? 'Cancel' : '+ New Topic'}
        </button>
      </div>

      {isCreatingNew && (
        <div className="mb-2 p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Data Structures, Calculus"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className="text-xs h-8"
              autoFocus
            />
            <Button
              type="button"
              variant="primary"
              className="h-8 text-xs px-3 shrink-0"
              isLoading={creating}
              onClick={handleCreateTopic}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      <select
        value={selectedTopicId || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={loading}
      >
        <option value="">No Topic Assigned</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TopicTagSelector;
