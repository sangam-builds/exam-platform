'use client';

import React, { useState } from 'react';
import { Modal, Input, Button } from '@exam-platform/ui';
import { api } from '../../lib/apiClient';

export interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an organization name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.organizations.createOrganization({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      });

      setName('');
      setSlug('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create organization';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Organization">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Organization Name"
          placeholder="e.g. Stanford University, Oakridge Academy"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          autoFocus
        />

        <div>
          <Input
            label="Domain Slug / Identifier"
            placeholder="e.g. stanford"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Generated login emails will use: <span className="font-mono text-indigo-300">{"<id>"}@{slug || 'organization'}.io</span>
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Department notes, address, or administrative details..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Create Organization
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateOrgModal;
