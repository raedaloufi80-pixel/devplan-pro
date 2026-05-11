import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun, getClient } from '@/lib/db';
import { getAnthropicClient, MODEL } from '@/lib/anthropic';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const project = await dbGet<{
      id: string; title: string; description: string; duration_days: number;
    }>('SELECT * FROM projects WHERE id = ?', [params.id]);

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const topics = await dbAll<{ id: string; title: string; description: string }>(
      'SELECT * FROM topics WHERE project_id = ? ORDER BY order_index',
      [params.id],
    );

    if (topics.length === 0) return NextResponse.json({ error: 'No topics found. Please add topics first.' }, { status: 400 });

    const topicsList = topics.map(t => `- ${t.title}${t.description ? ': ' + t.description : ''}`).join('\n');

    const prompt = `You are a personal development coach creating a detailed learning schedule.

Project: "${project.title}"
Description: ${project.description || 'No description'}
Duration: ${project.duration_days} days
Topics to cover:
${topicsList}

Create a comprehensive day-by-day schedule that covers all the topics. Distribute tasks logically across ${project.duration_days} days, with earlier days covering fundamentals and later days covering advanced topics and practice.

Return ONLY a valid JSON array with no markdown formatting, no code blocks, no explanation. Each task object must have exactly these fields:
- title: string (specific, actionable task title)
- topic: string (which topic this belongs to)
- day: number (1 to ${project.duration_days})
- duration: number (estimated minutes, typically 30-120)
- priority: "high" | "medium" | "low"
- notes: string (helpful context or tips for this task)

Aim for 2-5 tasks per day. Make tasks specific and actionable. Return at least ${Math.min(topics.length * 3, project.duration_days * 2)} tasks.`;

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

    let jsonText = content.text.trim();
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let taskData: Array<{
      title: string; topic: string; day: number; duration: number; priority: string; notes: string;
    }>;
    try {
      taskData = JSON.parse(jsonText);
    } catch {
      const match = jsonText.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Could not parse schedule from AI response');
      taskData = JSON.parse(match[0]);
    }

    if (!Array.isArray(taskData)) throw new Error('AI did not return an array');

    // Delete existing tasks then insert new ones in a batch
    await dbRun('DELETE FROM tasks WHERE project_id = ?', [params.id]);

    const now = new Date().toISOString();
    const validPriorities = new Set(['high', 'medium', 'low']);

    const db = getClient();
    const statements = taskData.map(task => ({
      sql: `INSERT INTO tasks (id, project_id, title, topic, day, duration_minutes, priority, notes, completed, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      args: [
        uuidv4(),
        params.id,
        task.title || 'Unnamed task',
        task.topic || '',
        Math.max(1, Math.min(project.duration_days, Math.round(task.day) || 1)),
        Math.max(15, Math.min(480, task.duration || 60)),
        validPriorities.has(task.priority) ? task.priority : 'medium',
        task.notes || '',
        now,
      ],
    }));

    await db.batch(statements, 'write');

    const tasks = await dbAll('SELECT * FROM tasks WHERE project_id = ? ORDER BY day, priority DESC', [params.id]);
    const formatted = tasks.map(t => ({ ...t, completed: t.completed === 1 }));

    return NextResponse.json({ tasks: formatted, count: formatted.length });
  } catch (e) {
    console.error('Generate schedule error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to generate schedule' }, { status: 500 });
  }
}
