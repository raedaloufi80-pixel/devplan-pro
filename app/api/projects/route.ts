import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun } from '@/lib/db';

export async function GET() {
  try {
    const projects = await dbAll(`
      SELECT p.*,
        COUNT(DISTINCT to2.id) as topic_count,
        COUNT(DISTINCT t.id) as task_count,
        SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed_count
      FROM projects p
      LEFT JOIN topics to2 ON to2.project_id = p.id
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    return NextResponse.json(projects);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description = '', duration_days } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!duration_days || duration_days < 1) return NextResponse.json({ error: 'Duration must be at least 1' }, { status: 400 });

    const id = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO projects (id, title, description, duration_days, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title.trim(), description.trim(), duration_days, now, now],
    );

    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [id]);
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
