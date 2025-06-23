import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MemoryInsight, LearningProfile } from '../types';

interface MemoryState {
  memories: MemoryInsight[];
  learningProfile: LearningProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setMemories: (memories: MemoryInsight[] | ((prev: MemoryInsight[]) => MemoryInsight[])) => void;
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

      setMemories: (memories) => {
        if (typeof memories === 'function') {
          // Handle React-style function updates
          set((state) => {
            const currentMemories = Array.isArray(state.memories) ? state.memories : [];
            const newMemories = memories(currentMemories);
            return { memories: Array.isArray(newMemories) ? newMemories : [] };
          });
        } else if (!Array.isArray(memories)) {
          console.warn('setMemories called with non-array value:', memories);
          set({ memories: [] });
        } else {
          set({ memories });
        }
      },
      
      addMemory: (memory) => set((state) => ({ 
        memories: Array.isArray(state.memories) ? [...state.memories, memory] : [memory]
      })),
      
      updateMemory: (id, updates) => set((state) => ({
        memories: Array.isArray(state.memories) 
          ? state.memories.map(memory => memory.id === id ? { ...memory, ...updates } : memory)
          : []
      })),
      
      removeMemory: (id) => set((state) => ({
        memories: Array.isArray(state.memories) 
          ? state.memories.filter(memory => memory.id !== id)
          : []
      })),
      
      setLearningProfile: (profile) => set({ learningProfile: profile }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      clearMemories: () => set({ 
        memories: [], 
        learningProfile: null 
      }),

      // Computed values
      getMemoryCount: () => {
        const memories = get().memories;
        return Array.isArray(memories) ? memories.length : 0;
      },
      getConnectionCount: () => {
        const memories = get().memories;
        return Array.isArray(memories) ? memories.reduce((acc, memory) => acc + memory.connections.length, 0) : 0;
      },
      hasMemories: () => {
        const memories = get().memories;
        return Array.isArray(memories) && memories.length > 0;
      },
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