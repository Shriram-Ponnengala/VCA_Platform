export interface ExplorerGame {
  id?: string;
  white: { name: string; rating?: number };
  black: { name: string; rating?: number };
  year?: number;
  result: string;
}

export interface ExplorerMove {
  san: string;
  games: number;
  popularity: number; // percentage (0 - 100)
  whiteWinPct: number;
  drawPct: number;
  blackWinPct: number;
}

export interface ExplorerData {
  openingName: string;
  totalGames: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
  whiteWinPct: number;
  drawPct: number;
  blackWinPct: number;
  moves: ExplorerMove[];
  games: ExplorerGame[];
}

export type LichessSpeed = 'ultraBullet' | 'bullet' | 'blitz' | 'rapid' | 'classical';
export type LichessRating = 400 | 1000 | 1200 | 1400 | 1600 | 1800 | 2000 | 2200 | 2500;

export interface LichessFilters {
  speeds: LichessSpeed[];
  ratings: LichessRating[];
}

export interface IOpeningExplorerProvider {
  name: string;
  fetchData: (fen: string) => Promise<ExplorerData>;
}

export function getLichessApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('vca_lichess_api_key');
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  }
  const envKey = process.env.NEXT_PUBLIC_LICHESS_API_KEY;
  if (envKey && envKey !== 'undefined' && envKey.trim()) {
    return envKey.trim();
  }
  return null;
}

export function setLichessApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('vca_lichess_api_key', key.trim());
    } else {
      localStorage.removeItem('vca_lichess_api_key');
    }
  }
}

function getLichessHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  const apiKey = getLichessApiKey();
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

function handleFetchError(response: Response, providerName: string): never {
  const statusDetails = response.statusText ? ` (${response.statusText})` : '';
  if (response.status === 401) {
    throw new Error(
      `Failed to fetch ${providerName} games (401 Unauthorized). Lichess requires a valid Personal Access Token.`
    );
  }
  if (response.status === 429) {
    throw new Error(
      `Failed to fetch ${providerName} games (429 Rate Limit Exceeded). Please wait a moment and try again.`
    );
  }
  throw new Error(`Failed to fetch ${providerName} games: HTTP ${response.status}${statusDetails}`);
}

export class MastersExplorerProvider implements IOpeningExplorerProvider {
  name = 'masters';

  async fetchData(fen: string): Promise<ExplorerData> {
    const cleanFen = fen.split('|')[0];
    const response = await fetch(
      `https://explorer.lichess.org/masters?fen=${encodeURIComponent(cleanFen)}&topGames=15`,
      { headers: getLichessHeaders() }
    );
    if (!response.ok) {
      handleFetchError(response, 'master');
    }
    const data = await response.json();
    return this.mapResponse(data);
  }

  private mapResponse(data: any): ExplorerData {
    const totalGames = (data.white || 0) + (data.draws || 0) + (data.black || 0);

    const moves: ExplorerMove[] = (data.moves || []).map((m: any) => {
      const moveGames = (m.white || 0) + (m.draws || 0) + (m.black || 0);
      return {
        san: m.san,
        games: moveGames,
        popularity: totalGames > 0 ? Math.round((moveGames / totalGames) * 100) : 0,
        whiteWinPct: moveGames > 0 ? Math.round((m.white / moveGames) * 100) : 0,
        drawPct: moveGames > 0 ? Math.round((m.draws / moveGames) * 100) : 0,
        blackWinPct: moveGames > 0 ? Math.round((m.black / moveGames) * 100) : 0,
      };
    });

    // Sort moves by popularity descending
    moves.sort((a, b) => b.games - a.games);

    const games: ExplorerGame[] = (data.topGames || []).map((g: any) => ({
      id: g.id,
      white: { name: g.white?.name || 'Unknown', rating: g.white?.rating },
      black: { name: g.black?.name || 'Unknown', rating: g.black?.rating },
      year: g.year,
      result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '½-½',
    }));

    return {
      openingName: data.opening?.name || '',
      totalGames,
      whiteWins: data.white || 0,
      draws: data.draws || 0,
      blackWins: data.black || 0,
      whiteWinPct: totalGames > 0 ? Math.round((data.white / totalGames) * 100) : 0,
      drawPct: totalGames > 0 ? Math.round((data.draws / totalGames) * 100) : 0,
      blackWinPct: totalGames > 0 ? Math.round((data.black / totalGames) * 100) : 0,
      moves,
      games,
    };
  }
}

export class LichessExplorerProvider implements IOpeningExplorerProvider {
  name = 'lichess';

