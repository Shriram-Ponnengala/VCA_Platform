import React, { useState, useEffect } from 'react';
import { MoveNode } from '@vca/types';
import { Plus, User, MapPin, Calendar, PlayCircle, CheckCircle, Award, Box, Clock, XCircle, Tag } from 'lucide-react';

const MOVE_EVALS = [
  { symbol: '!!', label: 'Brilliant', colorVar: 'var(--nag-brilliant, #1baba4)' },
  { symbol: '!', label: 'Good', colorVar: 'var(--nag-good, #96b92a)' },
  { symbol: '!?', label: 'Interesting', colorVar: 'var(--nag-interesting, #f1a91e)' },
  { symbol: '?!', label: 'Dubious', colorVar: 'var(--nag-dubious, #ee6b24)' },
  { symbol: '?', label: 'Mistake', colorVar: 'var(--nag-mistake, #df5353)' },
  { symbol: '??', label: 'Blunder', colorVar: 'var(--nag-blunder, #ba3529)' }
];

const POS_EVALS = [
  { symbol: '=', label: 'Equal position', colorVar: 'var(--nag-equal, #8a8a8a)' },
  { symbol: '∞', label: 'Unclear position', colorVar: 'var(--nag-unclear, #9333ea)' },
  { symbol: '⩲', label: 'White is slightly better', colorVar: 'var(--nag-w-slightly-better, #4f46e5)' },
  { symbol: '⩱', label: 'Black is slightly better', colorVar: 'var(--nag-b-slightly-better, #06b6d4)' },
  { symbol: '±', label: 'White is better', colorVar: 'var(--nag-w-better, #2563eb)' },
  { symbol: '∓', label: 'Black is better', colorVar: 'var(--nag-b-better, #0891b2)' },
  { symbol: '+-', label: 'White is winning', colorVar: 'var(--nag-w-winning, #1d4ed8)' },
  { symbol: '-+', label: 'Black is winning', colorVar: 'var(--nag-b-winning, #6d28d9)' }
];

const TAG_ICONS: Record<string, React.ReactNode> = {
  Event: <Tag size={14} />,
  White: <User size={14} />,
  Black: <User size={14} />,
  Players: <User size={14} />,
  Site: <MapPin size={14} />,
  Date: <Calendar size={14} />,
  Round: <PlayCircle size={14} />,
  Result: <CheckCircle size={14} />,
  ECO: <Box size={14} />,
  TimeControl: <Clock size={14} />,
  Termination: <XCircle size={14} />,
  WhiteElo: <Award size={14} />,
  BlackElo: <Award size={14} />,
  'FIDE Rating': <Award size={14} />
};

const STANDARD_TAGS = [
  'WHITE', 'WHITEELO', 'WHITETITLE', 'WHITETEAM', 'WHITEFIDEID', 
  'BLACK', 'BLACKELO', 'BLACKTITLE', 'BLACKTEAM', 'BLACKFIDEID', 
  'TIMECONTROL', 'DATE', 'RESULT', 'TERMINATION', 'SITE', 
  'EVENT', 'ROUND', 'BOARD', 'ANNOTATOR'
];

interface AnnotationsPanelProps {
  currentNode: MoveNode | undefined;
  studyTags: Record<string, string>;
  isCoach: boolean;
  onUpdateAnnotations: (nodeId: string, comment?: string, glyphs?: string[]) => void;
  onSetStudyTag: (key: string, value: string) => void;
  onRemoveStudyTag: (key: string) => void;
}

const formatTagKey = (key: string) => {
  // Special casing based on standard conventions
  const mapping: Record<string, string> = {
    'WHITE': 'White',
    'WHITEELO': 'White Elo',
    'WHITETITLE': 'White Title',
    'WHITETEAM': 'White Team',
    'WHITEFIDEID': 'White FIDE ID',
    'BLACK': 'Black',
    'BLACKELO': 'Black Elo',
    'BLACKTITLE': 'Black Title',
    'BLACKTEAM': 'Black Team',
    'BLACKFIDEID': 'Black FIDE ID',
    'TIMECONTROL': 'Time Control',
    'DATE': 'Date',
    'RESULT': 'Result',
    'TERMINATION': 'Termination',
    'SITE': 'Site',
    'EVENT': 'Event',
    'ROUND': 'Round',
    'BOARD': 'Board',
    'ANNOTATOR': 'Annotator'
  };
  return mapping[key] || key;
};

