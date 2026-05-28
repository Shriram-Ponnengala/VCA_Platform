export type Arrow = {
  from: string;
  to: string;
  color: string;
};

export type MoveNode = {
  id: string; // unique identifier, e.g., standard SAN + FEN or random UUID
  parentId: string | null;
  san: string; // The move text, e.g., 'e4', 'Nf3'
  fen: string; // The board position after the move
  comment?: string;
  glyphs?: string[]; // e.g., ['!', '?', '!!']
  arrows?: Arrow[];
  children: MoveNode[];
};
