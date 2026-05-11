import { NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [params.id]);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const topics = await dbAll('SELECT * FROM topics WHERE project_id = ? ORDER BY order_index, created_at', [params.id]);
    const tasks = await dbAll('SELECT * FROM tasks WHERE project_id = ? ORDER BY day, priority DESC, created_at', [params.id]);
    const files = await dbAll('SELECT * FROM files WHERE project_id = ?', [params.id]);

    const topicsWithFiles = topics.map(topic => ({
      ...topic,
      files: files.filter(f => f.topic_id === topic.id).map(f => ({ ...f, content: undefined })),
    }));

    const tasksFormatted = tasks.map(t => ({ ...t, completed: t.completed === 1 }));

    return NextResponse.json({ ...project, topics: topicsWithFiles, tasks: tasksFormatted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { title, description, duration_days } = body;
    await dbRun(
      `UPDATE projects SET title = COALESCE(?, title), description = COALESCE(?, description),
       duration_days = COALESCE(?, duration_days), updated_at = ? WHERE id = ?`,
      [title, description, duration_days, new Date().toISOString(), params.id],
    );
    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [params.id]);
    return NextResponse.json(project);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbRun('DELETE FROM projects WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
