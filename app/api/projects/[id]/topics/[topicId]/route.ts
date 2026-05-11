import { NextResponse } from 'next/server';
import { dbRun } from '@/lib/db';

export async function DELETE(_: Request, { params }: { params: { id: string; topicId: string } }) {
  try {
    // Files in DB are deleted automatically via CASCADE
    await dbRun('DELETE FROM topics WHERE id = ? AND project_id = ?', [params.topicId, params.id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}
