import { Chess as BaseChess } from 'chess.js';

export * from 'chess.js';

export const GAMIFIED_ITEMS: Record<string, { name: string; emoji: string; category: string; type: 'target' | 'block' }> = {
  // Food targets
  ch: { name: 'Chocolate', emoji: '🍫', category: 'Food', type: 'target' },
  ap: { name: 'Apple', emoji: '🍎', category: 'Food', type: 'target' },
  do: { name: 'Donut', emoji: '🍩', category: 'Food', type: 'target' },
  bu: { name: 'Burger', emoji: '🍔', category: 'Food', type: 'target' },
  st: { name: 'Strawberry', emoji: '🍓', category: 'Food', type: 'target' },
  co: { name: 'Cookie', emoji: '🍪', category: 'Food', type: 'target' },
  pz: { name: 'Pizza', emoji: '🍕', category: 'Food', type: 'target' },
  ca: { name: 'Candy', emoji: '🍬', category: 'Food', type: 'target' },

  // Toys targets
  tb: { name: 'Teddy', emoji: '🧸', category: 'Toys', type: 'target' },
  bl: { name: 'Balloon', emoji: '🎈', category: 'Toys', type: 'target' },
  ki: { name: 'Kite', emoji: '🪁', category: 'Toys', type: 'target' },
  tr: { name: 'Train', emoji: '🚂', category: 'Toys', type: 'target' },

  // Animals targets
  dg: { name: 'Dog', emoji: '🐶', category: 'Animals', type: 'target' },
  ct: { name: 'Cat', emoji: '🐱', category: 'Animals', type: 'target' },
  rbt: { name: 'Rabbit', emoji: '🐰', category: 'Animals', type: 'target' },
  pnd: { name: 'Panda', emoji: '🐼', category: 'Animals', type: 'target' },
  fx: { name: 'Fox', emoji: '🦊', category: 'Animals', type: 'target' },
  frg: { name: 'Frog', emoji: '🐸', category: 'Animals', type: 'target' },
  brd: { name: 'Bird', emoji: '🐦', category: 'Animals', type: 'target' },

  // Rewards targets
  str: { name: 'Star', emoji: '⭐', category: 'Rewards', type: 'target' },
  trphy: { name: 'Trophy', emoji: '🏆', category: 'Rewards', type: 'target' },
  mdl: { name: 'Medal', emoji: '🥇', category: 'Rewards', type: 'target' },
  gm: { name: 'Gem', emoji: '💎', category: 'Rewards', type: 'target' },
  crn: { name: 'Crown', emoji: '👑', category: 'Rewards', type: 'target' },
  gft: { name: 'Gift', emoji: '🎁', category: 'Rewards', type: 'target' },

  // Emoji targets
  em_smile: { name: 'Smile', emoji: '😊', category: 'Emoji', type: 'target' },
  em_heart: { name: 'Heart', emoji: '❤️', category: 'Emoji', type: 'target' },
  em_party: { name: 'Party', emoji: '🎉', category: 'Emoji', type: 'target' },
  em_rocket: { name: 'Rocket', emoji: '🚀', category: 'Emoji', type: 'target' },
  em_unicorn: { name: 'Unicorn', emoji: '🦄', category: 'Emoji', type: 'target' },
  em_dino: { name: 'Dino', emoji: '🦖', category: 'Emoji', type: 'target' },
  em_ghost: { name: 'Ghost', emoji: '👻', category: 'Emoji', type: 'target' },
  em_alien: { name: 'Alien', emoji: '👽', category: 'Emoji', type: 'target' },

  // Blocks
  brkwl: { name: 'Brick Wall', emoji: '🧱', category: 'Blocks', type: 'block' },
  rdbar: { name: 'Road Barrier', emoji: '🚧', category: 'Blocks', type: 'block' },
  rck: { name: 'Rock', emoji: '🪨', category: 'Blocks', type: 'block' },
  fnce: { name: 'Fence', emoji: '🪵', category: 'Blocks', type: 'block' },
  tre: { name: 'Tree', emoji: '🌳', category: 'Blocks', type: 'block' },
  pit: { name: 'Pit', emoji: '🕳️', category: 'Blocks', type: 'block' },
  wtr: { name: 'Water', emoji: '🌊', category: 'Blocks', type: 'block' }
};


