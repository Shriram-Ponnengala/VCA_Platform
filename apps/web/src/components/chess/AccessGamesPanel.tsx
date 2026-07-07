'use client';

import React, { useRef } from 'react';
import { Search, Loader2, ExternalLink, ChevronRight, AlertCircle, User, Filter } from 'lucide-react';

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

export interface AccessGamesPanelProps {
  onLoadPgn: (pgn: string) => void;
  // Controlled state — lifted to DatabasePanel so it persists across tab switches
  platform: 'lichess' | 'chesscom';
  username: string;
  games: AccessGame[] | null;
  error: string | null;
  onPlatformChange: (p: 'lichess' | 'chesscom') => void;
  onUsernameChange: (u: string) => void;
  onGamesChange: (g: AccessGame[] | null) => void;
  onErrorChange: (e: string | null) => void;
}

// In-session network cache (avoids re-fetching same username on re-mount)
const networkCache: Record<string, AccessGame[]> = {};

export default function AccessGamesPanel({
  onLoadPgn,
  platform,
  username,
  games,
  error,
  onPlatformChange,
  onUsernameChange,
  onGamesChange,
  onErrorChange,
}: AccessGamesPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState({
    startDate: '',
    endDate: '',
    format: '',
    result: '',
    opponent: ''
  });

  const fetchGames = async () => {
    const uname = username.trim();
    if (!uname) {
      inputRef.current?.focus();
      return;
    }

    const key = `${platform}:${uname.toLowerCase()}:${JSON.stringify(filters)}`;

    // Return from network cache if available
    if (networkCache[key]) {
      onGamesChange(networkCache[key]);
      onErrorChange(null);
      return;
    }

    setLoading(true);
    onErrorChange(null);
    onGamesChange(null);

    try {
      const query = new URLSearchParams({
        platform,
        username: uname,
        max: '20'
      });
      if (filters.startDate) query.append('startDate', filters.startDate);
      if (filters.endDate) query.append('endDate', filters.endDate);
      if (filters.format) query.append('format', filters.format);
      if (filters.result) query.append('result', filters.result);
      if (filters.opponent) query.append('opponent', filters.opponent);

      const res = await fetch(`/api/database/access-games?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch games (${res.status})`);
      }

      const fetched: AccessGame[] = data.games || [];
      networkCache[key] = fetched;
      onGamesChange(fetched);
    } catch (e: any) {
      onErrorChange(e.message || 'Failed to fetch games. Check the username and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchGames();
  };

  const handleLoadGame = (game: AccessGame) => {
    if (!game.pgn) return;
    setLoadingId(game.id);
    try {
      onLoadPgn(game.pgn);
    } finally {
      setTimeout(() => setLoadingId(null), 600);
    }
  };

  const formatResult = (result: string) => {
    if (result === '1-0') return { label: '1-0', cls: 'result-white' };
    if (result === '0-1') return { label: '0-1', cls: 'result-black' };
    return { label: '½-½', cls: 'result-draw' };
  };

  const formatTc = (tc?: string) => {
    if (!tc) return '';
    if (/^\d+$/.test(tc)) {
      const secs = parseInt(tc);
      return secs >= 60 ? `${Math.round(secs / 60)}min` : `${secs}s`;
    }
    return tc;
  };

  return (
    <div className="ag-panel">
      {/* Platform toggle */}
      <div className="ag-platform-toggle">
        <button
          className={`ag-platform-btn ${platform === 'lichess' ? 'active' : ''}`}
          onClick={() => onPlatformChange('lichess')}
        >
          <span className="ag-platform-icon">♟</span>
          Lichess
        </button>
        <button
          className={`ag-platform-btn ${platform === 'chesscom' ? 'active' : ''}`}
          onClick={() => onPlatformChange('chesscom')}
        >
          <span className="ag-platform-icon">♞</span>
          Chess.com
        </button>
      </div>

      {/* Search row */}
      <div className="ag-search-row">
        <div className="ag-input-wrap">
          <User size={14} className="ag-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="ag-input"
            placeholder={platform === 'lichess' ? 'Lichess username…' : 'Chess.com username…'}
            value={username}
            onChange={e => onUsernameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          className={`ag-filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle Filters"
        >
          <Filter size={15} />
        </button>
        <button
          className="ag-fetch-btn"
          onClick={fetchGames}
          disabled={loading || !username.trim()}
          title="Fetch recent games"
        >
          {loading ? <Loader2 size={15} className="ag-spin" /> : <Search size={15} />}
          {loading ? 'Fetching…' : 'Fetch'}
        </button>
      </div>

      {/* Filters container */}
      {showFilters && (
        <div className="ag-filters-container">
          <div className="ag-filter-group">
            <label>Date Range</label>
            <div className="ag-filter-row">
              <input type="date" className="ag-filter-input" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
              <span>to</span>
              <input type="date" className="ag-filter-input" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
            </div>
          </div>
          
          <div className="ag-filter-row-split">
            <div className="ag-filter-group">
              <label>Format</label>
              <select className="ag-filter-input" value={filters.format} onChange={e => setFilters({...filters, format: e.target.value})}>
                <option value="">All Formats</option>
                <option value="ultrabullet">Ultra Bullet</option>
                <option value="bullet">Bullet</option>
                <option value="blitz">Blitz</option>
                <option value="rapid">Rapid</option>
                <option value="classical">Classical</option>
              </select>
            </div>

            <div className="ag-filter-group">
              <label>Result</label>
              <select className="ag-filter-input" value={filters.result} onChange={e => setFilters({...filters, result: e.target.value})}>
                <option value="">All Results</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="draw">Draw</option>
              </select>
            </div>
          </div>

          <div className="ag-filter-group">
            <label>Opponent Username</label>
            <input type="text" className="ag-filter-input" placeholder="Any opponent" value={filters.opponent} onChange={e => setFilters({...filters, opponent: e.target.value})} />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="ag-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="ag-skeleton-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="ag-skeleton-row" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && games !== null && games.length === 0 && (
        <div className="ag-empty">
          <p>No games found for <strong>{username}</strong> on {platform === 'lichess' ? 'Lichess' : 'Chess.com'}.</p>
        </div>
      )}

      {/* Games list */}
      {!loading && games && games.length > 0 && (
        <>
          <div className="ag-list-header">
            <span>{games.length} recent games · {username}</span>
            <a
              href={platform === 'lichess'
                ? `https://lichess.org/@/${username}`
                : `https://www.chess.com/member/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ag-profile-link"
            >
              Profile <ExternalLink size={11} />
            </a>
          </div>

          <div className="ag-games-list">
            {games.map((game) => {
              const { label, cls } = formatResult(game.result);
              const isLoading = loadingId === game.id;
              return (
                <div
                  key={game.id}
                  className={`ag-game-row ${isLoading ? 'ag-game-loading' : ''}`}
                  onClick={() => !isLoading && handleLoadGame(game)}
                  title="Click to load into board"
                >
                  <div className="ag-game-main">
                    <div className="ag-game-players">
                      <span className="ag-player-white">
                        {game.white}{game.whiteElo ? ` (${game.whiteElo})` : ''}
                      </span>
                      <span className={`ag-result-badge ${cls}`}>{label}</span>
                      <span className="ag-player-black">
                        {game.black}{game.blackElo ? ` (${game.blackElo})` : ''}
                      </span>
                    </div>
                    {game.opening && (
                      <div className="ag-game-opening">{game.opening}</div>
                    )}
                    <div className="ag-game-meta">
                      {game.date && <span>{game.date}</span>}
                      {game.timeControl && <span className="ag-tc">{formatTc(game.timeControl)}</span>}
                    </div>
                  </div>
                  <div className="ag-game-action">
                    {isLoading
                      ? <Loader2 size={14} className="ag-spin" />
                      : <ChevronRight size={14} />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        .ag-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: #4a2018;
          font-family: inherit;
        }

        .ag-platform-toggle {
          display: flex;
          background: rgba(74, 32, 24, 0.05);
          border-radius: 8px;
          padding: 3px;
          gap: 2px;
        }
        .ag-platform-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 6px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(74, 32, 24, 0.65);
          cursor: pointer;
          transition: all 0.15s;
        }
        .ag-platform-btn:hover { color: #4a2018; background: rgba(255,255,255,0.5); }
        .ag-platform-btn.active {
          background: #c8854a;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(200, 133, 74, 0.35);
        }
        .ag-platform-icon { font-size: 1rem; }

        .ag-search-row {
          display: flex;
          gap: 6px;
        }
        .ag-input-wrap {
          flex: 1;
          position: relative;
        }
        .ag-input-icon {
          position: absolute;
          left: 9px;
          top: 50%;
          transform: translateY(-50%);
          color: #a08070;
          pointer-events: none;
        }
        .ag-input {
          width: 100%;
          padding: 8px 10px 8px 30px;
          border: 1px solid #eedcd0;
          border-radius: 7px;
          font-size: 0.83rem;
          color: #4a2018;
          background: #ffffff;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .ag-input:focus { border-color: #c8854a; }
        .ag-input::placeholder { color: rgba(74, 32, 24, 0.4); }

        .ag-filter-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          background: #ffffff;
          color: #a08070;
          border: 1px solid #eedcd0;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .ag-filter-toggle-btn:hover {
          background: #fdf5ea;
          color: #c8854a;
          border-color: #c8854a;
        }
        .ag-filter-toggle-btn.active {
          background: #fdf5ea;
          color: #c8854a;
          border-color: #c8854a;
        }

        .ag-filters-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          margin-top: -2px;
        }
        .ag-filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .ag-filter-group label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #a08070;
          text-transform: uppercase;
        }
        .ag-filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ag-filter-row span {
          font-size: 0.8rem;
          color: #a08070;
        }
        .ag-filter-row-split {
          display: flex;
          gap: 10px;
        }
        .ag-filter-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #eedcd0;
          border-radius: 5px;
          font-size: 0.8rem;
          color: #4a2018;
          background: #ffffff;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .ag-filter-input:focus {
          border-color: #c8854a;
        }

        .ag-fetch-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          background: #c8854a;
          color: #fff;
          border: none;
          border-radius: 7px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ag-fetch-btn:hover:not(:disabled) { background: #b0703c; }
        .ag-fetch-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ag-spin {
          animation: ag-spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes ag-spin { to { transform: rotate(360deg); } }

        .ag-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(239, 68, 68, 0.07);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 7px;
          color: #c53030;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .ag-error svg { flex-shrink: 0; margin-top: 1px; }

        .ag-skeleton-list { display: flex; flex-direction: column; gap: 6px; }
        .ag-skeleton-row {
          height: 62px;
          border-radius: 8px;
          background: linear-gradient(90deg, #f5ebe0 25%, #eedcd0 50%, #f5ebe0 75%);
          background-size: 200% 100%;
          animation: ag-shimmer 1.2s infinite;
        }
        @keyframes ag-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .ag-empty {
          text-align: center;
          padding: 24px 12px;
          color: rgba(74, 32, 24, 0.5);
          font-size: 0.83rem;
          line-height: 1.5;
        }

        .ag-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          color: rgba(74, 32, 24, 0.55);
          font-weight: 500;
          padding: 0 2px;
        }
        .ag-profile-link {
          display: flex;
          align-items: center;
          gap: 3px;
          color: #c8854a;
          font-size: 0.72rem;
          text-decoration: none;
          font-weight: 600;
        }
        .ag-profile-link:hover { text-decoration: underline; }

        .ag-games-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          overflow-y: auto;
          max-height: 420px;
          padding-right: 2px;
        }
        .ag-games-list::-webkit-scrollbar { width: 4px; }
        .ag-games-list::-webkit-scrollbar-thumb { background: rgba(200,133,74,0.3); border-radius: 2px; }

        .ag-game-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 11px;
          background: #fff;
          border: 1px solid #eedcd0;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ag-game-row:hover {
          border-color: #c8854a;
          background: #fdf5ea;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(200, 133, 74, 0.12);
        }
        .ag-game-row.ag-game-loading {
          opacity: 0.7;
          cursor: wait;
        }

        .ag-game-main { flex: 1; min-width: 0; }

        .ag-game-players {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          flex-wrap: nowrap;
          white-space: nowrap;
          overflow: hidden;
        }
        .ag-player-white {
          color: #4a2018;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 110px;
          flex-shrink: 1;
        }
        .ag-player-black {
          color: rgba(74, 32, 24, 0.75);
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 110px;
          flex-shrink: 1;
        }

        .ag-result-badge {
          flex-shrink: 0;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .result-white { background: rgba(138, 156, 139, 0.15); color: #4a7a4c; }
        .result-black { background: rgba(74, 69, 66, 0.1); color: #4a4542; }
        .result-draw  { background: rgba(168, 160, 155, 0.15); color: #6b5e58; }

        .ag-game-opening {
          font-size: 0.7rem;
          color: #c8854a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
          font-style: italic;
        }

        .ag-game-meta {
          display: flex;
          gap: 8px;
          font-size: 0.68rem;
          color: rgba(74, 32, 24, 0.45);
          margin-top: 3px;
        }
        .ag-tc {
          background: rgba(74, 32, 24, 0.06);
          padding: 0 4px;
          border-radius: 3px;
          font-weight: 500;
        }

        .ag-game-action {
          flex-shrink: 0;
          color: rgba(74, 32, 24, 0.3);
          transition: color 0.15s;
        }
        .ag-game-row:hover .ag-game-action { color: #c8854a; }
      `}</style>
    </div>
  );
}
