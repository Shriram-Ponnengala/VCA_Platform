import { parse } from '@mliebelt/pgn-parser';
import { Chess } from 'chess.js';
import { MoveNode } from '@vca/types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function sanitizeFen(fen: string): string {
  if (!fen) return START_FEN;
  const parts = fen.trim().split(/\s+/);
  const board = parts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  const color = parts[1] === 'w' || parts[1] === 'b' ? parts[1] : 'w';
  const castling = parts[2] || '-';
  const ep = parts[3] || '-';
  let halfmove = parts[4] || '0';
  if (isNaN(parseInt(halfmove, 10)) || parseInt(halfmove, 10) < 0) {
    halfmove = '0';
  }
  let fullmove = parts[5] || '1';
  const fullmoveInt = parseInt(fullmove, 10);
  if (isNaN(fullmoveInt) || fullmoveInt < 1) {
    fullmove = '1';
  }
  return [board, color, castling, ep, halfmove, fullmove].join(' ');
}

export function nullMoveFen(fen: string): string {
  const parts = sanitizeFen(fen).split(' ');
  const board = parts[0];
  const color = parts[1];
  const castling = parts[2];
  const newColor = color === 'w' ? 'b' : 'w';
  const newFull = color === 'b' ? String(Number(parts[5] || 1) + 1) : (parts[5] || '1');
  return [board, newColor, castling, '-', '0', newFull].join(' ');
}

