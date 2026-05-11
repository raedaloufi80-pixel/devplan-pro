'use client';

import { Task } from '@/types';

interface Props {
  tasks: Task[];
  currentDay: number;
  onToggle: (taskId: string, completed: boolean) => void;
}

const priorityConfig = {
  high: { label: 'High', classes: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', classes: 'bg-amber-100 text-amber-700' },
  low: { label: 'Low', classes: 'bg-green-100 text-green-700' },
};

export default function TodaySession({ tasks, currentDay, onToggle }: Props) {
  const todayTasks = tasks.filter(t => t.day === currentDay);
  const overdueTasks = tasks.filter(t => t.day < currentDay && !t.completed);

  if (todayTasks.length === 0 && overdueTasks.length === 0) {
    return (
      <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-indigo-900">Today&apos;s Session — Day {currentDay}</h2>
        </div>
        <p className="text-indigo-600 text-sm">
          {tasks.length === 0
            ? 'No schedule generated yet. Add topics and click "Generate Schedule" to get started!'
            : 'No tasks scheduled for today. Great work staying on track!'}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {overdueTasks.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-red-800">Overdue Tasks ({overdueTasks.length})</h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={onToggle} overdue />
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-indigo-900">Today&apos;s Session — Day {currentDay}</h2>
            <p className="text-indigo-500 text-sm">
              {todayTasks.filter(t => t.completed).length}/{todayTasks.length} tasks completed
              {' · '}
              {todayTasks.reduce((acc, t) => acc + t.duration_minutes, 0)} min total
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {todayTasks.length === 0 ? (
            <p className="text-indigo-400 text-sm italic">No tasks for today.</p>
          ) : (
            todayTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={onToggle} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, overdue = false }: { task: Task; onToggle: (id: string, c: boolean) => void; overdue?: boolean }) {
  const pc = priorityConfig[task.priority] || priorityConfig.medium;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${task.completed ? 'bg-white/50 opacity-60' : 'bg-white/80 hover:bg-white'}`}>
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </span>
          {overdue && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">OVERDUE</span>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${pc.classes}`}>{pc.label}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
          {task.topic && <span>{task.topic}</span>}
          <span>{task.duration_minutes} min</span>
          {overdue && <span className="text-red-400">Day {task.day}</span>}
        </div>
        {task.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.notes}</p>}
      </div>
    </div>
  );
}
