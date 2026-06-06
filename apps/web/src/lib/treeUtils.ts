import { MoveNode } from '../types/chess';

/**
 * Recursively find a node by its ID.
 */
export function findNode(tree: MoveNode | null, id: string): MoveNode | null {
  if (!tree) return null;
  if (tree.id === id) return tree;

  for (const child of tree.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/**
 * Find the path from the root to a specific node.
 * Returns an array of node IDs.
 */
export function findPath(tree: MoveNode | null, targetId: string): string[] | null {
  if (!tree) return null;
  if (tree.id === targetId) return [tree.id];

  for (const child of tree.children) {
    const path = findPath(child, targetId);
    if (path) {
      return [tree.id, ...path];
    }
  }
  return null;
}

/**
 * Returns a new tree with the new node inserted as a child of the parent.
 * If the parent is not found, returns the original tree.
 */
export function insertNode(tree: MoveNode | null, parentId: string, newNode: MoveNode): MoveNode | null {
  if (!tree) return null;

  if (tree.id === parentId) {
    // Check if move already exists as a child to prevent duplicates
    const exists = tree.children.find(c => c.san === newNode.san);
    if (exists) return tree; // Or return original tree if we don't want to duplicate

    return {
      ...tree,
      children: [...tree.children, newNode],
    };
  }

  return {
    ...tree,
    children: tree.children.map(child => {
      const updatedChild = insertNode(child, parentId, newNode);
      return updatedChild ? updatedChild : child; // updatedChild is never null here since child is not null, but type safety
    }) as MoveNode[],
  };
}

/**
 * Returns a new tree with updated properties for a specific node.
 */
export function updateNode(
  tree: MoveNode | null,
  nodeId: string,
  updates: Partial<MoveNode>
): MoveNode | null {
  if (!tree) return null;

  if (tree.id === nodeId) {
    return { ...tree, ...updates };
  }

  return {
    ...tree,
    children: tree.children.map(child => updateNode(child, nodeId, updates) as MoveNode),
  };
}