export function splitPgn(pgnText: string): string[] {
  const parts = pgnText.split(/(?:\r?\n){2,}(?=\[[a-zA-Z]+)/g);
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

export function parsePgnToMoveTree(pgnText: string): { 
  nodes: Record<string, MoveNode>; 
  rootId: string; 
  tags?: Record<string, string>;
  chapterName?: string;
} {
  let parsed: any;
  try {
    parsed = parse(pgnText, { startRule: 'game' });
  } catch (e) {
    console.error('Error parsing PGN:', e);
    // Return empty root node if parsing fails
    const rootNode: MoveNode = {
      id: 'root',
      fen: START_FEN,
      san: '',
      parentId: null,
      children: [],
      moveNumber: 0,
      turn: 'b',
      arrows: [],
    };
    return { nodes: { root: rootNode }, rootId: 'root' };
  }

  const startFen = sanitizeFen(parsed.tags?.FEN || START_FEN);
  const nodes: Record<string, MoveNode> = {};

  // Extract chapter name based on preferences
  let chapterName = 'Untitled';
  if (parsed.tags?.ChapterName && parsed.tags.ChapterName !== '?') {
    chapterName = parsed.tags.ChapterName;
  } else {
    const white = parsed.tags?.White;
    const black = parsed.tags?.Black;
    if (white && white !== '?' && black && black !== '?') {
      chapterName = `${white} vs ${black}`;
    } else {
      const eventTag = parsed.tags?.Event || '';
      if (eventTag.includes(':')) {
        chapterName = eventTag.split(':').slice(1).join(':').trim();
      } else if (eventTag.trim() && eventTag.trim() !== '?' && eventTag.trim() !== 'Untitled') {
        chapterName = eventTag.trim();
      }
    }
  }

  // Initialize root
  const rootNode: MoveNode = {
    id: 'root',
    fen: startFen,
    san: '',
    parentId: null,
    children: [],
    moveNumber: 0,
    turn: 'b',
    arrows: [],
    comment: parsed.tags?.comment || undefined,
  };
  nodes['root'] = rootNode;

  let nodeCounter = 0;
  const generateId = () => `node_${++nodeCounter}`;

  function walk(
    parsedMoves: any[],
    parentId: string,
    currentFen: string
  ): string[] {
    const childrenIds: string[] = [];
    let prevFen = currentFen;
    let prevParentId = parentId;

    for (let i = 0; i < parsedMoves.length; i++) {
      const pm = parsedMoves[i];
      const san = pm.notation?.notation || '';
      if (!san) continue;

      const turn = pm.turn; // 'w' | 'b'
      const moveNumber = pm.moveNumber;

      let chess: Chess;
      try {
        chess = new Chess(sanitizeFen(prevFen));
      } catch (e) {
        console.warn('Failed to parse FEN in PGN parser walk:', prevFen, e);
        try {
          chess = new Chess(START_FEN);
        } catch (_) {
          chess = new Chess();
        }
      }

      let moveObj: any = null;
      let fen = prevFen;
      let isNull = false;

      if (san === '--' || san === 'Z0' || san === '0000' || san === 'pass' || san === 'null') {
        isNull = true;
        fen = nullMoveFen(prevFen);
      } else {
        try {
          moveObj = chess.move(san);
          fen = chess.fen();
        } catch (e) {
          console.warn('Invalid/illegal move in PGN parser walk:', san, e);
          isNull = true;
          fen = nullMoveFen(prevFen);
        }
      }

      const nodeId = generateId();

      // Comments can be in commentAfter or commentDiag or commentBefore
      const comment = pm.commentAfter || pm.commentDiag?.commentAfter || pm.commentDiag?.commentBefore || undefined;

      const node: MoveNode = {
        id: nodeId,
        fen,
        san: isNull ? '--' : san,
        isNull,
        parentId: prevParentId,
        children: [],
        moveNumber: moveNumber || (nodes[prevParentId] ? nodes[prevParentId].moveNumber + (turn === 'w' ? 1 : 0) : 1),
        turn,
        from: moveObj?.from,
        to: moveObj?.to,
        arrows: [],
        comment,
        glyphs: pm.nag || [],
      };

      nodes[nodeId] = node;
      if (nodes[prevParentId]) {
        nodes[prevParentId].children.push(nodeId);
      }
      childrenIds.push(nodeId);

      // Handle variations
      if (pm.variations && pm.variations.length > 0) {
        for (const variation of pm.variations) {
          // A variation branches off from prevParentId (using the FEN before this move was made)
          walk(variation, prevParentId, prevFen);
        }
      }

      prevFen = fen;
      prevParentId = nodeId;
    }

    return childrenIds;
  }

  if (parsed.moves && parsed.moves.length > 0) {
    walk(parsed.moves, 'root', startFen);
  }

  return { nodes, rootId: 'root', chapterName, tags: parsed.tags };
}

export function buildPgnFromMoveTree(
  nodes: Record<string, MoveNode>,
  rootId: string = 'root',
  tags: Record<string, string> = {}
): string {
  let pgn = '';
  const defaultTags = {
    Event: 'VCA Study',
    Site: 'VCA Chess Platform',
    Date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    Round: '1',
    White: '?',
    Black: '?',
    Result: '*',
    ...tags,
  };

  for (const [key, val] of Object.entries(defaultTags)) {
    pgn += `[${key} "${val}"]\n`;
  }
  pgn += '\n';

  function traverse(nodeId: string): string {
    const node = nodes[nodeId];
    if (!node || node.children.length === 0) return '';

    let res = '';
    const mainChildId = node.children[0];
    const mainChild = nodes[mainChildId];
    if (!mainChild) return '';

    const isWhite = mainChild.turn === 'w';
    if (isWhite) {
      res += `${mainChild.moveNumber}. ${mainChild.san}`;
    } else {
      const parent = node.parentId ? nodes[node.parentId] : null;
      if (!parent || parent.children[0] !== nodeId || parent.turn === 'b') {
        res += `${mainChild.moveNumber}... ${mainChild.san}`;
      } else {
        res += ` ${mainChild.san}`;
      }
    }

    if (mainChild.glyphs && mainChild.glyphs.length > 0) {
      for (const g of mainChild.glyphs) {
        res += ` ${g}`;
      }
    }

    if (mainChild.comment) {
      res += ` {${mainChild.comment}}`;
    }

    if (node.children.length > 1) {
      for (let i = 1; i < node.children.length; i++) {
        const varChildId = node.children[i];
        const varChild = nodes[varChildId];
        if (!varChild) continue;

        let varPgn = '';
        if (varChild.turn === 'w') {
          varPgn = `${varChild.moveNumber}. ${varChild.san}`;
        } else {
          varPgn = `${varChild.moveNumber}... ${varChild.san}`;
        }
        if (varChild.glyphs && varChild.glyphs.length > 0) {
          for (const g of varChild.glyphs) {
            varPgn += ` ${g}`;
          }
        }
        if (varChild.comment) {
          varPgn += ` {${varChild.comment}}`;
        }

        const restOfVar = traverse(varChildId);
        if (restOfVar) {
          varPgn += ' ' + restOfVar;
        }
        res += ` (${varPgn})`;
      }
    }

    const rest = traverse(mainChildId);
    if (rest) {
      res += ' ' + rest;
    }

    return res;
  }

  const movesText = traverse(rootId).trim();
  pgn += movesText || '*';
  return pgn;
}
