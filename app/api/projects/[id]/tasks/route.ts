import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const tasks = await dbAll('SELECT * FROM tasks WHERE project_id = ? ORDER BY day, priority DESC', [params.id]);
    const formatted = tasks.map(t => ({ ...t, completed: t.completed === 1 }));
    return NextResponse.json(formatted);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { title, topic = '', day, duration_minutes = 60, priority = 'medium', notes = '' } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!day) return NextResponse.json({ error: 'Day is required' }, { status: 400 });

    const id = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO tasks (id, project_id, title, topic, day, duration_minutes, priority, notes, completed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, params.id, title.trim(), topic, day, duration_minutes, priority, notes, now],
    );

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
    return NextResponse.json({ ...task, completed: false }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
