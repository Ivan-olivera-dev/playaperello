import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getCurrentPeriod() {
  const nowStr = new Date().toLocaleString("en-US", {timeZone: "Europe/Madrid"});
  const now = new Date(nowStr);
  const hour = now.getHours();

  if (hour >= 7 && hour < 15) return 'morning';
  if (hour >= 16 && hour < 21) return 'afternoon';
  return null;
}

function getTodayString() {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' });
  return formatter.format(new Date()); 
}

export async function GET(request) {
  try {
    const db = await initDb();
    const period = getCurrentPeriod();
    
    if (!period) {
      return NextResponse.json({ votes: [] }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    // Simplificamos al máximo: guardamos "FECHA_PERIODO" como un texto plano para evitar bugs de zonas horarias.
    const periodDateKey = `${getTodayString()}_${period}`;
    
    const votes = await db.all(
      'SELECT color, COUNT(*) as count FROM votes WHERE date = ? GROUP BY color',
      [periodDateKey]
    );
    
    return NextResponse.json({ votes }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { color } = body;
    
    if (!['green', 'yellow', 'red'].includes(color)) {
      return NextResponse.json({ error: 'Color inválido' }, { status: 400 });
    }

    const period = getCurrentPeriod();
    if (!period) {
      return NextResponse.json({ error: 'Fuera de horario' }, { status: 403 });
    }

    const db = await initDb();
    const periodDateKey = `${getTodayString()}_${period}`;
    
    // Guardamos el texto plano "2026-06-13_afternoon" en la columna date.
    await db.run('INSERT INTO votes (color, date) VALUES (?, ?)', [color, periodDateKey]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
