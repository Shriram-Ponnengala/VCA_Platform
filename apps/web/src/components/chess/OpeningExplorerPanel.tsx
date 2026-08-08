'use client';

import React, { useState, useEffect } from 'react';
import {
  explorerService,
  ExplorerData,
  ExplorerMove,
  ExplorerGame,
  LichessFilters,
  LichessSpeed,
  LichessRating,
  getLichessApiKey,
  setLichessApiKey,
} from '@/features/explorer/providers';
import { Database, HelpCircle, RefreshCw, X, SlidersHorizontal, ArrowUpDown, Key, ExternalLink, Check } from 'lucide-react';

interface OpeningExplorerPanelProps {
  fen: string;
  onMoveClick: (moveSan: string) => void;
  onLoadPgn?: (pgn: string) => void;
}

// ── Speed icons (SVG paths matching Lichess style) ──────────────────────────
const SpeedIcons: Record<LichessSpeed, React.ReactNode> = {
  ultraBullet: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"/>
    </svg>
  ),
  bullet: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2C9.24 2 7 4.24 7 7c0 2.28 1.46 4.23 3.5 4.8V20h3v-8.2C15.54 11.23 17 9.28 17 7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3z"/>
    </svg>
  ),
  blitz: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
    </svg>
  ),
  rapid: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
    </svg>
  ),
  classical: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
    </svg>
  ),
};

const SPEED_LABELS: Record<LichessSpeed, string> = {
  ultraBullet: 'UltraBullet',
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
};

const ALL_SPEEDS: LichessSpeed[] = ['ultraBullet', 'bullet', 'blitz', 'rapid', 'classical'];
const ALL_RATINGS: LichessRating[] = [400, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500];

type SortOrder = 'none' | 'high-to-low' | 'low-to-high';

