'use client';

import { useState, useRef } from 'react';
import { Topic, ProjectFile } from '@/types';

interface Props {
  projectId: string;
  topics: Topic[];
  onUpdate: () => void;
}

export default function TopicManager({ projectId, topics, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ title: '', description: '' });
      setShowForm(false);
      onUpdate();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTopic(topicId: string) {
    if (!confirm('Delete this topic and all its files?')) return;
    await fetch(`/api/projects/${projectId}/topics/${topicId}`, { method: 'DELETE' });
    onUpdate();
  }

  async function handleFileUpload(topicId: string, files: FileList | null) {
    if (!files?.length) return;
    const fd = new FormData();
    fd.append('file', files[0]);
    fd.append('projectId', projectId);
    fd.append('topicId', topicId);
    await fetch('/api/upload', { method: 'POST', body: fd });
    onUpdate();
  }

  async function handleDeleteFile(fileId: string) {
    await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    onUpdate();
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return '🖼️';
    if (['mp4', 'mov', 'avi'].includes(ext || '')) return '🎬';
    if (['mp3', 'wav'].includes(ext || '')) return '🎵';
    if (['zip', 'rar', 'tar'].includes(ext || '')) return '📦';
    if (['js', 'ts', 'py', 'java', 'cpp', 'c'].includes(ext || '')) return '💻';
    return '📎';
  }

  return (
    <div className="space-y-4">
      {topics.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No topics yet</h3>
          <p className="text-slate-400 text-sm mb-6">Add the subjects you want to learn. Each topic can have attached files and notes.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Topic
          </button>
        </div>
      ) : (
        <>
          {topics.map((topic, i) => (
            <div key={topic.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-start justify-between p-5">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{topic.title}</h3>
                    {topic.description && <p className="text-sm text-slate-500 mt-1">{topic.description}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTopic(topic.id)}
                  className="ml-3 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete topic"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Files */}
              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Attachments ({topic.files?.length || 0})
                  </span>
                  <button
                    onClick={() => fileInputRefs.current[topic.id]?.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add File
                  </button>
                  <input
                    ref={el => { if (el) fileInputRefs.current[topic.id] = el; }}
                    type="file"
                    className="hidden"
                    onChange={e => handleFileUpload(topic.id, e.target.files)}
                  />
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(topic.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(null);
                    handleFileUpload(topic.id, e.dataTransfer.files);
                  }}
                  className={`rounded-xl border-2 border-dashed p-3 transition-colors min-h-[60px] ${
                    dragOver === topic.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  {topic.files && topic.files.length > 0 ? (
                    <div className="space-y-2">
                      {topic.files.map((file: ProjectFile) => (
                        <div key={file.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200">
                          <span className="text-lg">{getFileIcon(file.original_name)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{file.original_name}</p>
                            <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors ml-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-slate-400 text-center mt-2">Drop files here to add more</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center text-slate-400 py-2">
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs">Drop files here or click &quot;Add File&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add topic form */}
          {showForm ? (
            <div className="bg-white rounded-2xl border border-indigo-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">New Topic</h3>
              <form onSubmit={handleAddTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. React Hooks & State Management"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What will you learn in this topic?"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? 'Adding...' : 'Add Topic'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setForm({ title: '', description: '' }); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Topic
            </button>
          )}
        </>
      )}
    </div>
  );
}
