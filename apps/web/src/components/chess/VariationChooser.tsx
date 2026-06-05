import React, { useEffect, useRef } from 'react';

export interface VariationData {
  id: string;
  san: string;
}

interface VariationChooserProps {
  variations: VariationData[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onChoose: (id: string) => void;
}

export const VariationChooser: React.FC<VariationChooserProps> = ({
  variations,
  selectedIndex,
  onSelect,
  onChoose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const selectedEl = containerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (variations.length <= 1) return null;

  return (
    <div className="variation-list-container">
      <div className="variation-list-header">Choose Move</div>
      <div className="variation-list-grid" ref={containerRef}>
        {variations.map((v, i) => (
          <button
            key={v.id}
            className={`variation-list-btn ${i === selectedIndex ? 'selected' : ''}`}
            onMouseEnter={() => onSelect(i)}
            onClick={(e) => {
              e.stopPropagation();
              onChoose(v.id);
            }}
          >
            {v.san}
          </button>
        ))}
      </div>
      <style>{`
        .variation-list-container {
          margin-top: auto;
          background: #fdf5ea;
          border-top: 1px solid #eedcd0;
          display: flex;
          flex-direction: column;
          animation: slide-up 0.2s ease-out;
        }
        .variation-list-header {
          font-size: 0.75rem;
          color: #c8854a;
          padding: 6px 12px;
          border-bottom: 1px solid #eedcd0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .variation-list-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-height: 150px;
          overflow-y: auto;
          background: #fdf5ea;
        }
        .variation-list-grid::-webkit-scrollbar {
          width: 4px;
        }
        .variation-list-grid::-webkit-scrollbar-thumb {
          background: #eedcd0;
        }
        .variation-list-btn {
          background: transparent;
          border: none;
          border-right: 1px solid #eedcd0;
          border-bottom: 1px solid #eedcd0;
          color: #4a2018;
          padding: 8px 12px;
          text-align: left;
          font-family: inherit;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.1s;
        }
        .variation-list-btn:hover {
          background: rgba(200, 133, 74, 0.05);
          color: #c8854a;
        }
        .variation-list-btn.selected {
          background: #c8854a;
          color: #fff;
          font-weight: 500;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

