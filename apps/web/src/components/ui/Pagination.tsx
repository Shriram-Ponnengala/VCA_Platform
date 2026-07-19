import React, { useState } from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIdx?: number;
  endIdx?: number;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  startIdx,
  endIdx,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const [jumpValue, setJumpValue] = useState('');
  const [jumpError, setJumpError] = useState(false);

  const handleJumpSubmit = () => {
    const pageNum = parseInt(jumpValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpValue('');
      setJumpError(false);
    } else {
      setJumpError(true);
      setTimeout(() => setJumpError(false), 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleJumpSubmit();
  };

  // Generate page numbers: 5 numbered boxes:
  // always show first (1) + last + 3 centered on currentPage, with ellipses.
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    // Near start: 1 2 3 4 5 … last
    pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
  } else if (currentPage >= totalPages - 2) {
    // Near end: 1 … last-4 last-3 last-2 last-1 last
    pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    // Middle: 1 … current-1 current current+1 … last  (5 numbered boxes)
    pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
  }

  const showReadout =
    startIdx !== undefined &&
    endIdx !== undefined &&
    totalItems !== undefined;

  return (
    <div className={styles.paginationCard}>

      {/* ── Row 1: Page buttons (centered) ── */}
      <div className={styles.paginationRow}>
        <button
          className={styles.navBtn}
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="First page"
        >«</button>
        <button
          className={styles.navBtn}
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          title="Previous page"
        >‹</button>

        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`e-${idx}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={`p-${p}`}
              className={`${styles.pageBtn} ${currentPage === p ? styles.active : ''}`}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          className={styles.navBtn}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          title="Next page"
        >›</button>
        <button
          className={styles.navBtn}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
        >»</button>
      </div>

      {/* ── Divider ── */}
      <div className={styles.divider} />

      {/* ── Row 2: count (left) + jump (right) ── */}
      <div className={styles.footerRow}>
        {showReadout && (
          <span className={styles.readout}>
            {startIdx}–{endIdx} of {totalItems}
          </span>
        )}

        <div className={styles.jumpGroup}>
          <span className={styles.jumpLabel}>Jump to page</span>
          <input
            type="number"
            className={`${styles.jumpInput} ${jumpError ? styles.jumpInputError : ''}`}
            value={jumpValue}
            onChange={(e) => { setJumpValue(e.target.value); setJumpError(false); }}
            onKeyDown={handleKeyDown}
            min={1}
            max={totalPages}
            placeholder="#"
            title={`Enter page (1–${totalPages})`}
          />
          <button className={styles.goBtn} onClick={handleJumpSubmit}>Go</button>
        </div>
      </div>

    </div>
  );
}
