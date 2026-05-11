'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProject() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', duration_days: 30 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (form.duration_days < 1) { setError('Duration must be at least 1 day'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch {
      setError('Failed to create project. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">DevPlan Pro</span>
            </Link>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-500 text-sm">New Project</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Create New Project</h1>
          <p className="text-slate-500 mt-2">Define your learning goals and let AI generate a smart schedule.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Full-Stack React Developer in 30 Days"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What are the goals of this project? What will you learn?"
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Duration (days) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={form.duration_days}
                  onChange={e => setForm(f => ({ ...f, duration_days: parseInt(e.target.value) || 1 }))}
                  min={1}
                  max={365}
                  className="w-32 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                  required
                />
                <div className="flex gap-2">
                  {[7, 14, 30, 60, 90].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, duration_days: d }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${form.duration_days === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Project
                  </>
                )}
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
