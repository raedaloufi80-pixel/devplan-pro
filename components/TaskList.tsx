'use client';

import { Task } from '@/types';

interface Props {
  tasks: Task[];
  currentDay: number;
  projectDuration: number;
  onToggle: (taskId: string, completed: boolean) => void;
}

const priorityConfig = {
  high: { label: '🔴 High', classes: 'bg-red-100 text-red-700', sort: 0 },
  medium: { label: '🟡 Medium', classes: 'bg-amber-100 text-amber-700', sort: 1 },
  low: { label: '🟢 Low', classes: 'bg-green-100 text-green-700', sort: 2 },
};

export default function TaskList({ tasks, currentDay, projectDuration, onToggle }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">No schedule yet</h3>
        <p className="text-slate-400 text-sm">Add topics and click &quot;Generate Schedule&quot; to get an AI-powered plan.</p>
      </div>
    );
  }

  // Group by day
  const byDay: Record<number, Task[]> = {};
  for (const task of tasks) {
    if (!byDay[task.day]) byDay[task.day] = [];
    byDay[task.day].push(task);
  }

  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {days.map(day => {
        const dayTasks = byDay[day];
        const isToday = day === currentDay;
        const isPast = day < currentDay;
        const completedCount = dayTasks.filter(t => t.completed).length;
        const totalMinutes = dayTasks.reduce((acc, t) => acc + t.duration_minutes, 0);

        const dateForDay = new Date();
        dateForDay.setDate(dateForDay.getDate() - (currentDay - day));
        const dateStr = dateForDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        return (
          <div
            key={day}
            id={`day-${day}`}
            className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${
              isToday ? 'border-indigo-300 shadow-md shadow-indigo-100' : 'border-slate-200'
            }`}
          >
            {/* Day Header */}
            <div className={`px-5 py-3 flex items-center justify-between ${
              isToday ? 'bg-indigo-600' : isPast ? 'bg-slate-100' : 'bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isToday ? 'bg-white/20 text-white' : isPast ? 'bg-slate-200 text-slate-500' : 'bg-slate-200 text-slate-600'
                }`}>
                  {day}
                </div>
                <div>
                  <div className={`font-bold text-sm ${isToday ? 'text-white' : 'text-slate-800'}`}>
                    Day {day}
                    {isToday && <span className="ml-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">TODAY</span>}
                    {isPast && !isToday && <span className="ml-2 text-xs text-slate-400">(past)</span>}
                  </div>
                  <div className={`text-xs ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>{dateStr}</div>
                </div>
              </div>
              <div className={`text-xs ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>
                {completedCount}/{dayTasks.length} done · {totalMinutes} min
              </div>
            </div>

            {/* Tasks */}
            <div className="divide-y divide-slate-50">
              {dayTasks
                .sort((a, b) => (priorityConfig[a.priority]?.sort ?? 1) - (priorityConfig[b.priority]?.sort ?? 1))
                .map(task => {
                  const pc = priorityConfig[task.priority] || priorityConfig.medium;
                  const isOverdue = isPast && !task.completed;
                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors ${task.completed ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => onToggle(task.id, !task.completed)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          task.completed ? 'bg-indigo-600 border-indigo-600' : isOverdue ? 'border-red-400 hover:border-red-600' : 'border-slate-300 hover:border-indigo-400'
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
                          {isOverdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">OVERDUE</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.topic && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              {task.topic}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${pc.classes}`}>
                            {pc.label}
                          </span>
                          <span className="text-xs text-slate-400">{task.duration_minutes} min</span>
                          {task.completed_at && (
                            <span className="text-xs text-green-500">
                              ✓ {new Date(task.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {task.notes && (
                          <p className="text-xs text-slate-400 mt-1.5 italic">{task.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
