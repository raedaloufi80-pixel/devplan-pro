import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const topics = await dbAll('SELECT * FROM topics WHERE project_id = ? ORDER BY order_index, created_at', [params.id]);
    return NextResponse.json(topics);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { title, description = '' } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const id = uuidv4();
    const now = new Date().toISOString();
    const maxRow = await dbGet<{ max: number | null }>('SELECT MAX(order_index) as max FROM topics WHERE project_id = ?', [params.id]);
    const maxOrder = maxRow?.max ?? -1;

    await dbRun(
      `INSERT INTO topics (id, project_id, title, description, order_index, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, params.id, title.trim(), description.trim(), maxOrder + 1, now],
    );

    const topic = await dbGet('SELECT * FROM topics WHERE id = ?', [id]);
    return NextResponse.json(topic, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
