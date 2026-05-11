'use client';

import { useState, useRef, useEffect } from 'react';
import { ProjectDetail } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  projectId: string;
  project: ProjectDetail;
  currentDay: number;
}

const SUGGESTED_PROMPTS = [
  "What should I focus on today?",
  "Explain my most important task",
  "How am I doing with my progress?",
  "What are the best resources for my topics?",
];

export default function FloatingChat({ project, currentDay }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your DevPlan Pro assistant 👋\n\nI'm here to help you with **${project.title}**. You're on Day ${currentDay} of ${project.duration_days}. How can I help you today?`,
      }]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, project.title, project.duration_days, currentDay, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const completedCount = project.tasks.filter(t => t.completed).length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);
  const daysLeft = Math.max(0, project.duration_days - currentDay + 1);
  const todayTasks = project.tasks.filter(t => t.day === currentDay);

  const projectContext = {
    title: project.title,
    description: project.description,
    duration_days: project.duration_days,
    currentDay,
    daysLeft,
    progress,
    completedTasks: completedCount,
    totalTasks,
    topics: project.topics.map(t => ({ title: t.title, description: t.description })),
    todayTasks: todayTasks.map(t => ({ title: t.title, completed: t.completed, duration_minutes: t.duration_minutes })),
  };

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    // Add empty assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8),
          projectContext,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader');

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
      }
    } catch (e) {
      console.error('Chat error:', e);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your API key and try again.',
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function renderContent(text: string) {
    // Simple markdown: bold, code
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 no-print">
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
            title="Open AI Assistant"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col" style={{ height: '520px' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">AI Assistant</p>
                  <p className="text-indigo-200 text-xs">Day {currentDay} · {progress}% done</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content ? (
                      <div className="whitespace-pre-wrap">{renderContent(msg.content)}</div>
                    ) : (
                      <div className="flex gap-1 py-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your plan..."
                  disabled={streaming}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  {streaming ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