export function parseGamifiedFen(fenStr: string) {
  const [cleanFen, ...extra] = fenStr.split('|');
  const targets: Record<string, string> = {};
  const blocks: Record<string, string> = {};

  for (const part of extra) {
    if (part.startsWith('targets:')) {
      const items = part.slice(8).split(',');
      for (const item of items) {
        if (!item) continue;
        const [sq, code] = item.split('=');
        if (sq && code) targets[sq] = code;
      }
    } else if (part.startsWith('blocks:')) {
      const items = part.slice(7).split(',');
      for (const item of items) {
        if (!item) continue;
        const [sq, code] = item.split('=');
        if (sq && code) blocks[sq] = code;
      }
    }
  }

  return { cleanFen, targets, blocks };
}

export function serializeGamifiedFen(cleanFen: string, targets: Record<string, string>, blocks: Record<string, string>): string {
  const parts = [cleanFen];
  
  const targetPairs = Object.entries(targets)
    .filter(([_, code]) => !!code)
    .map(([sq, code]) => `${sq}=${code}`)
    .sort()
    .join(',');
  if (targetPairs) {
    parts.push(`targets:${targetPairs}`);
  }
  
  const blockPairs = Object.entries(blocks)
    .filter(([_, code]) => !!code)
    .map(([sq, code]) => `${sq}=${code}`)
    .sort()
    .join(',');
  if (blockPairs) {
    parts.push(`blocks:${blockPairs}`);
  }
  
  return parts.join('|');
}

function squareToCoords(sq: string) {
  return {
    col: sq.charCodeAt(0) - 97,
    row: parseInt(sq[1], 10) - 1
  };
}

function coordsToSquare(col: number, row: number) {
  return String.fromCharCode(97 + col) + (row + 1);
}

function isPathBlocked(from: string, to: string, blocks: Record<string, string>): boolean {
  if (blocks[to]) return true;

  const f = squareToCoords(from);
  const t = squareToCoords(to);

  const dCol = t.col - f.col;
  const dRow = t.row - f.row;

  const absDCol = Math.abs(dCol);
  const absDRow = Math.abs(dRow);

  // Knight jump has no intermediate squares
  if (absDCol * absDRow === 2) {
    return false;
  }

  // Vertical movement
  if (dCol === 0) {
    const step = dRow > 0 ? 1 : -1;
    for (let r = f.row + step; r !== t.row; r += step) {
      const sq = coordsToSquare(f.col, r);
      if (blocks[sq]) return true;
    }
  }
  // Horizontal movement
  else if (dRow === 0) {
    const step = dCol > 0 ? 1 : -1;
    for (let c = f.col + step; c !== t.col; c += step) {
      const sq = coordsToSquare(c, f.row);
      if (blocks[sq]) return true;
    }
  }
  // Diagonal movement
  else if (absDCol === absDRow) {
    const stepCol = dCol > 0 ? 1 : -1;
    const stepRow = dRow > 0 ? 1 : -1;
    for (let i = 1; i < absDCol; i++) {
      const sq = coordsToSquare(f.col + i * stepCol, f.row + i * stepRow);
      if (blocks[sq]) return true;
    }
  }

  return false;
}

