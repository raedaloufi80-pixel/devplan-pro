'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function getDaysLeft(project: Project) {
    const created = new Date(project.created_at);
    const now = new Date();
    const daysPassed = Math.ceil((now.getTime() - created.getTime()) / 86400000);
    return Math.max(0, project.duration_days - daysPassed + 1);
  }

  function getCurrentDay(project: Project) {
    const created = new Date(project.created_at);
    const now = new Date();
    return Math.min(project.duration_days, Math.max(1, Math.ceil((now.getTime() - created.getTime()) / 86400000)));
  }

  const progress = (p: Project) => {
    const total = p.task_count || 0;
    const done = p.completed_count || 0;
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">DevPlan Pro</span>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No projects yet</h2>
            <p className="text-slate-500 mb-8 max-w-sm">Create your first development plan and let AI build a smart schedule for you.</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create your first project
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Your Projects</h1>
              <p className="text-slate-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} in progress</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => {
                const pct = progress(project);
                const daysLeft = getDaysLeft(project);
                const currentDay = getCurrentDay(project);
                return (
                  <div key={project.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{project.title}</h3>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{project.description || 'No description'}</p>
                      </div>
                      {daysLeft === 0 ? (
                        <span className="ml-3 shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Done</span>
                      ) : (
                        <span className="ml-3 shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Day {currentDay}/{project.duration_days}</span>
                      )}
                    </div>

                    <div className="mt-4 mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>Progress</span>
                        <span>{project.completed_count || 0} / {project.task_count || 0} tasks</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-right text-xs text-indigo-600 font-medium mt-1">{pct}%</div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-5">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {project.duration_days} days
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {project.topic_count || 0} topics
                      </span>
                      {daysLeft > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {daysLeft} days left
                        </span>
                      )}
                    </div>

                    <div className="mt-auto">
                      <Link
                        href={`/projects/${project.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
                      >
                        Open Project
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
