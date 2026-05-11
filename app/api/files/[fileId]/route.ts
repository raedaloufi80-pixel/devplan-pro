import { NextResponse } from 'next/server';
import { dbGet, dbRun } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { fileId: string } }) {
  try {
    const file = await dbGet<{ content: string; mime_type: string; original_name: string }>(
      'SELECT content, mime_type, original_name FROM files WHERE id = ?',
      [params.fileId],
    );
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    const buffer = Buffer.from(file.content as string, 'base64');
    return new Response(buffer, {
      headers: {
        'Content-Type': (file.mime_type as string) || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.original_name}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { fileId: string } }) {
  try {
    const file = await dbGet('SELECT id FROM files WHERE id = ?', [params.fileId]);
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    await dbRun('DELETE FROM files WHERE id = ?', [params.fileId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