export default function OpeningExplorerPanel({ fen, onMoveClick, onLoadPgn }: OpeningExplorerPanelProps) {
  const [source, setSource] = useState<'masters' | 'lichess'>('masters');
  const [data, setData] = useState<ExplorerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [selectedGame, setSelectedGame] = useState<ExplorerGame | null>(null);
  const [loadingGameId, setLoadingGameId] = useState<string | null>(null);

  // ── Lichess filter state ─────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpeeds, setSelectedSpeeds] = useState<LichessSpeed[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<LichessRating[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  // Applied filters (only applied when user clicks "Apply")
  const [appliedFilters, setAppliedFilters] = useState<LichessFilters | undefined>(undefined);
  const [appliedSort, setAppliedSort] = useState<SortOrder>('none');

  // ── Lichess API Key State ───────────────────────────────────────────
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeySettings, setShowKeySettings] = useState(false);

  useEffect(() => {
    setApiKeyInput(getLichessApiKey() || '');
  }, []);

  const handleSaveApiKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLichessApiKey(apiKeyInput);
    setShowKeySettings(false);
    setRetryTrigger((prev) => prev + 1);
  };

  // ── Debounced fetch logic ────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const delayDebounce = setTimeout(async () => {
      try {
        const filters = source === 'lichess' ? appliedFilters : undefined;
        const result = await explorerService.getExplorerData(source, fen, filters);
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error('[OpeningExplorer] Error fetching data:', err);
        setError(err?.message || 'Unable to load Opening Explorer.');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [fen, source, retryTrigger, appliedFilters]);

  const handleRetry = () => {
    setRetryTrigger((prev) => prev + 1);
  };

  const handleGameClick = async (game: ExplorerGame) => {
    if (!game.id || !onLoadPgn) return;
    setLoadingGameId(game.id);
    try {
      const res = await fetch(`https://lichess.org/game/export/${game.id}?clocks=false&evals=false&analyses=false`, {
        headers: {
          'Accept': 'application/x-chess-pgn'
        }
      });
      if (res.ok) {
        const pgn = await res.text();
        onLoadPgn(pgn);
      } else {
        console.error('[OpeningExplorer] Failed to fetch PGN for game:', game.id);
      }
    } catch (err) {
      console.error('[OpeningExplorer] Error fetching game PGN:', err);
    } finally {
      setLoadingGameId(null);
    }
  };

  const toggleSpeed = (speed: LichessSpeed) => {
    setSelectedSpeeds(prev =>
      prev.includes(speed) ? prev.filter(s => s !== speed) : [...prev, speed]
    );
  };

  const toggleRating = (rating: LichessRating) => {
    setSelectedRatings(prev =>
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    );
  };

  const applyFilters = () => {
    const filters: LichessFilters = {
      speeds: selectedSpeeds,
      ratings: selectedRatings,
    };
    setAppliedFilters(filters);
    setAppliedSort(sortOrder);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSelectedSpeeds([]);
    setSelectedRatings([]);
    setSortOrder('none');
    setAppliedFilters(undefined);
    setAppliedSort('none');
    setShowFilters(false);
  };

  const hasActiveFilters = (appliedFilters?.speeds?.length ?? 0) > 0
    || (appliedFilters?.ratings?.length ?? 0) > 0
    || appliedSort !== 'none';

  // Sort games by rating client-side
  const sortedGames = React.useMemo(() => {
    if (!data?.games) return [];
    const games = [...data.games];
    if (appliedSort === 'high-to-low') {
      games.sort((a, b) => {
        const ratingA = Math.max(a.white.rating ?? 0, a.black.rating ?? 0);
        const ratingB = Math.max(b.white.rating ?? 0, b.black.rating ?? 0);
        return ratingB - ratingA;
      });
    } else if (appliedSort === 'low-to-high') {
      games.sort((a, b) => {
        const ratingA = Math.max(a.white.rating ?? 0, a.black.rating ?? 0);
        const ratingB = Math.max(b.white.rating ?? 0, b.black.rating ?? 0);
        return ratingA - ratingB;
      });
    }
    return games;
  }, [data?.games, appliedSort]);

  const formatGamesCount = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="explorer-panel">
      {/* Source Selector */}
      <div className="source-selector">
        <button
          className={`source-btn ${source === 'masters' ? 'active' : ''}`}
          onClick={() => setSource('masters')}
        >
          <Database size={14} /> Master Database
        </button>
        <button
          className={`source-btn ${source === 'lichess' ? 'active' : ''}`}
          onClick={() => setSource('lichess')}
        >
          Lichess Games
        </button>
        {source === 'lichess' && (
          <button
            className={`filter-btn ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
            onClick={() => {
              setShowFilters(prev => !prev);
              setShowKeySettings(false);
            }}
            title="Filters"
          >
            <SlidersHorizontal size={14} />
            {hasActiveFilters && <span className="filter-dot" />}
          </button>
        )}
        <button
          className={`filter-btn ${showKeySettings ? 'active' : ''}`}
          onClick={() => {
            setShowKeySettings(prev => !prev);
            setShowFilters(false);
          }}
          title="Lichess API Token Settings"
        >
          <Key size={14} />
        </button>
      </div>

      {/* ── API Key Settings Panel ────────────────────────────────────────── */}
      {showKeySettings && (
        <div className="filters-panel">
          <div className="filter-section">
            <div className="filter-section-label">Lichess API Key Token</div>
            <p style={{ fontSize: '0.75rem', color: '#5c3a21', marginBottom: '8px' }}>
              Lichess Opening Explorer requires a Personal Access Token.
            </p>
            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="password"
                placeholder="Paste Lichess Token (lip_...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#fff',
                  border: '1px solid #eedcd0',
                  color: '#2d1510',
                  fontSize: '0.8rem',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <a
                  href="https://lichess.org/account/oauth/token/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="filter-reset-btn"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={12} /> Get Token
                </a>
                <button type="submit" className="filter-apply-btn">
                  Save & Retry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lichess Filters Panel ─────────────────────────────────────────── */}
      {source === 'lichess' && showFilters && (
        <div className="filters-panel">
          {/* Sort Order */}
          <div className="filter-section">
            <div className="filter-section-label">Sort by Rating</div>
            <div className="sort-btns">
              {([
                ['none', 'Default'],
                ['high-to-low', '↓ High → Low'],
                ['low-to-high', '↑ Low → High'],
              ] as [SortOrder, string][]).map(([val, label]) => (
                <button
                  key={val}
                  className={`sort-btn ${sortOrder === val ? 'active' : ''}`}
                  onClick={() => setSortOrder(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Controls */}
          <div className="filter-section">
            <div className="filter-section-label">Time Control</div>
            <div className="speed-btns">
              {ALL_SPEEDS.map(speed => (
                <button
                  key={speed}
                  className={`speed-btn ${selectedSpeeds.includes(speed) ? 'active' : ''}`}
                  onClick={() => toggleSpeed(speed)}
                  title={SPEED_LABELS[speed]}
                >
                  {SpeedIcons[speed]}
                  <span className="speed-label">{SPEED_LABELS[speed]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Average Rating */}
          <div className="filter-section">
            <div className="filter-section-label">Average Rating</div>
            <div className="rating-btns">
              {ALL_RATINGS.map(r => (
                <button
                  key={r}
                  className={`rating-btn ${selectedRatings.includes(r) ? 'active' : ''}`}
                  onClick={() => toggleRating(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="filter-actions">
            <button className="filter-reset-btn" onClick={resetFilters}>Reset</button>
            <button className="filter-apply-btn" onClick={applyFilters}>✓ Apply</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="explorer-loading">
          <div className="spinner"></div>
          <p>Loading Opening Explorer...</p>
        </div>
      ) : error ? (
        <div className="explorer-error">
          {error.includes('401') || error.includes('Unauthorized') || error.includes('Token') ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '340px', width: '100%', padding: '8px' }}>
              <Key size={36} style={{ color: '#c8854a', marginBottom: '12px' }} />
              <h4 style={{ color: '#2d1510', fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Lichess API Token Required</h4>
              <p style={{ fontSize: '0.78rem', color: '#5c3a21', marginBottom: '16px', lineHeight: '1.4', textAlign: 'center' }}>
                Lichess requires a Personal Access Token to access Opening Explorer data. Create a free token on Lichess and paste it below.
              </p>
              <form onSubmit={handleSaveApiKey} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="Paste Lichess Token (lip_...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#fff',
                    border: '1.5px solid #d4a373',
                    color: '#2d1510',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <a
                    href="https://lichess.org/account/oauth/token/create"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: '#fff',
                      border: '1px solid #eedcd0',
                      color: '#5c3a21',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <ExternalLink size={14} /> Get Token
                  </a>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: '#c8854a',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={14} /> Save & Retry
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <p>{error}</p>
              <button className="retry-btn" onClick={handleRetry}>
                <RefreshCw size={14} /> Retry
              </button>
            </>
          )}
        </div>
      ) : !data || data.totalGames === 0 ? (
        <div className="explorer-empty">
          <HelpCircle size={32} />
          <p>No Opening Explorer data available for this position.</p>
        </div>
      ) : (
        <div className="explorer-content">
          {/* Header/Stats should not scroll */}
          <div className="explorer-fixed-top">
            {/* Opening Name */}
            {data.openingName && (
              <div className="opening-header">
                <h3>{data.openingName}</h3>
              </div>
            )}

            {/* Overall Position Statistics */}
            <div className="stats-section">
              <div className="total-games-badge">
                Total Games: {data.totalGames.toLocaleString()}
              </div>
              
              {/* Horizontal win bar */}
              <div className="bar-container">
                {data.whiteWinPct > 0 && (
                  <div 
                    className="bar white-bar" 
                    style={{ width: `${data.whiteWinPct}%` }}
                    title={`White wins: ${data.whiteWinPct}% (${data.whiteWins.toLocaleString()})`}
                  >
                    {data.whiteWinPct >= 10 && `${data.whiteWinPct}%`}
                  </div>
                )}
                {data.drawPct > 0 && (
                  <div 
                    className="bar draw-bar" 
                    style={{ width: `${data.drawPct}%` }}
                    title={`Draws: ${data.drawPct}% (${data.draws.toLocaleString()})`}
                  >
                    {data.drawPct >= 10 && `${data.drawPct}%`}
                  </div>
                )}
                {data.blackWinPct > 0 && (
                  <div 
                    className="bar black-bar" 
                    style={{ width: `${data.blackWinPct}%` }}
                    title={`Black wins: ${data.blackWinPct}% (${data.blackWins.toLocaleString()})`}
                  >
                    {data.blackWinPct >= 10 && `${data.blackWinPct}%`}
                  </div>
                )}
              </div>

              {/* Raw statistics labels */}
              <div className="stats-raw-labels">
                <span>White: {data.whiteWins.toLocaleString()}</span>
                <span>Draws: {data.draws.toLocaleString()}</span>
                <span>Black: {data.blackWins.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="explorer-scroll-area">
            {/* Move list */}
            <div className="explorer-section-title">Popular Continuations</div>
            <div className="moves-table-container">
              <table className="moves-table">
                <thead>
                  <tr>
                    <th>Move</th>
                    <th>Played</th>
                    <th style={{ width: '40%' }}>Results</th>
                    <th style={{ textAlign: 'right' }}>Games</th>
                  </tr>
                </thead>
                <tbody>
                  {data.moves.map((move: ExplorerMove, idx) => (
                    <tr key={idx} onClick={() => onMoveClick(move.san)} className="move-row">
                      <td className="move-san">{move.san}</td>
                      <td className="move-popularity">{move.popularity}%</td>
                      <td>
                        {/* Mini result bar */}
                        <div className="mini-bar-container">
                          {move.whiteWinPct > 0 && (
                            <div 
                              className="bar white-bar" 
                              style={{ width: `${move.whiteWinPct}%` }}
                              title={`White wins: ${move.whiteWinPct}%`}
                            />
                          )}
                          {move.drawPct > 0 && (
                            <div 
                              className="bar draw-bar" 
                              style={{ width: `${move.drawPct}%` }}
                              title={`Draws: ${move.drawPct}%`}
                            />
                          )}
                          {move.blackWinPct > 0 && (
                            <div 
                              className="bar black-bar" 
                              style={{ width: `${move.blackWinPct}%` }}
                              title={`Black wins: ${move.blackWinPct}%`}
                            />
                          )}
                        </div>
                      </td>
                      <td className="move-games">{formatGamesCount(move.games)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Games list */}
            <div className="explorer-section-title">
              {source === 'masters' ? 'Top Master Games' : (
                <span className="games-section-header">
                  Lichess Games
                  {appliedSort !== 'none' && (
                    <span className="sort-badge">
                      {appliedSort === 'high-to-low' ? '↓ Rating' : '↑ Rating'}
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="games-list">
              {sortedGames.length === 0 ? (
                <p className="no-games">No games recorded for this position.</p>
              ) : (
                sortedGames.map((game: ExplorerGame, idx) => (
                  <div
                    key={idx}
                    className={`game-item ${loadingGameId === game.id ? 'loading' : ''}`}
                    onClick={() => handleGameClick(game)}
                  >
                    <div className="game-players">
                      <span className="player-white">{game.white.name} ({game.white.rating || '?'})</span>
                      <span className="vs">vs</span>
                      <span className="player-black">{game.black.name} ({game.black.rating || '?'})</span>
                      {loadingGameId === game.id && <span className="spinner-mini" />}
                    </div>
                    <div className="game-meta">
                      <span className="game-year">{game.year || 'Unknown Year'}</span>
                      <span className={`game-result ${game.result === '1-0' ? 'win' : game.result === '0-1' ? 'loss' : 'draw'}`}>
                        {game.result}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game Details Modal — removed: clicking now loads game directly */}

      <style jsx>{`
        .explorer-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          color: #4a2018;
          font-family: inherit;
        }

        .source-selector {
          display: flex;
          gap: 8px;
          padding: 8px;
          border-bottom: 1px solid #eedcd0;
          background: rgba(253, 240, 228, 0.5);
        }

        .source-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #eedcd0;
          background: #fff;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #4a2018;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .source-btn:hover {
          background: #fdf0e4;
        }

        .source-btn.active {
          background: #c8854a;
          color: #fff;
          border-color: #c8854a;
        }

        /* Filter button */
        .filter-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border: 1px solid #eedcd0;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          color: #7a5a45;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .filter-btn:hover { background: #fdf0e4; }
        .filter-btn.active { background: #fdf0e4; border-color: #c8854a; color: #c8854a; }
        .filter-btn.has-filters { border-color: #c8854a; color: #c8854a; }

        .filter-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 6px;
          height: 6px;
          background: #c8854a;
          border-radius: 50%;
        }

        /* ── Filters Panel ─────────────────────────────────────────── */
        .filters-panel {
          background: #fdf8f3;
          border-bottom: 1px solid #eedcd0;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-section-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #8a6c5b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Sort buttons */
        .sort-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .sort-btn {
          padding: 5px 10px;
          border: 1px solid #eedcd0;
          background: #fff;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #4a2018;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sort-btn:hover { background: #fdf0e4; border-color: #c8854a; }
        .sort-btn.active {
          background: #c8854a;
          color: #fff;
          border-color: #c8854a;
        }

        /* Speed buttons */
        .speed-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .speed-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 10px;
          border: 1px solid #eedcd0;
          background: #fff;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 500;
          color: #7a5a45;
          cursor: pointer;
          transition: all 0.15s ease;
          min-width: 54px;
        }
        .speed-btn:hover { background: #fdf0e4; border-color: #c8854a; color: #c8854a; }
        .speed-btn.active {
          background: #c8854a;
          color: #fff;
          border-color: #c8854a;
        }

        .speed-label {
          font-size: 0.65rem;
          white-space: nowrap;
        }

        /* Rating buttons */
        .rating-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .rating-btn {
          padding: 5px 8px;
          border: 1px solid #eedcd0;
          background: #fff;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #4a2018;
          cursor: pointer;
          transition: all 0.15s ease;
          min-width: 40px;
          text-align: center;
        }
        .rating-btn:hover { background: #fdf0e4; border-color: #c8854a; }
        .rating-btn.active {
          background: #c8854a;
          color: #fff;
          border-color: #c8854a;
        }

        /* Filter actions */
        .filter-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding-top: 4px;
          border-top: 1px solid #eedcd0;
        }

        .filter-reset-btn {
          padding: 6px 14px;
          border: 1px solid #eedcd0;
          background: #fff;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #8a6c5b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-reset-btn:hover { background: #fdf0e4; }

        .filter-apply-btn {
          padding: 6px 16px;
          background: #c8854a;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .filter-apply-btn:hover { background: #b0703c; }

        /* Sort badge in section title */
        .games-section-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sort-badge {
          font-size: 0.68rem;
          background: rgba(200, 133, 74, 0.15);
          color: #c8854a;
          padding: 1px 6px;
          border-radius: 8px;
          font-weight: 600;
        }

        .explorer-loading, .explorer-error, .explorer-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          text-align: center;
          flex: 1;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(200, 133, 74, 0.2);
          border-top-color: #c8854a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .retry-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 6px 16px;
          background: #c8854a;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .explorer-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .explorer-fixed-top {
          padding: 12px 12px 0 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-shrink: 0;
        }

        .explorer-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
        }

        .opening-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
          color: #4a2018;
        }

        .stats-section {
          background: #fff;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .total-games-badge {
          font-size: 0.75rem;
          color: #8a6c5b;
          font-weight: 500;
        }

        .bar-container {
          display: flex;
          height: 20px;
          border-radius: 4px;
          overflow: hidden;
          font-size: 0.7rem;
          font-weight: bold;
          color: #fff;
        }

        .bar {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          transition: width 0.3s ease;
        }

        .white-bar {
          background: #8a9c8b;
          color: #fff;
        }

        .draw-bar {
          background: #a8a09b;
          color: #fff;
        }

        .black-bar {
          background: #4a4542;
          color: #fff;
        }

        .stats-raw-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #8a6c5b;
        }

        .explorer-section-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #8a6c5b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 6px;
          border-bottom: 1px solid #eedcd0;
          padding-bottom: 4px;
          flex-shrink: 0;
        }

        .moves-table-container {
          background: #fff;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .moves-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          text-align: left;
        }

        .moves-table th {
          background: #fdf0e4;
          padding: 6px 10px;
          font-weight: 600;
          font-size: 0.75rem;
          color: #8a6c5b;
        }

        .moves-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #fdf0e4;
        }

        .move-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .move-row:hover {
          background: #fdf0e4;
        }

        .move-san {
          font-weight: 600;
          color: #c8854a;
        }

        .mini-bar-container {
          display: flex;
          height: 10px;
          border-radius: 2px;
          overflow: hidden;
          width: 100%;
          background: rgba(0,0,0,0.05);
        }

        .move-games {
          text-align: right;
          color: #8a6c5b;
        }

        .games-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }

        .game-item {
          background: #fff;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .game-item:hover {
          border-color: #c8854a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .game-players {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .player-white {
          color: #4a2018;
        }

        .player-black {
          color: #4a2018;
        }

        .vs {
          color: #a89083;
          font-size: 0.7rem;
        }

        .game-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #8a6c5b;
        }

        .game-result {
          font-weight: bold;
          padding: 0 4px;
          border-radius: 2px;
        }

        .game-result.win { color: #8a9c8b; }
        .game-result.loss { color: #d37a6d; }
        .game-result.draw { color: #a8a09b; }

        .no-games {
          font-size: 0.75rem;
          color: #8a6c5b;
          text-align: center;
          padding: 8px;
        }

        .spinner-mini {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(200, 133, 74, 0.2);
          border-top-color: #c8854a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 8px;
          display: inline-block;
          vertical-align: middle;
        }

        .game-item.loading {
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
