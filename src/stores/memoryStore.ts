import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MemoryInsight, LearningProfile } from '../types';

interface MemoryState {
  memories: MemoryInsight[];
  learningProfile: LearningProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setMemories: (memories: MemoryInsight[]) => void;
  addMemory: (memory: MemoryInsight) => void;
  updateMemory: (id: string, updates: Partial<MemoryInsight>) => void;
  removeMemory: (id: string) => void;
  setLearningProfile: (profile: LearningProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMemories: () => void;
  
  // Computed values
  getMemoryCount: () => number;
  getConnectionCount: () => number;
  hasMemories: () => boolean;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [],
      learningProfile: null,
      loading: false,
      error: null,

      setMemories: (memories) => set({ memories }),
      
      addMemory: (memory) => set((state) => ({ 
        memories: [...state.memories, memory] 
      })),
      
      updateMemory: (id, updates) => set((state) => ({
        memories: state.memories.map(memory => 
          memory.id === id ? { ...memory, ...updates } : memory
        )
      })),
      
      removeMemory: (id) => set((state) => ({
        memories: state.memories.filter(memory => memory.id !== id)
      })),
      
      setLearningProfile: (profile) => set({ learningProfile: profile }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      clearMemories: () => set({ 
        memories: [], 
        learningProfile: null 
      }),

      // Computed values
      getMemoryCount: () => get().memories.length,
      getConnectionCount: () => get().memories.reduce((acc, memory) => acc + memory.connections.length, 0),
      hasMemories: () => get().memories.length > 0,
    }),
    {
      name: 'sensa-memories',
      partialize: (state) => ({ 
        memories: state.memories,
        learningProfile: state.learningProfile 
      }),
    }
  )
);