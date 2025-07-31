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
  generateFromEpistemicDriver: (historyEntryId: string) => Promise<void>;
  pollForResults: (jobId: string) => Promise<void>;
  retryPolling: () => Promise<void>;
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
      // Check if user is authenticated before starting generation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated for mindmap generation');
        set({ 
          loadingStatus: 'error', 
          error: 'Authentication required. Please sign in to generate mindmaps.' 
        });
        return;
      }

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

  generateFromEpistemicDriver: async (historyEntryId: string) => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated for mindmap generation');
        set({ 
          loadingStatus: 'error', 
          error: 'Authentication required. Please sign in to generate mindmaps from history.' 
        });
        return;
      }

      // Prevent multiple simultaneous requests
      const currentStatus = get().loadingStatus;
      if (currentStatus === 'pending_jobId' || currentStatus === 'generating') {
        console.warn('Generation already in progress, ignoring request');
        return;
      }

      // Set loading state
      set({ 
        loadingStatus: 'generating', 
        error: null, 
        nodes: [], 
        edges: [], 
        jobId: null 
      });

      console.log('🔄 Fetching epistemic driver history entry:', historyEntryId);

      // Fetch the epistemic driver history entry
      const { data: historyEntry, error: fetchError } = await supabase
        .from('epistemic_driver_history')
        .select('*')
        .eq('id', historyEntryId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !historyEntry) {
        console.error('❌ Failed to fetch history entry:', fetchError);
        set({ 
          loadingStatus: 'error', 
          error: 'Failed to load study map data. Please try again.' 
        });
        return;
      }

      console.log('📊 Processing epistemic driver data:', historyEntry.study_map_data);

      // Transform epistemic driver data into mindmap format
      const studyMapData = historyEntry.study_map_data;
      const nodes: Node[] = [];
      const edges: Edge[] = [];
      let nodeIdCounter = 0;

      // Create central subject node
      const centralNodeId = `node-${nodeIdCounter++}`;
      nodes.push({
        id: centralNodeId,
        data: { 
          label: historyEntry.subject,
          description: 'Central Subject'
        },
        position: { x: 600, y: 300 },
        type: 'default',
        style: {
          background: '#4f46e5',
          color: 'white',
          border: '2px solid #312e81',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          width: '200px',
          height: '60px',
          padding: '10px'
        }
      });

      // Add epistemological drivers (foundation)
      if (studyMapData.epistemological_drivers) {
        const foundationNodeId = `node-${nodeIdCounter++}`;
        nodes.push({
          id: foundationNodeId,
          data: { 
            label: 'Foundation (Why)',
            description: studyMapData.epistemological_drivers.pillar
          },
          position: { x: 600, y: 50 },
          type: 'default',
          style: {
            background: '#059669',
            color: 'white',
            border: '2px solid #047857',
            borderRadius: '8px',
            width: '180px',
            height: '50px',
            padding: '8px'
          }
        });

        edges.push({
          id: `edge-${centralNodeId}-${foundationNodeId}`,
          source: centralNodeId,
          target: foundationNodeId,
          type: 'smoothstep',
          style: { stroke: '#059669', strokeWidth: 2 }
        });

        // Add foundation points as child nodes
        studyMapData.epistemological_drivers.points?.forEach((point: any, index: number) => {
          const pointNodeId = `node-${nodeIdCounter++}`;
          const pointsCount = studyMapData.epistemological_drivers.points.length;
          const startX = 300 - (pointsCount * 80);
          nodes.push({
            id: pointNodeId,
            data: { 
              label: point.type,
              description: point.content
            },
            position: { x: startX + (index * 160), y: -80 },
            type: 'default',
            style: {
              background: '#10b981',
              color: 'white',
              border: '1px solid #047857',
              borderRadius: '6px',
              fontSize: '12px',
              width: '140px',
              height: '40px',
              padding: '5px'
            }
          });

          edges.push({
            id: `edge-${foundationNodeId}-${pointNodeId}`,
            source: foundationNodeId,
            target: pointNodeId,
            type: 'smoothstep',
            style: { stroke: '#10b981', strokeWidth: 1 }
          });
        });
      }

      // Add learning paths (domains)
      if (studyMapData.learning_paths) {
        studyMapData.learning_paths.forEach((path: any, pathIndex: number) => {
          const domainNodeId = `node-${nodeIdCounter++}`;
          const angle = (pathIndex * 2 * Math.PI) / studyMapData.learning_paths.length;
          const radius = 450;
          const x = 600 + radius * Math.cos(angle);
          const y = 300 + radius * Math.sin(angle);

          nodes.push({
            id: domainNodeId,
            data: { 
              label: path.domain,
              description: 'Learning Domain'
            },
            position: { x, y },
            type: 'default',
            style: {
              background: '#dc2626',
              color: 'white',
              border: '2px solid #991b1b',
              borderRadius: '8px',
              width: '160px',
              height: '50px',
              padding: '8px'
            }
          });

          edges.push({
            id: `edge-${centralNodeId}-${domainNodeId}`,
            source: centralNodeId,
            target: domainNodeId,
            type: 'smoothstep',
            style: { stroke: '#dc2626', strokeWidth: 2 }
          });

          // Add methodology points (How)
          if (path.methodology?.points) {
            path.methodology.points.forEach((point: any, pointIndex: number) => {
              const methodNodeId = `node-${nodeIdCounter++}`;
              const methodCount = path.methodology.points.length;
              const methodStartX = x - (methodCount * 60);
              const methodX = methodStartX + (pointIndex * 120);
              const methodY = y + 120;

              nodes.push({
                id: methodNodeId,
                data: { 
                  label: point.type,
                  description: point.content
                },
                position: { x: methodX, y: methodY },
                type: 'default',
                style: {
                  background: '#f59e0b',
                  color: 'white',
                  border: '1px solid #d97706',
                  borderRadius: '6px',
                  fontSize: '11px',
                  width: '100px',
                  height: '35px',
                  padding: '4px'
                }
              });

              edges.push({
                id: `edge-${domainNodeId}-${methodNodeId}`,
                source: domainNodeId,
                target: methodNodeId,
                type: 'smoothstep',
                style: { stroke: '#f59e0b', strokeWidth: 1 }
              });
            });
          }

          // Add application points (So What)
          if (path.application?.points) {
            path.application.points.forEach((point: any, pointIndex: number) => {
              const appNodeId = `node-${nodeIdCounter++}`;
              const appCount = path.application.points.length;
              const appStartX = x - (appCount * 60);
              const appX = appStartX + (pointIndex * 120);
              const appY = y - 120;

              nodes.push({
                id: appNodeId,
                data: { 
                  label: point.type,
                  description: point.content
                },
                position: { x: appX, y: appY },
                type: 'default',
                style: {
                  background: '#7c3aed',
                  color: 'white',
                  border: '1px solid #5b21b6',
                  borderRadius: '6px',
                  fontSize: '11px',
                  width: '100px',
                  height: '35px',
                  padding: '4px'
                }
              });

              edges.push({
                id: `edge-${domainNodeId}-${appNodeId}`,
                source: domainNodeId,
                target: appNodeId,
                type: 'smoothstep',
                style: { stroke: '#7c3aed', strokeWidth: 1 }
              });
            });
          }
        });
      }

      console.log('✅ Generated mindmap with', nodes.length, 'nodes and', edges.length, 'edges');

      // Set the generated mindmap data
      set({ 
        nodes,
        edges,
        loadingStatus: 'success',
        error: null,
        jobId: `epistemic-${historyEntryId}` // Use a pseudo job ID for tracking
      });
      
    } catch (error) {
      console.error('Failed to generate mindmap from epistemic driver:', error);
      set({ 
        loadingStatus: 'error', 
        error: error instanceof Error ? error.message : 'Failed to generate mindmap from study map data' 
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
        // Check if user is authenticated before making the request
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ User not authenticated for polling');
          set({ 
            loadingStatus: 'error', 
            error: 'Authentication required. Please sign in and try again.' 
          });
          return;
        }

        // Query Supabase for the mindmap result using authenticated client
        const { data, error } = await supabase
          .from('mindmap_results')
          .select('*')
          .eq('job_id', jobId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('❌ Supabase query error:', error);
          
          // Handle specific authentication errors
          if (error.message?.includes('JWT') || error.message?.includes('not authenticated')) {
            set({ 
              loadingStatus: 'error', 
              error: 'Session expired. Please sign in again and retry.' 
            });
          } else {
            set({ 
              loadingStatus: 'error', 
              error: `Database error: ${error.message || 'Failed to check job status'}` 
            });
          }
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
            error: 'Mindmap generation timed out. The job may still be processing. Please check back later or try generating a new mindmap.' 
          });
        }
        
      } catch (error) {
        console.error('❌ Polling error:', error);
        
        // Handle different types of errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check if it's an authentication error
        if (errorMessage.includes('JWT') || errorMessage.includes('not authenticated') || errorMessage.includes('No API key')) {
          set({ 
            loadingStatus: 'error', 
            error: 'Authentication expired. Please sign in again and retry.' 
          });
          return;
        }
        
        // Check if it's a network error
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
          console.warn(`Network error on attempt ${attempts}, retrying...`);
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000); // Retry on network error
            return;
          }
        }
        
        // For other errors, retry if we haven't exceeded max attempts
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Retry on error
        } else {
          set({ 
            loadingStatus: 'error', 
            error: `Failed to check mindmap generation status: ${errorMessage}` 
          });
        }
      }
    };
    
    // Start polling
    poll();
  },

  retryPolling: async () => {
    const currentJobId = get().jobId;
    if (!currentJobId) {
      console.error('❌ No job ID available for retry');
      set({ 
        loadingStatus: 'error', 
        error: 'No active job to retry. Please start a new mindmap generation.' 
      });
      return;
    }

    console.log('🔄 Retrying polling for job:', currentJobId);
    set({ 
      loadingStatus: 'generating', 
      error: null 
    });
    
    // Restart polling for the current job
    get().pollForResults(currentJobId);
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
export const useGenerateFromEpistemicDriver = () => useSensaMindmapStore(state => state.generateFromEpistemicDriver);
export const useRetryPolling = () => useSensaMindmapStore(state => state.retryPolling);
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