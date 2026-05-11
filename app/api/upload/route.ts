import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbRun } from '@/lib/db';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string;
    const topicId = formData.get('topicId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!projectId || !topicId) return NextResponse.json({ error: 'projectId and topicId required' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 });

    const topic = await dbGet('SELECT * FROM topics WHERE id = ? AND project_id = ?', [topicId, projectId]);
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    // Store file content as base64 in the database (works on serverless/Vercel)
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'application/octet-stream';

    const id = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO files (id, topic_id, project_id, original_name, mime_type, size, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, topicId, projectId, file.name, mimeType, file.size, base64, now],
    );

    // Return record without content (to keep response small)
    const fileRecord = await dbGet('SELECT id, topic_id, project_id, original_name, mime_type, size, created_at FROM files WHERE id = ?', [id]);
    return NextResponse.json(fileRecord, { status: 201 });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