function preprocessFen(fen: string): { cleanFen: string; addedKings: { white?: string; black?: string } } {
  if (!fen) return { cleanFen: fen, addedKings: {} };

  const parts = fen.split(' ');
  const piecePlacement = parts[0];
  const rows = piecePlacement.split('/');

  // Parse rows into an 8x8 grid
  const board: string[][] = [];
  let hasWhiteKing = false;
  let hasBlackKing = false;

  for (let r = 0; r < 8; r++) {
    const rowStr = rows[r] || '8';
    const boardRow: string[] = [];
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (/[1-8]/.test(char)) {
        const num = parseInt(char, 10);
        for (let j = 0; j < num; j++) {
          boardRow.push('');
        }
      } else {
        boardRow.push(char);
        if (char === 'K') hasWhiteKing = true;
        if (char === 'k') hasBlackKing = true;
      }
    }
    board.push(boardRow);
  }

  // Strip pawns from rank 8 (board row 0) and rank 1 (board row 7)
  // chess.js rejects any FEN that has pawns on those rows
  let removedIllegalPawns = false;
  for (const edgeRow of [0, 7]) {
    for (let c = 0; c < 8; c++) {
      const piece = board[edgeRow][c];
      if (piece === 'P' || piece === 'p') {
        board[edgeRow][c] = '';
        removedIllegalPawns = true;
      }
    }
  }

  const addedKings: { white?: string; black?: string } = {};

  if (hasWhiteKing && hasBlackKing && !removedIllegalPawns) {
    return { cleanFen: fen, addedKings };
  }

  // Find empty squares
  const emptySquares: { r: number; c: number }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === '') {
        emptySquares.push({ r, c });
      }
    }
  }

  if (!hasWhiteKing && emptySquares.length > 0) {
    const sq = emptySquares.shift()!;
    board[sq.r][sq.c] = 'K';
    addedKings.white = coordsToSquare(sq.c, 7 - sq.r);
  }

  if (!hasBlackKing && emptySquares.length > 0) {
    const sq = emptySquares.pop()!;
    board[sq.r][sq.c] = 'k';
    addedKings.black = coordsToSquare(sq.c, 7 - sq.r);
  }

  // Rebuild the piece placement string
  const newRows = board.map(boardRow => {
    let rowStr = '';
    let emptyCount = 0;
    for (let c = 0; c < 8; c++) {
      if (boardRow[c] === '') {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        rowStr += boardRow[c];
      }
    }
    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    return rowStr;
  });

  parts[0] = newRows.join('/');
  return {
    cleanFen: parts.join(' '),
    addedKings
  };
}


function stripSquaresFromFen(cleanFen: string, squaresToStrip: string[]): string {
  const parts = cleanFen.split(' ');
  const rows = parts[0].split('/');

  // Parse rows into an 8x8 grid
  const board: string[][] = [];
  for (let r = 0; r < 8; r++) {
    const rowStr = rows[r] || '8';
    const boardRow: string[] = [];
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (/[1-8]/.test(char)) {
        const num = parseInt(char, 10);
        for (let j = 0; j < num; j++) {
          boardRow.push('');
        }
      } else {
        boardRow.push(char);
      }
    }
    board.push(boardRow);
  }

  // Clear the squares
  for (const sq of squaresToStrip) {
    if (!sq) continue;
    const { col, row } = squareToCoords(sq);
    const r = 7 - row;
    if (r >= 0 && r < 8 && col >= 0 && col < 8) {
      board[r][col] = '';
    }
  }

  // Rebuild the piece placement string
  const newRows = board.map(boardRow => {
    let rowStr = '';
    let emptyCount = 0;
    for (let c = 0; c < 8; c++) {
      if (boardRow[c] === '') {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        rowStr += boardRow[c];
      }
    }
    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    return rowStr;
  });

  parts[0] = newRows.join('/');
  return parts.join(' ');
}

