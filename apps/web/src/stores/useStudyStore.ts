import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MoveNode, Arrow } from '../types/chess';
import { findNode, insertNode, updateNode } from '../lib/treeUtils';
import { Chess, Move } from 'chess.js';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const createRootNode = (fen: string = INITIAL_FEN): MoveNode => ({
  id: 'root',
  parentId: null,
  san: 'Start',
  fen,
  children: [],
});

interface StudyState {
  tree: MoveNode;
  currentNodeId: string;
  
  // Actions
  playMove: (from: string, to: string, promotion?: string) => boolean;
  jumpToNode: (id: string) => void;
  addComment: (id: string, comment: string) => void;
  addArrows: (id: string, arrows: Arrow[]) => void;
  resetGame: (fen?: string) => void;
  goNext: () => void;
  goPrev: () => void;
  goStart: () => void;
  goEnd: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      tree: createRootNode(),
      currentNodeId: 'root',

      playMove: (from: string, to: string, promotion: string = 'q') => {
        const { tree, currentNodeId } = get();
        
        // Find the current node to get its FEN
        const currentNode = findNode(tree, currentNodeId);
        if (!currentNode) return false;

        // Try to apply the move using chess.js
        const chess = new Chess(currentNode.fen);
        let move: Move | null = null;
        try {
          move = chess.move({ from, to, promotion });
        } catch (e) {
          // Invalid move
          return false;
        }

        if (!move) return false;

        const san = move.san;
        const newFen = chess.fen();
        const newId = `${currentNodeId}-${san}`; // Simple ID generation

        // Check if this move already exists as a variation
        const existingChild = currentNode.children.find(c => c.san === san);
        
        if (existingChild) {
          // Just navigate down that line
          set({ currentNodeId: existingChild.id });
          return true;
        }

        // Create new node
        const newNode: MoveNode = {
          id: newId,
          parentId: currentNodeId,
          san,
          fen: newFen,
          children: [],
        };

        // Insert node into tree
        const newTree = insertNode(tree, currentNodeId, newNode);
        if (newTree) {
          set({ tree: newTree, currentNodeId: newId });
          return true;
        }

        return false;
      },

      jumpToNode: (id: string) => {
        set({ currentNodeId: id });
      },

      addComment: (id: string, comment: string) => {
        const { tree } = get();
        const newTree = updateNode(tree, id, { comment });
        if (newTree) set({ tree: newTree });
      },

      addArrows: (id: string, arrows: Arrow[]) => {
        const { tree } = get();
        const newTree = updateNode(tree, id, { arrows });
        if (newTree) set({ tree: newTree });
      },

      resetGame: (fen: string = INITIAL_FEN) => {
        set({
          tree: createRootNode(fen),
          currentNodeId: 'root',
        });
      },

      goNext: () => {
        const { tree, currentNodeId } = get();
        const node = findNode(tree, currentNodeId);
        if (node && node.children.length > 0) {
          set({ currentNodeId: node.children[0].id });
        }
      },

      goPrev: () => {
        const { tree, currentNodeId } = get();
        const node = findNode(tree, currentNodeId);
        if (node && node.parentId) {
          set({ currentNodeId: node.parentId });
        }
      },

      goStart: () => {
        set({ currentNodeId: 'root' });
      },

      goEnd: () => {
        const { tree, currentNodeId } = get();
        let node = findNode(tree, currentNodeId);
        while (node && node.children.length > 0) {
          node = node.children[0];
        }
        if (node) {
          set({ currentNodeId: node.id });
        }
      },
    }),
    {
      name: 'vca-study-storage', // name of the item in the storage (must be unique)
      // partalize could be used if we only want to persist the tree and currentNodeId
    }
  )
);