const TagRow = ({ tagKey, initialValue, isCoach, onSave, onRemove }: {
  tagKey: string;
  initialValue: string;
  isCoach: boolean;
  onSave: (k: string, v: string) => void;
  onRemove: (k: string) => void;
}) => {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  const handleSave = () => {
    if (value !== initialValue) {
      onSave(tagKey, value);
    }
  };

  return (
    <div className="ap-tag-row">
      <div className="ap-tag-key">
        {TAG_ICONS[tagKey] || <Tag size={14} />}
        <span>{formatTagKey(tagKey)}</span>
      </div>
      <div className="ap-tag-value">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
              handleSave();
            }
          }}
          disabled={!isCoach}
          placeholder="..."
        />
      </div>
      {isCoach && (
        <button className="ap-tag-delete" onClick={() => onRemove(tagKey)} title="Remove tag">
          <XCircle size={14} />
        </button>
      )}
    </div>
  );
};

export const AnnotationsPanel: React.FC<AnnotationsPanelProps> = ({
  currentNode,
  studyTags,
  isCoach,
  onUpdateAnnotations,
  onSetStudyTag,
  onRemoveStudyTag
}) => {
  const [activeTab, setActiveTab] = useState<'Tags' | 'Comments' | 'Annotations'>('Tags');
  const [commentText, setCommentText] = useState('');
  const [customTagKey, setCustomTagKey] = useState('');

  useEffect(() => {
    setCommentText(currentNode?.comment || '');
  }, [currentNode?.id, currentNode?.comment]);

  const handleSaveComment = () => {
    if (!currentNode || !isCoach) return;
    if (currentNode.comment !== commentText) {
      onUpdateAnnotations(currentNode.id, commentText, currentNode.glyphs);
    }
  };

  const toggleGlyph = (symbol: string) => {
    if (!currentNode || !isCoach) return;
    
    const currentGlyphs = currentNode.glyphs || [];
    const moveSymbols = MOVE_EVALS.map(g => g.symbol);
    const posSymbols = POS_EVALS.map(g => g.symbol);
    const isAlreadySelected = currentGlyphs.includes(symbol);

    let newGlyphs = [...currentGlyphs];

    if (moveSymbols.includes(symbol)) {
      newGlyphs = newGlyphs.filter(g => !moveSymbols.includes(g));
    } else if (posSymbols.includes(symbol)) {
      newGlyphs = newGlyphs.filter(g => !posSymbols.includes(g));
    }

    if (!isAlreadySelected) {
      newGlyphs.push(symbol);
    }

    onUpdateAnnotations(currentNode.id, currentNode.comment, newGlyphs);
  };

  const hasGlyph = (symbol: string) => (currentNode?.glyphs || []).includes(symbol);

  return (
    <div className="annotations-panel">
      <div className="ap-tabs">
        {(['Tags', 'Comments', 'Annotations'] as const).map(tab => (
          <button
            key={tab}
            className={`ap-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ap-content">
        {activeTab === 'Tags' && (
          <div className="ap-tags">
            <div className="ap-tags-list">
              {Object.keys(studyTags).map(key => (
                <TagRow 
                  key={key} 
                  tagKey={key} 
                  initialValue={studyTags[key]} 
                  isCoach={isCoach} 
                  onSave={onSetStudyTag} 
                  onRemove={onRemoveStudyTag} 
                />
              ))}
            </div>
            
            {isCoach && (
              <div className="ap-add-tag-section">
                <div className="ap-add-tag-controls">
                  <select 
                    value={customTagKey} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'NEW_CUSTOM_TAG') {
                        setCustomTagKey(val);
                      } else if (val) {
                        onSetStudyTag(val, '');
                        setCustomTagKey('');
                      }
                    }}
                    className="ap-tag-select"
                  >
                    <option value="" disabled>NEW TAG</option>
                    {STANDARD_TAGS.filter(t => !studyTags[t]).map(t => (
                      <option key={t} value={t}>{formatTagKey(t)}</option>
                    ))}
                    <option value="NEW_CUSTOM_TAG">Custom Tag...</option>
                  </select>
                  
                  {customTagKey === 'NEW_CUSTOM_TAG' && (
                    <input 
                      type="text" 
                      placeholder="Tag name..." 
                      className="ap-custom-tag-input"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val && !studyTags[val]) {
                            onSetStudyTag(val, '');
                            setCustomTagKey('');
                          }
                        } else if (e.key === 'Escape') {
                          setCustomTagKey('');
                        }
                      }}
                      onBlur={e => {
                         const val = e.target.value.trim();
                         if (val && !studyTags[val]) {
                           onSetStudyTag(val, '');
                         }
                         setCustomTagKey('');
                      }}
                      autoFocus
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Comments' && (
          <div className="ap-comments">
            {(!currentNode || currentNode.id === 'root') ? (
              <p className="ap-empty">Make a move to add comments.</p>
            ) : (
              <textarea
                placeholder={isCoach ? "Add a comment to this move..." : "No comments for this move."}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onBlur={handleSaveComment}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                disabled={!isCoach}
              />
            )}
          </div>
        )}

        {activeTab === 'Annotations' && (
          <div className="ap-annotations">
            {(!currentNode || currentNode.id === 'root') ? (
              <p className="ap-empty" title="Select a move first">Select a move first to add annotations.</p>
            ) : (
              <div className="ap-annotations-container">
                <div className="ap-grid-section">
                  <h4 className="ap-section-title">Move Evaluations</h4>
                  <div className="ap-nags-grid">
                    {MOVE_EVALS.map(g => {
                      const isActive = hasGlyph(g.symbol);
                      return (
                        <button
                          key={g.symbol}
                          className={`ap-nag-btn ${isActive ? 'active' : ''}`}
                          onClick={() => toggleGlyph(g.symbol)}
                          disabled={!isCoach}
                          title={g.label}
                          style={isActive ? { 
                            backgroundColor: `${g.colorVar.replace(')', ', 0.15)').replace('var(', 'rgba(')}`, 
                            borderColor: `${g.colorVar.replace(')', ', 0.4)').replace('var(', 'rgba(')}`,
                          } : {}}
                        >
                          <span 
                            className="ap-nag-symbol" 
                            style={isActive ? { color: g.colorVar } : {}}
                          >
                            {g.symbol}
                          </span>
                          <span className="ap-nag-label">{g.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ap-grid-section">
                  <h4 className="ap-section-title">Position Evaluations</h4>
                  <div className="ap-nags-grid">
                    {POS_EVALS.map(g => {
                      const isActive = hasGlyph(g.symbol);
                      return (
                        <button
                          key={g.symbol}
                          className={`ap-nag-btn ${isActive ? 'active' : ''}`}
                          onClick={() => toggleGlyph(g.symbol)}
                          disabled={!isCoach}
                          title={g.label}
                          style={isActive ? { 
                            backgroundColor: `${g.colorVar.replace(')', ', 0.15)').replace('var(', 'rgba(')}`, 
                            borderColor: `${g.colorVar.replace(')', ', 0.4)').replace('var(', 'rgba(')}`,
                          } : {}}
                        >
                          <span 
                            className="ap-nag-symbol" 
                            style={isActive ? { color: g.colorVar } : {}}
                          >
                            {g.symbol}
                          </span>
                          <span className="ap-nag-label">{g.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .annotations-panel {
          display: flex;
          flex-direction: column;
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          border-radius: 12px;
          overflow: hidden;
          height: 100%;
        }

        .ap-tabs {
          display: flex;
          border-bottom: 1px solid #eedcd0;
          background: rgba(74, 32, 24, 0.04);
        }

        .ap-tab {
          flex: 1;
          background: transparent;
          border: none;
          color: rgba(74, 32, 24, 0.6);
          padding: 10px 0;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .ap-tab:hover:not(:disabled) {
          color: #4a2018;
          background: rgba(74, 32, 24, 0.03);
        }

        .ap-tab.active {
          color: #4a2018;
          border-bottom-color: #c8854a;
          background: #ffffff;
        }

        .ap-content {
          padding: 12px;
          flex: 1;
          overflow-y: auto;
        }

        /* TAGS TAB */
        .ap-tags-list {
          display: flex;
          flex-direction: column;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          overflow: hidden;
        }

        .ap-tag-row {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #eedcd0;
          background: #ffffff;
        }
        
        .ap-tag-row:nth-child(even) {
          background: rgba(74, 32, 24, 0.02);
        }
        
        .ap-tag-row:last-child {
          border-bottom: none;
        }

        .ap-tag-key {
          width: 130px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(74, 32, 24, 0.8);
          font-weight: 600;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .ap-tag-value {
          flex: 1;
        }

        .ap-tag-value input {
          width: 100%;
          background: transparent;
          border: none;
          color: #4a2018;
          font-size: 0.85rem;
          outline: none;
        }

        .ap-tag-delete {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: rgba(74, 32, 24, 0.4);
          cursor: pointer;
          padding: 4px;
          margin-left: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .ap-tag-delete:hover {
          color: #ef4444;
          background: rgba(74, 32, 24, 0.05);
        }

        .ap-add-tag-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #eedcd0;
        }

        .ap-add-tag-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ap-tag-select, .ap-custom-tag-input {
          background: #ffffff;
          border: 1px solid #eedcd0;
          color: #4a2018;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 0.85rem;
          outline: none;
          min-width: 140px;
        }

        .ap-tag-select:focus, .ap-custom-tag-input:focus {
          border-color: #c8854a;
        }

        .ap-tag-select option {
          background: #ffffff;
          color: #4a2018;
        }

        .ap-add-tag-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #eedcd0;
          color: #4a2018;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .ap-add-tag-btn:hover:not(:disabled) {
          background: rgba(74, 32, 24, 0.05);
        }

        .ap-add-tag-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* COMMENTS TAB */
        .ap-comments textarea {
          width: 100%;
          min-height: 120px;
          background: #ffffff;
          border: 1px solid #eedcd0;
          color: #4a2018;
          padding: 10px;
          border-radius: 6px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.9rem;
        }
        
        .ap-comments textarea:focus {
          outline: none;
          border-color: #c8854a;
        }
        
        .ap-comments textarea:disabled {
          opacity: 0.8;
          cursor: not-allowed;
          background: rgba(74, 32, 24, 0.02);
          border-color: #eedcd0;
          color: rgba(74, 32, 24, 0.6);
        }

        .ap-empty {
          color: rgba(74, 32, 24, 0.5);
          text-align: center;
          margin-top: 20px;
          font-size: 0.9rem;
        }

        /* ANNOTATIONS TAB */
        .ap-annotations-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ap-grid-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ap-section-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(74, 32, 24, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 4px 0;
          border-bottom: 1px solid #eedcd0;
          padding-bottom: 4px;
        }

        .ap-nags-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .ap-nag-btn {
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          padding: 8px 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.1s;
        }

        .ap-nag-btn:hover:not(:disabled) {
          background: rgba(74, 32, 24, 0.03);
        }

        .ap-nag-symbol {
          font-size: 1.25rem;
          font-weight: 800;
          color: #4a2018;
        }

        .ap-nag-label {
          font-size: 0.7rem;
          color: rgba(74, 32, 24, 0.6);
          text-align: center;
          line-height: 1.1;
        }

        .ap-nag-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
