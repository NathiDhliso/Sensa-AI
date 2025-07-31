import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { supabase } from '../../../lib/supabase';

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
  pollForResults: (jobId: string) => Promise<void>;
  setMindmapData: (data: { nodes: Node[]; edges: Edge[] }) => void;
  updateJobStatus: (jobId: string, status: LoadingStatus) => void;
  setError: (error: string) => void;
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

  pollForResults: async (jobId: string) => {
    const maxAttempts = 30; // 30 attempts = 5 minutes with 10-second intervals
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      console.log(`🔄 Polling attempt ${attempts}/${maxAttempts} for job ${jobId}`);
      
      try {
        // Query Supabase for the mindmap result using authenticated client
        const { data, error } = await supabase
          .from('mindmap_results')
          .select('*')
          .eq('job_id', jobId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('❌ Supabase query error:', error);
          set({ loadingStatus: 'error', error: 'Failed to check job status' });
          return;
        }
        
        if (data) {
          console.log('📊 Found result data:', data);
          
          if (data.status === 'completed' && data.result_data) {
            // Process the completed mindmap data
            const resultData = data.result_data;
            const nodes = resultData.nodes || [];
            const edges = resultData.edges || [];
            
            // Convert to React Flow format
            const reactFlowNodes = nodes.map((node: any, index: number) => ({
              id: node.id || `node-${index}`,
              data: { 
                label: node.label || node.data?.label || 'Node',
                description: node.description || node.data?.description || ''
              },
              position: { 
                x: node.x || node.position?.x || Math.random() * 400, 
                y: node.y || node.position?.y || Math.random() * 400 
              },
              type: 'default'
            }));
            
            const reactFlowEdges = edges.map((edge: any, index: number) => ({
              id: edge.id || `edge-${index}`,
              source: edge.source,
              target: edge.target,
              label: edge.label || ''
            }));
            
            console.log('✅ Mindmap generation completed:', {
              nodes: reactFlowNodes.length,
              edges: reactFlowEdges.length
            });
            
            set({
              nodes: reactFlowNodes,
              edges: reactFlowEdges,
              loadingStatus: 'success'
            });
            return;
          } else if (data.status === 'failed') {
            console.error('❌ Job failed:', data.error_message);
            set({ 
              loadingStatus: 'error', 
              error: data.error_message || 'Mindmap generation failed' 
            });
            return;
          }
          // If status is still 'pending' or 'processing', continue polling
        }
        
        // Continue polling if no result yet and haven't exceeded max attempts
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          console.error('❌ Polling timeout after', maxAttempts, 'attempts');
          set({ 
            loadingStatus: 'error', 
            error: 'Mindmap generation timed out. Please try again.' 
          });
        }
        
      } catch (error) {
        console.error('❌ Polling error:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Retry on error
        } else {
          set({ 
            loadingStatus: 'error', 
            error: 'Failed to check mindmap generation status' 
          });
        }
      }
    };
    
    // Start polling
    poll();
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