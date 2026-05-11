import { NextResponse } from 'next/server';
import { getAnthropicClient, MODEL } from '@/lib/anthropic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], projectContext } = body;

    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const systemPrompt = `You are DevPlan Pro's AI assistant — a knowledgeable, encouraging personal development coach.

${projectContext ? `## Current Project Context
Project: ${projectContext.title}
Description: ${projectContext.description || 'No description provided'}
Duration: ${projectContext.duration_days} days
Current Day: ${projectContext.currentDay} of ${projectContext.duration_days}
Days Remaining: ${projectContext.daysLeft}
Progress: ${projectContext.progress}% complete (${projectContext.completedTasks}/${projectContext.totalTasks} tasks done)

Topics:
${projectContext.topics?.map((t: { title: string; description: string }) => `- ${t.title}${t.description ? ': ' + t.description : ''}`).join('\n') || 'No topics added yet'}

Today's Tasks:
${projectContext.todayTasks?.length > 0 ? projectContext.todayTasks.map((t: { title: string; completed: boolean; duration_minutes: number }) => `- [${t.completed ? '✓' : ' '}] ${t.title} (${t.duration_minutes} min)`).join('\n') : 'No tasks scheduled for today'}
` : ''}

## Your Role
- Help the user understand their tasks and learning objectives
- Suggest practical next steps and study strategies
- Explain technical concepts related to their topics
- Motivate and encourage consistent progress
- Answer questions about scheduling and prioritization
- Keep responses concise and actionable
- Use markdown formatting for clarity when helpful`;

    const anthropic = getAnthropicClient();

    const messages = [
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (e) {
          console.error('Stream error:', e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e) {
    console.error('Chat error:', e);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
