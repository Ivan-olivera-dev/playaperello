import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getVotingPeriod } from '@/lib/beach-logic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  let db;
  try {
    const { periodKey } = getVotingPeriod();

    if (!periodKey) {
      return NextResponse.json({ votes: [] }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    db = await initDb();
    const votes = await db.all(
      'SELECT color, COUNT(*) as count FROM votes WHERE date = ? GROUP BY color',
      [periodKey]
    );

    return NextResponse.json({ votes }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (db) {
      await db.close().catch(() => {});
    }
  }
}

export async function POST(request) {
  let db;
  try {
    const body = await request.json();
    const { color } = body;

    if (!['green', 'yellow', 'red'].includes(color)) {
      return NextResponse.json({ error: 'Color inválido' }, { status: 400 });
    }

    const { isSummer, periodKey } = getVotingPeriod();
    if (!isSummer) {
      return NextResponse.json({ error: 'Fuera de temporada de verano' }, { status: 403 });
    }
    if (!periodKey) {
      return NextResponse.json({ error: 'Fuera de horario' }, { status: 403 });
    }

    db = await initDb();
    await db.run('INSERT INTO votes (color, date) VALUES (?, ?)', [color, periodKey]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (db) {
      await db.close().catch(() => {});
    }
  }
}
