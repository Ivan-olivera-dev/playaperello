import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getCurrentPeriodLimits() {
  // Configurar hora de Madrid para que los cortes de hora sean precisos
  const nowStr = new Date().toLocaleString("en-US", {timeZone: "Europe/Madrid"});
  const now = new Date(nowStr);
  const hour = now.getHours();
  
  const createDate = (h) => {
    const d = new Date(now);
    d.setHours(h, 0, 0, 0);
    return d;
  };

  if (hour >= 7 && hour < 15) {
    return { start: createDate(7), end: createDate(15) };
  } else if (hour >= 16 && hour < 21) {
    return { start: createDate(16), end: createDate(21) };
  }
  return null;
}

export async function GET(request) {
  try {
    const db = await initDb();
    const period = getCurrentPeriodLimits();
    
    if (!period) {
      return NextResponse.json({ votes: [] });
    }

    const startUTC = period.start.toISOString();
    const endUTC = period.end.toISOString();
    
    const votes = await db.all(
      'SELECT color, COUNT(*) as count FROM votes WHERE timestamp >= ? AND timestamp < ? GROUP BY color',
      [startUTC, endUTC]
    );
    
    return NextResponse.json({ votes });
  } catch (error) {
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

    const period = getCurrentPeriodLimits();
    if (!period) {
      return NextResponse.json({ error: 'Fuera de horario' }, { status: 403 });
    }

    const db = await initDb();
    const today = new Date().toISOString().split('T')[0];
    
    await db.run('INSERT INTO votes (color, date) VALUES (?, ?)', [color, today]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
