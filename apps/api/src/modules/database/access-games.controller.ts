import { Request, Response } from 'express';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wdfghjifghjoixcvhjk'
);

async function getUser(req: Request) {
  const token = req.cookies['auth-token'];
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as { id: string; role: string; username: string };
  } catch {
    return null;
  }
}

export interface AccessGame {
  id: string;
  white: string;
  black: string;
  whiteElo?: number;
  blackElo?: number;
  result: string;
  date: string;
  timeControl?: string;
  opening?: string;
  pgn: string;
  platform: 'lichess' | 'chesscom';
  url?: string;
}

// ── Lichess ───────────────────────────────────────────────────────────────
async function fetchLichessGames(username: string, max: number): Promise<AccessGame[]> {
  const token = process.env.LICHESS_API_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/x-ndjson',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${max}&pgnInJson=true&opening=true&clocks=false&evals=false`;

  const res = await fetch(url, { headers });

  if (res.status === 404) throw new Error(`Lichess user "${username}" not found.`);
  if (!res.ok) throw new Error(`Lichess API error: ${res.status} ${res.statusText}`);

  const text = await res.text();
  const lines = text.trim().split('\n').filter(Boolean);

  return lines.map((line) => {
    const g = JSON.parse(line);
    const white = g.players?.white?.user?.name || g.players?.white?.name || 'White';
    const black = g.players?.black?.user?.name || g.players?.black?.name || 'Black';
    const whiteElo = g.players?.white?.rating;
    const blackElo = g.players?.black?.rating;
    const result = g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '½-½';
    const date = g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : '';
    const tc = g.clock ? `${g.clock.initial / 60}+${g.clock.increment}` : g.speed || '';
    const opening = g.opening?.name || '';
    const pgn = g.pgn || '';

    return {
      id: g.id,
      white,
      black,
      whiteElo,
      blackElo,
      result,
      date,
      timeControl: tc,
      opening,
      pgn,
      platform: 'lichess' as const,
      url: `https://lichess.org/${g.id}`,
    };
  });
}

// ── Chess.com ─────────────────────────────────────────────────────────────
async function fetchChesscomGames(username: string, max: number): Promise<AccessGame[]> {
  const userAgent = 'VCA-Platform/1.0 (contact: admin@vcaplatform.com)';
  const headers = {
    'User-Agent': userAgent,
    Accept: 'application/json',
  };

  // Step 1: Get archives list
  const archivesRes = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`,
    { headers }
  );
  if (archivesRes.status === 404) throw new Error(`Chess.com user "${username}" not found.`);
  if (!archivesRes.ok) throw new Error(`Chess.com API error: ${archivesRes.status}`);

  const archivesData = await archivesRes.json();
  const archives: string[] = archivesData.archives || [];
  if (archives.length === 0) throw new Error(`No games found for Chess.com user "${username}".`);

  // Step 2: Fetch most recent archive(s) until we have enough games
  const games: AccessGame[] = [];

  for (let i = archives.length - 1; i >= 0 && games.length < max; i--) {
    const archiveUrl = archives[i];
    const gamesRes = await fetch(archiveUrl, { headers });
    if (!gamesRes.ok) continue;

    const gamesData = await gamesRes.json();
    const rawGames: any[] = gamesData.games || [];

    for (const g of rawGames.reverse()) {
      if (games.length >= max) break;
      const white = g.white?.username || 'White';
      const black = g.black?.username || 'Black';
      const whiteElo = g.white?.rating;
      const blackElo = g.black?.rating;
      const rawResult = g.white?.result;
      let result = '½-½';
      if (rawResult === 'win') result = '1-0';
      else if (g.black?.result === 'win') result = '0-1';

      const date = g.end_time
        ? new Date(g.end_time * 1000).toISOString().split('T')[0]
        : '';
      const tc = g.time_control || '';
      const opening = g.eco || '';
      const pgn = g.pgn || '';

      games.push({
        id: g.uuid || `${white}-${black}-${date}`,
        white,
        black,
        whiteElo,
        blackElo,
        result,
        date,
        timeControl: tc,
        opening,
        pgn,
        platform: 'chesscom' as const,
        url: g.url,
      });
    }
  }

  return games;
}

// ── Controller ────────────────────────────────────────────────────────────
export class AccessGamesController {
  async fetchGames(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      // Only coaches and admins
      const role = user.role?.toUpperCase();
      if (role !== 'COACH' && role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Coaches only.' });
      }

      const { platform, username } = req.query;
      const max = Math.min(parseInt(req.query.max as string) || 20, 50);

      if (!platform || !username) {
        return res.status(400).json({ error: 'platform and username are required.' });
      }
      if (!['lichess', 'chesscom'].includes(platform as string)) {
        return res.status(400).json({ error: 'platform must be "lichess" or "chesscom".' });
      }

      const uname = (username as string).trim();
      if (!uname) return res.status(400).json({ error: 'username cannot be empty.' });

      let games: AccessGame[];
      if (platform === 'lichess') {
        games = await fetchLichessGames(uname, max);
      } else {
        games = await fetchChesscomGames(uname, max);
      }

      res.json({ games, count: games.length });
    } catch (e: any) {
      console.error('[AccessGames] Error:', e.message);
      res.status(400).json({ error: e.message || 'Failed to fetch games.' });
    }
  }
}