function findSafeDummyKingSquares(querySq: string, board: any[][]): { white: string; black: string } {
  const q = squareToCoords(querySq);
  const safeSquares: { r: number; c: number }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      // Must be empty
      if (board[r][c] !== null) continue;

      // Must not share rank, file, or diagonal
      if (c === q.col) continue;
      const rank = 7 - r;
      if (rank === q.row) continue;
      if (Math.abs(c - q.col) === Math.abs(rank - q.row)) continue;

      safeSquares.push({ r, c });
    }
  }

  // We want to pick two safe squares that are not adjacent to each other
  let whiteSq: { r: number; c: number } | undefined;
  let blackSq: { r: number; c: number } | undefined;

  if (safeSquares.length > 0) {
    // Pick the first safe square for white king
    whiteSq = safeSquares[0];

    // Find the first safe square for black king that is not adjacent to whiteSq
    for (let i = 1; i < safeSquares.length; i++) {
      const sq = safeSquares[i];
      if (Math.abs(sq.r - whiteSq.r) > 1 || Math.abs(sq.c - whiteSq.c) > 1) {
        blackSq = sq;
        break;
      }
    }
  }

  // Fallbacks if we couldn't find ideal safe squares
  if (!whiteSq) {
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null && (r !== q.row || c !== q.col)) {
          empty.push({ r, c });
        }
      }
    }
    whiteSq = empty[0] || { r: 0, c: 0 };
    blackSq = empty[1] || { r: 7, c: 7 };
  } else if (!blackSq) {
    blackSq = safeSquares[1] || { r: (whiteSq.r + 4) % 8, c: (whiteSq.c + 4) % 8 };
  }

  return {
    white: coordsToSquare(whiteSq.c, 7 - whiteSq.r),
    black: coordsToSquare(blackSq.c, 7 - blackSq.r)
  };
}

// @ts-ignore
export class Chess extends BaseChess {
  public targets: Record<string, string>;
  public blocks: Record<string, string>;
  private targetsHistory: Record<string, string>[];
  private addedKings: { white?: string; black?: string };

  constructor(fen?: string) {
    let cleanFenToLoad: string | undefined;
    let targetsToSet: Record<string, string> = {};
    let blocksToSet: Record<string, string> = {};
    let finalAddedKings: { white?: string; black?: string } = {};

    if (fen) {
      const clean = fen.includes('|') ? parseGamifiedFen(fen) : null;
      const cleanFen = clean ? clean.cleanFen : fen;
      const preprocess = preprocessFen(cleanFen);
      cleanFenToLoad = preprocess.cleanFen;
      finalAddedKings = preprocess.addedKings;
      targetsToSet = clean ? clean.targets : {};
      blocksToSet = clean ? clean.blocks : {};
    }

    super(cleanFenToLoad);
    this.targets = targetsToSet;
    this.blocks = blocksToSet;
    this.targetsHistory = [];
    this.addedKings = finalAddedKings;
    this.updateForcedTurn();
  }

  public fen(): string {
    const rawCleanFen = super.fen();
    const squaresToStrip: string[] = [];
    if (this.addedKings?.white) squaresToStrip.push(this.addedKings.white);
    if (this.addedKings?.black) squaresToStrip.push(this.addedKings.black);

    const cleanFen = squaresToStrip.length > 0
      ? stripSquaresFromFen(rawCleanFen, squaresToStrip)
      : rawCleanFen;

    return serializeGamifiedFen(cleanFen, this.targets, this.blocks);
  }

  public load(fen: string): void {
    let cleanFenToLoad = fen;
    let targetsToSet: Record<string, string> = {};
    let blocksToSet: Record<string, string> = {};

    if (fen && fen.includes('|')) {
      const { cleanFen, targets, blocks } = parseGamifiedFen(fen);
      cleanFenToLoad = cleanFen;
      targetsToSet = targets;
      blocksToSet = blocks;
    } else {
      targetsToSet = {};
      blocksToSet = {};
    }

    const preprocess = preprocessFen(cleanFenToLoad);
    super.load(preprocess.cleanFen);
    this.targets = targetsToSet;
    this.blocks = blocksToSet;
    this.addedKings = preprocess.addedKings;
    this.targetsHistory = [];
    this.updateForcedTurn();
  }

