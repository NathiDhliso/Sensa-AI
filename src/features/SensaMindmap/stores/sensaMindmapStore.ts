import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

// Type definitions for granular loading states
export type LoadingStatus = 
  | 'idle'
  | 'pending_jobId'
  | 'generating'
  | 'layout_complete'
  | 'success'
  | 'error';

// State interface - defines the shape of our store state
export interface SensaMindmapState {
  nodes: Node[];
  edges: Edge[];
  jobId: string | null;
  loadingStatus: LoadingStatus;
  error: string | null;
}

// Actions interface - defines all the actions that can modify state
export interface SensaMindmapActions {
  startGeneration: (subject: string) => Promise<void>;
  setMindmapData: (data: { nodes: Node[]; edges: Edge[] }) => void;
  updateJobStatus: (status: LoadingStatus) => void;
  setError: (message: string) => void;
  reset: () => void;
  forceReset: () => void;
}

// Combined store type
export type SensaMindmapStore = SensaMindmapState & SensaMindmapActions;

// Initial state - centralized for easy resetting
const initialState: SensaMindmapState = {
  nodes: [],
  edges: [],
  jobId: null,
  loadingStatus: 'idle',
  error: null,
};

// API function to submit mindmap generation job to AWS Lambda
const submitMindmapJob = async (subject: string): Promise<{ jobId: string }> => {
  console.log('🚀 Submitting mindmap job to AWS Lambda for subject:', subject);
  
  const response = await fetch('https://4xzbykbhy2.execute-api.us-east-1.amazonaws.com/dev/sensa-mindmap-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject }),
  });

  console.log('📡 Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', errorText);
    throw new Error(`Failed to submit job: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ API Response:', data);
  
  return { jobId: data.jobId };
};

// Create the Zustand store with separated state and actions
export const useSensaMindmapStore = create<SensaMindmapStore>((set, get) => ({
  // State properties
  ...initialState,

  // Actions
  startGeneration: async (subject: string) => {
    try {
      // Prevent multiple simultaneous requests
      const currentStatus = get().loadingStatus;
      if (currentStatus === 'pending_jobId' || currentStatus === 'generating') {
        console.warn('Generation already in progress, ignoring request');
        return;
      }

      // Clear any previous error and set loading state
      set({ 
        loadingStatus: 'pending_jobId', 
        error: null, 
        nodes: [], 
        edges: [], 
        jobId: null 
      });

      // Submit the job and get jobId
      const { jobId } = await submitMindmapJob(subject);
      
      console.log('🎯 Job submitted with ID:', jobId);
      
      // Update state with jobId and start polling
      set({ 
        jobId, 
        loadingStatus: 'generating' 
      });

      // Start polling for results from Supabase
      get().pollForResults(jobId);
      
    } catch (error) {
      console.error('Failed to start mindmap generation:', error);
      set({ 
        loadingStatus: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  },

  setMindmapData: (data: { nodes: Node[]; edges: Edge[] }) => {
    set({ 
      nodes: data.nodes, 
      edges: data.edges, 
      loadingStatus: 'success',
      error: null 
    });
  },

  updateJobStatus: (status: LoadingStatus) => {
    set({ loadingStatus: status });
  },

  setError: (message: string) => {
    set({ 
      error: message, 
      loadingStatus: 'error' 
    });
  },

  reset: () => {
    set(initialState);
  },

  // Force reset for stuck loading states
  forceReset: () => {
    set({
      ...initialState,
      error: null
    });
  },
}));

// Selector hooks for optimized re-renders
// Components should use these instead of selecting the entire state
export const useNodes = () => useSensaMindmapStore(state => state.nodes);
export const useEdges = () => useSensaMindmapStore(state => state.edges);
export const useJobId = () => useSensaMindmapStore(state => state.jobId);
export const useLoadingStatus = () => useSensaMindmapStore(state => state.loadingStatus);
export const useError = () => useSensaMindmapStore(state => state.error);

// Action selectors for components that only need actions
export const useStartGeneration = () => useSensaMindmapStore(state => state.startGeneration);
export const useSetMindmapData = () => useSensaMindmapStore(state => state.setMindmapData);
export const useUpdateJobStatus = () => useSensaMindmapStore(state => state.updateJobStatus);
export const useSetError = () => useSensaMindmapStore(state => state.setError);
export const useReset = () => useSensaMindmapStore(state => state.reset);

// Computed selectors for derived state
export const useIsLoading = () => useSensaMindmapStore(state => 
  state.loadingStatus === 'pending_jobId' || 
  state.loadingStatus === 'generating' || 
  state.loadingStatus === 'layout_complete'
);

export const useHasData = () => useSensaMindmapStore(state => 
  state.nodes.length > 0 || state.edges.length > 0
);

export const useCanGenerate = () => useSensaMindmapStore(state => 
  state.loadingStatus === 'idle' || 
  state.loadingStatus === 'success' || 
  state.loadingStatus === 'error'
);

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Add store to window for debugging
  (window as any).sensaMindmapStore = useSensaMindmapStore;
}

export default useSensaMindmapStore;