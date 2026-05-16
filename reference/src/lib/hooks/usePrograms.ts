'use client';

import { useState, useEffect } from 'react';

export interface Topic {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  order: number;
  topics: Topic[];
}

const INITIAL_PROGRAMS: Program[] = [
  { 
    id: 1, 
    name: 'Pawn Batch', 
    code: 'PAWN', 
    order: 1,
    topics: [
      { id: 'p1', title: 'Chess Board Setup and Notation', description: 'Learn coordinates and piece placement', order: 1 },
      { id: 'p2', title: 'How Pieces Move', description: 'Detailed movement rules for all 6 pieces', order: 2 },
      { id: 'p3', title: 'Check, Checkmate, and Stalemate', description: 'End-game conditions and rules', order: 3 },
      { id: 'p4', title: 'Basic Opening Principles', description: 'Control the center and develop pieces', order: 4 },
      { id: 'p5', title: 'Simple Tactical Patterns', description: 'Introduction to forks and pins', order: 5 },
    ]
  },
  { 
    id: 2, 
    name: 'Knight Batch', 
    code: 'KNIGHT', 
    order: 2,
    topics: [
      { id: 'k1', title: 'Advanced Tactics: Forks and Pins', description: 'Mastering short-range tactical strikes', order: 1 },
      { id: 'k2', title: 'Opening Theory for Beginners', description: 'Common opening lines and traps', order: 2 },
      { id: 'k3', title: 'Endgame Fundamentals', description: 'King and pawn endings', order: 3 },
      { id: 'k4', title: 'Positional Play Basics', description: 'Understanding piece activity', order: 4 },
    ]
  },
  { id: 3, name: 'Bishop Batch', code: 'BISHOP', order: 3, topics: [] },
  { id: 4, name: 'Rook Batch', code: 'ROOK', order: 4, topics: [] },
  { id: 5, name: 'Queen Batch', code: 'QUEEN', order: 5, topics: [] },
  { id: 6, name: 'King Batch', code: 'KING', order: 6, topics: [] },
];

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      if (!res.ok) throw new Error('Failed to fetch programs');
      const data = await res.json();
      setPrograms(data);
      setIsLoaded(true);
    } catch (err: any) {
      setError(err.message);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const addProgram = async (name: string, code: string) => {
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, order: programs.length }),
      });
      if (!res.ok) throw new Error('Failed to add program');
      const newProgram = await res.json();
      setPrograms(prev => [...prev, newProgram]);
      return newProgram.id;
    } catch (err: any) {
      alert(err.message);
      return null;
    }
  };

  const updateProgram = async (id: string, updates: Partial<Program>) => {
    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update program');
      setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteProgram = async (id: string) => {
    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete program');
      setPrograms(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const moveProgram = async (id: string, direction: 'up' | 'down') => {
    const index = programs.findIndex(p => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === programs.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = programs[index];
    const target = programs[targetIndex];

    try {
      // Simple swap order in backend
      const res = await fetch('/api/programs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program1: { id: current.id, order: target.order },
          program2: { id: target.id, order: current.order }
        }),
      });
      if (!res.ok) throw new Error('Failed to reorder programs');
      
      const newPrograms = [...programs];
      const tempOrder = newPrograms[index].order;
      newPrograms[index].order = newPrograms[targetIndex].order;
      newPrograms[targetIndex].order = tempOrder;
      setPrograms(newPrograms.sort((a, b) => a.order - b.order));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateTopics = async (programId: string, topics: Topic[]) => {
    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics }),
      });
      if (!res.ok) throw new Error('Failed to update topics');
      setPrograms(prev => prev.map(p => p.id === programId ? { ...p, topics } : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return {
    programs,
    isLoaded,
    error,
    addProgram,
    updateProgram,
    deleteProgram,
    moveProgram,
    updateTopics,
    refresh: fetchPrograms
  };
}