  public clear(): void {
    super.clear();
    this.targets = {};
    this.blocks = {};
    this.addedKings = {};
    this.targetsHistory = [];
  }

  public override moves(options?: any): any[] {
    const activeColor = this.turn();
    const opponentColor = activeColor === 'w' ? 'b' : 'w';

    // If no specific square is requested, generate moves for all squares containing active pieces
    if (!options?.square) {
      const board = this.board();
      let allMoves: any[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.color === activeColor) {
            const sq = coordsToSquare(c, 7 - r);
            // Skip dummy kings
            if (sq === this.addedKings?.white || sq === this.addedKings?.black) {
              continue;
            }
            const ms = this.moves({ ...options, square: sq });
            allMoves = allMoves.concat(ms);
          }
        }
      }
      return allMoves;
    }

    const querySq = options.square;

    // Temporarily remove persistent dummy kings so they don't block sliding moves or cause invalid check constraints
    if (this.addedKings?.white) {
      this.remove(this.addedKings.white as any);
    }
    if (this.addedKings?.black) {
      this.remove(this.addedKings.black as any);
    }

    // Find safe squares for dummy kings for the queried piece to prevent blocking sliding lines
    const currentBoard = this.board();
    const safeKings = findSafeDummyKingSquares(querySq, currentBoard);

    // Place the dummy kings on the safe squares
    this.put({ type: 'k', color: 'w' }, safeKings.white as any);
    this.put({ type: 'k', color: 'b' }, safeKings.black as any);

    // 1. Find pawns of active color
    const board = this.board();
    const pawns: string[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'p' && piece.color === activeColor) {
          const sq = String.fromCharCode(97 + c) + (8 - r);
          pawns.push(sq);
        }
      }
    }

    // 2. Identify candidate targets that can be captured diagonally by pawns
    const pawnDiagonals = new Set<string>();
    for (const pawnSq of pawns) {
      const col = pawnSq.charCodeAt(0) - 97;
      const rank = parseInt(pawnSq[1], 10);
      const targetRanks = activeColor === 'w' ? [rank + 1] : [rank - 1];
      for (const r of targetRanks) {
        if (r >= 1 && r <= 8) {
          const c1 = col - 1;
          const c2 = col + 1;
          if (c1 >= 0) pawnDiagonals.add(String.fromCharCode(97 + c1) + r);
          if (c2 <= 7) pawnDiagonals.add(String.fromCharCode(97 + c2) + r);
        }
      }
    }

    // 3. For each candidate diagonal square that actually has a target, temporarily place an opponent pawn
    const activeTargets = Object.keys(this.targets).filter(sq => pawnDiagonals.has(sq));
    for (const targetSq of activeTargets) {
      this.put({ type: 'p', color: opponentColor }, targetSq as any);
    }

    // 4. Get standard moves
    const standardMoves = super.moves({
      verbose: true,
      square: options?.square,
      piece: options?.piece
    });

    // 5. Cleanup the temporarily placed opponent pieces
    for (const targetSq of activeTargets) {
      this.remove(targetSq as any);
    }

    // Remove the temporary dummy kings from safe squares
    this.remove(safeKings.white as any);
    this.remove(safeKings.black as any);

    // Restore persistent dummy kings to the board
    if (this.addedKings?.white) {
      this.put({ type: 'k', color: 'w' }, this.addedKings.white as any);
    }
    if (this.addedKings?.black) {
      this.put({ type: 'k', color: 'b' }, this.addedKings.black as any);
    }

    // 6. Filter moves:
    //    - Remove any move that is blocked by our blocks
    //    - If options.square is specified, ensure it matches
    const filteredVerboseMoves = standardMoves.filter((move: any) => {
      if (this.blocks[move.to]) return false; // cannot land on block
      if (isPathBlocked(move.from, move.to, this.blocks)) return false;
      return true;
    });

    if (options?.verbose) {
      return filteredVerboseMoves;
    } else {
      return filteredVerboseMoves.map((m: any) => m.san);
    }
  }

  public move(move: any, options?: { strict?: boolean }): any {
    // Generate verbose moves to validate
    const verboseMoves = this.moves({ verbose: true });

    // Find the matching move
    let matchedMove: any = null;
    if (typeof move === 'string') {
      matchedMove = verboseMoves.find((m: any) => m.san === move);
    } else if (typeof move === 'object' && move !== null) {
      matchedMove = verboseMoves.find((m: any) => {
        const fromMatch = m.from === move.from;
        const toMatch = m.to === move.to;
        const promoMatch = !move.promotion || !m.promotion || m.promotion === move.promotion;
        return fromMatch && toMatch && promoMatch;
      });
    }

    if (!matchedMove) {
      throw new Error(`Illegal move: ${JSON.stringify(move)}`);
    }

    const toSq = matchedMove.to;
    const targetCode = this.targets[toSq];

    this.targetsHistory.push({ ...this.targets });

    // Relocate persistent dummy king if the move lands on it
    let relocatedKing: 'white' | 'black' | null = null;
    if (toSq === this.addedKings?.white) {
      this.remove(toSq as any);
      relocatedKing = 'white';
    } else if (toSq === this.addedKings?.black) {
      this.remove(toSq as any);
      relocatedKing = 'black';
    }

    let resultMove: any = null;
    if (targetCode) {
      const activeColor = this.turn();
      const opponentColor = activeColor === 'w' ? 'b' : 'w';

      // Temporarily place opponent piece to let chess.js do capture move
      this.put({ type: 'p', color: opponentColor }, toSq);
      resultMove = super.move(matchedMove);

      // Remove target from list
      delete this.targets[toSq];
    } else {
      resultMove = super.move(matchedMove);
    }

    // Place the relocated king on a new empty square
    if (relocatedKing) {
      const board = this.board();
      let newKingSq = '';
      let found = false;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c] === null) {
            const sq = coordsToSquare(c, 7 - r);
            if (sq !== toSq) {
              newKingSq = sq;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }

      if (newKingSq) {
        if (relocatedKing === 'white') {
          this.put({ type: 'k', color: 'w' }, newKingSq as any);
          this.addedKings.white = newKingSq;
        } else {
          this.put({ type: 'k', color: 'b' }, newKingSq as any);
          this.addedKings.black = newKingSq;
        }
      }
    }

    this.updateForcedTurn();

    return resultMove;
  }

  public undo(): any {
    const undone = super.undo();
    if (undone) {
      const prevTargets = this.targetsHistory.pop();
      if (prevTargets) {
        this.targets = prevTargets;
      }
      this.updateForcedTurn();
    }
    return undone;
  }

  private updateForcedTurn(): void {
    const board = this.board();
    let whiteCount = 0;
    let blackCount = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const sq = coordsToSquare(c, 7 - r);
          // Skip if this is an added dummy king
          if (piece.type === 'k') {
            if (piece.color === 'w' && sq === this.addedKings?.white) {
              continue;
            }
            if (piece.color === 'b' && sq === this.addedKings?.black) {
              continue;
            }
          }
          if (piece.color === 'w') {
            whiteCount++;
          } else {
            blackCount++;
          }
        }
      }
    }

    if (whiteCount > 0 && blackCount === 0) {
      (this as any)._turn = 'w';
    } else if (blackCount > 0 && whiteCount === 0) {
      (this as any)._turn = 'b';
    }
  }

  // @ts-ignore
  _isKingAttacked(color: any): boolean {
    const isGamified = 
      Object.keys(this.targets || {}).length > 0 || 
      Object.keys(this.blocks || {}).length > 0 || 
      (this.addedKings && (this.addedKings.white || this.addedKings.black));

    if (isGamified) {
      return false;
    }
    // @ts-ignore
    return super._isKingAttacked(color);
  }
}
