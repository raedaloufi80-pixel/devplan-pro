import { NextResponse } from 'next/server';
import { dbGet, dbRun } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    const body = await req.json();
    const { completed, completed_at, title, notes, priority, day, duration_minutes } = body;

    if (completed !== undefined) {
      await dbRun(
        `UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ? AND project_id = ?`,
        [completed ? 1 : 0, completed_at ?? null, params.taskId, params.id],
      );
    } else {
      await dbRun(
        `UPDATE tasks SET
          title = COALESCE(?, title),
          notes = COALESCE(?, notes),
          priority = COALESCE(?, priority),
          day = COALESCE(?, day),
          duration_minutes = COALESCE(?, duration_minutes)
        WHERE id = ? AND project_id = ?`,
        [title, notes, priority, day, duration_minutes, params.taskId, params.id],
      );
    }

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [params.taskId]);
    return NextResponse.json({ ...task, completed: task?.completed === 1 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    await dbRun('DELETE FROM tasks WHERE id = ? AND project_id = ?', [params.taskId, params.id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