  async fetchData(fen: string, filters?: LichessFilters): Promise<ExplorerData> {
    const cleanFen = fen.split('|')[0];
    const params = new URLSearchParams();
    params.set('fen', cleanFen);
    params.set('recentGames', '15');

    const speeds = filters?.speeds ?? [];
    const ratings = filters?.ratings ?? [];

    speeds.forEach(s => params.append('speeds[]', s));
    ratings.forEach(r => params.append('ratings[]', String(r)));

    const response = await fetch(
      `https://explorer.lichess.org/lichess?${params.toString()}`,
      { headers: getLichessHeaders() }
    );
    if (!response.ok) {
      handleFetchError(response, 'Lichess');
    }
    const data = await response.json();
    return this.mapResponse(data);
  }

  private mapResponse(data: any): ExplorerData {
    const totalGames = (data.white || 0) + (data.draws || 0) + (data.black || 0);

    const moves: ExplorerMove[] = (data.moves || []).map((m: any) => {
      const moveGames = (m.white || 0) + (m.draws || 0) + (m.black || 0);
      return {
        san: m.san,
        games: moveGames,
        popularity: totalGames > 0 ? Math.round((moveGames / totalGames) * 100) : 0,
        whiteWinPct: moveGames > 0 ? Math.round((m.white / moveGames) * 100) : 0,
        drawPct: moveGames > 0 ? Math.round((m.draws / moveGames) * 100) : 0,
        blackWinPct: moveGames > 0 ? Math.round((m.black / moveGames) * 100) : 0,
      };
    });

    // Sort moves by popularity descending
    moves.sort((a, b) => b.games - a.games);

    // Lichess endpoint returns sample games in recentGames (not topGames which is masters-only)
    const rawGames = data.recentGames || data.topGames || [];
    const games: ExplorerGame[] = rawGames.map((g: any) => {
      // Lichess recentGames may use g.month ("2023-05") instead of g.year (integer)
      const year = g.year ?? (g.month ? parseInt(g.month.split('-')[0], 10) : undefined);
      // Player objects: some responses use g.white.name, others use g.players.white
      const whiteName = g.white?.name || g.players?.white?.user?.name || g.players?.white?.name || 'Unknown';
      const blackName = g.black?.name || g.players?.black?.user?.name || g.players?.black?.name || 'Unknown';
      const whiteRating = g.white?.rating ?? g.players?.white?.rating;
      const blackRating = g.black?.rating ?? g.players?.black?.rating;
      return {
        id: g.id,
        white: { name: whiteName, rating: whiteRating },
        black: { name: blackName, rating: blackRating },
        year,
        result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '½-½',
      };
    });

    return {
      openingName: data.opening?.name || '',
      totalGames,
      whiteWins: data.white || 0,
      draws: data.draws || 0,
      blackWins: data.black || 0,
      whiteWinPct: totalGames > 0 ? Math.round((data.white / totalGames) * 100) : 0,
      drawPct: totalGames > 0 ? Math.round((data.draws / totalGames) * 100) : 0,
      blackWinPct: totalGames > 0 ? Math.round((data.black / totalGames) * 100) : 0,
      moves,
      games,
    };
  }
}

export class OpeningExplorerService {
  private providers: Record<string, any>;
  private cache: Record<string, ExplorerData>;

  constructor() {
    this.providers = {
      masters: new MastersExplorerProvider(),
      lichess: new LichessExplorerProvider(),
    };
    this.cache = {};
  }

  async getExplorerData(
    source: 'masters' | 'lichess',
    fen: string,
    filters?: LichessFilters
  ): Promise<ExplorerData> {
    const normalizedFen = this.normalizeFen(fen);
    const filterKey = filters
      ? `|sp:${(filters.speeds || []).sort().join(',')}|rt:${(filters.ratings || []).sort().join(',')}`
      : '';
    const cacheKey = `${source}:${normalizedFen}${filterKey}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    const provider = this.providers[source];
    if (!provider) {
      throw new Error(`Provider not found for source: ${source}`);
    }

    const data = source === 'lichess'
      ? await (provider as LichessExplorerProvider).fetchData(fen, filters)
      : await (provider as MastersExplorerProvider).fetchData(fen);

    this.cache[cacheKey] = data;
    return data;
  }

  private normalizeFen(fen: string): string {
    const cleanFen = fen.split('|')[0];
    const parts = cleanFen.split(' ');
    // Strip move counters (halfmove and fullmove) to maximize transposition cache hits
    return parts.slice(0, 4).join(' ');
  }
}

export const explorerService = new OpeningExplorerService();
