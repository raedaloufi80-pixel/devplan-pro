'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectDetail, Task } from '@/types';
import TodaySession from '@/components/TodaySession';
import TaskList from '@/components/TaskList';
import TopicManager from '@/components/TopicManager';
import FloatingChat from '@/components/FloatingChat';

type Tab = 'schedule' | 'topics';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('schedule');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) { router.push('/'); return; }
      const data = await res.json();
      setProject(data);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const currentDay = project
    ? Math.min(project.duration_days, Math.max(1, Math.ceil((Date.now() - new Date(project.created_at).getTime()) / 86400000)))
    : 1;

  const daysLeft = project ? Math.max(0, project.duration_days - currentDay + 1) : 0;
  const completedCount = project?.tasks.filter(t => t.completed).length || 0;
  const totalTasks = project?.tasks.length || 0;
  const progressPct = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  async function handleGenerateSchedule() {
    if (!project?.topics.length) {
      setError('Please add at least one topic before generating a schedule.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${id}/generate-schedule`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate schedule');
      }
      await fetchProject();
      setTab('schedule');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleTask(taskId: string, completed: boolean) {
    await fetch(`/api/projects/${id}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed, completed_at: completed ? new Date().toISOString() : null }),
    });
    setProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t: Task) =>
          t.id === taskId ? { ...t, completed, completed_at: completed ? new Date().toISOString() : undefined } : t
        ),
      };
    });
  }

  function handlePrintReport() {
    if (!project) return;
    const completedTasks = project.tasks.filter(t => t.completed);
    const remainingTasks = project.tasks.filter(t => !t.completed);
    const createdDate = new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const priorityColor = (p: string) => p === 'high' ? '#dc2626' : p === 'medium' ? '#d97706' : '#16a34a';
    const priorityLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${project.title} — DevPlan Pro Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: white; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
  h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 28px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
  h3 { font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 14px; margin-bottom: 6px; }
  .meta { color: #94a3b8; font-size: 13px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
  .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-value { font-size: 28px; font-weight: 800; color: #4f46e5; }
  .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
  .progress-bar { background: #e2e8f0; border-radius: 99px; height: 12px; margin: 8px 0 4px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #4f46e5); border-radius: 99px; }
  .progress-label { font-size: 13px; color: #64748b; text-align: right; }
  .task-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
  .task-check { width: 16px; height: 16px; border-radius: 4px; border: 2px solid #cbd5e1; margin-top: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .task-check.done { background: #4f46e5; border-color: #4f46e5; color: white; font-size: 10px; }
  .task-title { font-size: 14px; font-weight: 500; color: #1e293b; }
  .task-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .priority-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 99px; margin-left: 8px; }
  .day-header { font-size: 13px; font-weight: 700; color: #4f46e5; background: #eef2ff; padding: 6px 12px; border-radius: 6px; margin: 16px 0 8px; }
  .description { font-size: 14px; color: #475569; line-height: 1.6; margin: 12px 0; background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
  <div style="width:40px;height:40px;background:#4f46e5;border-radius:10px;display:flex;align-items:center;justify-content:center;">
    <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  </div>
  <div>
    <div style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">DevPlan Pro</div>
    <div style="font-size:12px;color:#94a3b8;">Project Report — Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>
</div>

<h1>${project.title}</h1>
<p class="subtitle">Started: ${createdDate} &nbsp;•&nbsp; Duration: ${project.duration_days} days &nbsp;•&nbsp; Topics: ${project.topics.length}</p>

${project.description ? `<div class="description">${project.description}</div>` : ''}

<div class="stats-grid">
  <div class="stat-card"><div class="stat-value">${totalTasks}</div><div class="stat-label">Total Tasks</div></div>
  <div class="stat-card"><div class="stat-value" style="color:#16a34a">${completedCount}</div><div class="stat-label">Completed</div></div>
  <div class="stat-card"><div class="stat-value" style="color:#d97706">${remainingTasks.length}</div><div class="stat-label">Remaining</div></div>
  <div class="stat-card"><div class="stat-value" style="color:#0891b2">${daysLeft}</div><div class="stat-label">Days Left</div></div>
</div>

<h3>Overall Progress</h3>
<div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
<div class="progress-label">${progressPct}% complete — Day ${currentDay} of ${project.duration_days}</div>

${completedTasks.length > 0 ? `
<h2>✅ Completed Tasks (${completedTasks.length})</h2>
${completedTasks.map(t => `
<div class="task-item">
  <div class="task-check done">✓</div>
  <div>
    <div class="task-title">${t.title} <span class="priority-badge" style="background:${priorityColor(t.priority)}20;color:${priorityColor(t.priority)}">${priorityLabel(t.priority)}</span></div>
    <div class="task-meta">Day ${t.day} &nbsp;•&nbsp; ${t.topic} &nbsp;•&nbsp; ${t.duration_minutes} min${t.completed_at ? ` &nbsp;•&nbsp; Completed ${new Date(t.completed_at).toLocaleDateString()}` : ''}</div>
    ${t.notes ? `<div class="task-meta" style="color:#94a3b8;margin-top:2px;">${t.notes}</div>` : ''}
  </div>
</div>`).join('')}` : ''}

${remainingTasks.length > 0 ? `
<h2>📋 Remaining Tasks (${remainingTasks.length})</h2>
${Object.entries(
  remainingTasks.reduce((acc: Record<number, Task[]>, t) => {
    if (!acc[t.day]) acc[t.day] = [];
    acc[t.day].push(t);
    return acc;
  }, {})
).sort(([a], [b]) => Number(a) - Number(b)).map(([day, tasks]) => `
<div class="day-header">Day ${day}${Number(day) < currentDay ? ' — OVERDUE' : Number(day) === currentDay ? ' — TODAY' : ''}</div>
${(tasks as Task[]).map(t => `
<div class="task-item">
  <div class="task-check"></div>
  <div>
    <div class="task-title">${t.title} <span class="priority-badge" style="background:${priorityColor(t.priority)}20;color:${priorityColor(t.priority)}">${priorityLabel(t.priority)}</span></div>
    <div class="task-meta">Day ${t.day} &nbsp;•&nbsp; ${t.topic} &nbsp;•&nbsp; ${t.duration_minutes} min</div>
    ${t.notes ? `<div class="task-meta" style="color:#94a3b8;margin-top:2px;">${t.notes}</div>` : ''}
  </div>
</div>`).join('')}`).join('')}` : ''}

<div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">
  Generated by DevPlan Pro &nbsp;•&nbsp; ${new Date().toISOString()}
</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className="font-bold text-slate-900 hidden sm:inline">DevPlan Pro</span>
              </Link>
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h1 className="font-semibold text-slate-900 truncate">{project.title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrintReport}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">Print Report</span>
              </button>
              <button
                onClick={handleGenerateSchedule}
                disabled={generating}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {generating ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Generating...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg><span className="hidden sm:inline">Generate Schedule</span><span className="sm:hidden">Generate</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
          </div>
        )}

        {/* Project Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Current Day', value: `${currentDay} / ${project.duration_days}`, color: 'text-indigo-600' },
            { label: 'Days Left', value: daysLeft, color: daysLeft <= 3 ? 'text-red-600' : 'text-slate-700' },
            { label: 'Tasks Done', value: `${completedCount} / ${totalTasks}`, color: 'text-green-600' },
            { label: 'Progress', value: `${progressPct}%`, color: 'text-indigo-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span className="font-medium">Overall Progress</span>
            <span>{progressPct}% complete</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Today's Session */}
        <TodaySession
          tasks={project.tasks}
          currentDay={currentDay}
          onToggle={handleToggleTask}
        />

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 no-print">
          {(['schedule', 'topics'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'schedule' ? `Schedule (${totalTasks} tasks)` : `Topics (${project.topics.length})`}
            </button>
          ))}
        </div>

        {tab === 'schedule' && (
          <TaskList
            tasks={project.tasks}
            currentDay={currentDay}
            projectDuration={project.duration_days}
            onToggle={handleToggleTask}
          />
        )}
        {tab === 'topics' && (
          <TopicManager
            projectId={id}
            topics={project.topics}
            onUpdate={fetchProject}
          />
        )}
      </div>

      {/* Floating Chat */}
      <FloatingChat
        projectId={id}
        project={project}
        currentDay={currentDay}
      />
    </div>
  );
}
