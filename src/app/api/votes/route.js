import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await initDb();
    const today = new Date().toISOString().split('T')[0];
    
    // Obtenemos los votos agrupados por color para el día de hoy
    const votes = await db.all('SELECT color, COUNT(*) as count FROM votes WHERE date = ? GROUP BY color', [today]);
    
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

    const db = await initDb();
    const today = new Date().toISOString().split('T')[0];
    
    // Registramos el voto
    await db.run('INSERT INTO votes (color, date) VALUES (?, ?)', [color, today]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
