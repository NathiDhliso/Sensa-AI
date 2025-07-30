import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ArrowDown,
  Brain,
  Map
} from 'lucide-react';
import { usePageTheme } from '../../contexts/themeUtils';
import { supabaseServices } from '../../services/supabaseServices';
import { supabase } from '../../lib/supabase';
import { Button, BackButton } from '../../components';
import { HistoryManager } from './components/HistoryManager';
import {
  useSensaMindmapStore,
  useJobId,
  useLoadingStatus,
  useNodes,
  useEdges,
  useError as useMindmapError,
  useStartGeneration,
  useUpdateJobStatus,
  useSetMindmapData,
  useSetError,
  useReset,
  useCanGenerate,
  type LoadingStatus
} from '../SensaMindmap/stores/sensaMindmapStore';
import { SensaMindmapEditor } from '../SensaMindmap/components/SensaMindmapEditor';
import type {
  EpistemicDriverInput,
  EpistemicDriverState,
  EpistemicDriverHistoryEntry,
  FormErrors,
  LearningStrategyPhase
} from './types';
import styles from './styles.module.css';

const EpistemicDriver: React.FC = () => {
  usePageTheme('epistemicDriver');
  
  const [state, setState] = useState<EpistemicDriverState>({
    isLoading: false,
    error: null,
    data: null,
    expandedAccordion: null
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [currentInput, setCurrentInput] = useState<EpistemicDriverInput | null>(null);
  const [showMindmapModal, setShowMindmapModal] = useState(false);

  // Sensa Mindmap store hooks with granular selectors for performance
  const jobId = useJobId();
  const loadingStatus = useLoadingStatus();
  const nodes = useNodes();
  const edges = useEdges();
  const mindmapError = useMindmapError();
  const startGeneration = useStartGeneration();
  const updateJobStatus = useUpdateJobStatus();
  const setMindmapData = useSetMindmapData();
  const setMindmapError = useSetError();
  const resetMindmap = useReset();
  const canGenerate = useCanGenerate();

  // Real-time subscription and polling logic with cleanup
  useEffect(() => {
    if (!jobId || loadingStatus === 'success' || loadingStatus === 'error') return;

    // Check if we're in a stuck loading state from a previous session
    if (loadingStatus === 'generating' || loadingStatus === 'pending_jobId' || loadingStatus === 'layout_complete') {
      // Reset after 10 seconds if stuck from previous session
      const stuckTimeout = setTimeout(() => {
        console.warn('Detected stuck loading state, resetting...');
        setMindmapError('Previous generation was stuck. Please try again.');
        resetMindmap();
      }, 10000);
      
      // Clear timeout if component unmounts
      return () => clearTimeout(stuckTimeout);
    }

    let channel: any = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    let pollingTimeout: NodeJS.Timeout | null = null;
    let isSubscriptionActive = true;
    const startTime = Date.now();
    const maxPollingDuration = 2 * 60 * 1000; // 2 minutes max polling

    // Helper function to get user-friendly status messages
    const getStatusMessage = (status: LoadingStatus): string => {
      switch (status) {
        case 'pending_jobId':
          return 'Initializing mind map generation...';
        case 'generating':
          return 'Processing structure and calculating layout...';
        case 'layout_complete':
          return 'Finalizing mind map visualization...';
        case 'success':
          return 'Mind map generated successfully!';
        case 'error':
          return 'Generation failed. Please try again.';
        default:
          return 'Generating mind map...';
      }
    };

    // Set up real-time subscription
    const setupRealtimeSubscription = () => {
      try {
        channel = supabase.channel(`sensa-mindmap-${jobId}`);
        
        channel
          .on('broadcast', { event: 'status_update' }, (payload: any) => {
            if (!isSubscriptionActive) return;
            
            const { status, data } = payload.payload;
            console.log('Received status update:', status, data);
            
            if (status && status !== loadingStatus) {
              updateJobStatus(status as LoadingStatus);
            }
            
            // Handle final mind map data
            if (status === 'success' && data?.nodes && data?.edges) {
              setMindmapData({
                nodes: data.nodes,
                edges: data.edges
              });
              setShowMindmapModal(true);
            }
          })
          .on('broadcast', { event: 'error' }, (payload: any) => {
            if (!isSubscriptionActive) return;
            
            const { message } = payload.payload;
            console.error('Received error:', message);
            setMindmapError(message || 'An error occurred during generation');
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to real-time updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('Real-time subscription error, falling back to polling');
              setupPolling();
            }
          });
      } catch (error) {
        console.error('Failed to set up real-time subscription:', error);
        setupPolling();
      }
    };

    // Set up HTTP polling as fallback
    const setupPolling = () => {
      if (pollingInterval) return; // Avoid duplicate intervals
      
      pollingInterval = setInterval(async () => {
        if (!isSubscriptionActive) return;
        
        // Check if we've exceeded the maximum polling duration
        if (Date.now() - startTime > maxPollingDuration) {
          console.warn('Polling timeout reached, stopping polling');
          setMindmapError('Mind map generation timed out. Please try again.');
          updateJobStatus('error');
          clearInterval(pollingInterval!);
          pollingInterval = null;
          return;
        }
        
        try {
          // Query Supabase epistemic_driver_history table for completed mindmaps
          const { data, error } = await supabase
            .from('epistemic_driver_history')
            .select('study_map_data')
            .eq('study_map_data->>job_id', jobId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (data && data.study_map_data) {
            const studyMapData = data.study_map_data as any;
            
            // Check if this is a completed mindmap job
            if (studyMapData.job_id === jobId && studyMapData.status === 'completed' && studyMapData.mindmap_data) {
              const mindmapData = studyMapData.mindmap_data;
              
              if (mindmapData.nodes && mindmapData.edges) {
                setMindmapData({
                  nodes: mindmapData.nodes,
                  edges: mindmapData.edges
                });
                setShowMindmapModal(true);
                updateJobStatus('success');
                clearInterval(pollingInterval!);
                pollingInterval = null;
                return;
              }
            } else if (studyMapData.job_id === jobId && studyMapData.status === 'failed') {
              // Handle failed job status
              setMindmapError('Mind map generation failed. Please try again.');
              updateJobStatus('error');
              clearInterval(pollingInterval!);
              pollingInterval = null;
              return;
            }
          }
          
          // If no error but no data found, job is still processing
          if (!error) {
            updateJobStatus('generating');
          }
        } catch (error) {
          console.error('Polling error:', error);
          // Don't set error status immediately, keep polling for a while
        }
      }, 3000); // Poll every 3 seconds
    };

    // Start with real-time subscription
    setupRealtimeSubscription();
    
    // Set up polling after a delay as additional fallback
    pollingTimeout = setTimeout(() => {
      if (isSubscriptionActive && loadingStatus !== 'success' && loadingStatus !== 'error') {
        setupPolling();
      }
    }, 10000); // Start polling after 10 seconds if still in progress

    // Cleanup function
    return () => {
      isSubscriptionActive = false;
      
      // Clean up real-time subscription
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      
      // Clean up polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      
      // Clean up polling timeout
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
        pollingTimeout = null;
      }
      
      // Reset store state for next generation
      resetMindmap();
    };
  }, [jobId, loadingStatus, updateJobStatus, setMindmapData, setMindmapError, resetMindmap]);

  // Learning strategy phases for the cohesive cycle
  const learningStrategyPhases: LearningStrategyPhase[] = [
    {
      title: 'Foundation',
      subtitle: '"What does it do?"',
      description: 'Start with the Foundational Drivers to understand the core \'Why\'. Study the Technical Components.',
      techniques: ['Flashcards (Anki)', 'Initial Feynman Pass'],
      icon: '🏗️',
      color: 'from-blue-400 to-blue-600'
    },
    {
      title: 'Application',
      subtitle: '"How do I use it?"',
      description: 'For each domain, get hands-on with the Operational Processes to get a Direct Result.',
      techniques: ['Labs & Practicals', 'Problem-Solving'],
      icon: '⚡',
      color: 'from-green-400 to-green-600'
    },
    {
      title: 'Interrogation',
      subtitle: '"Why use it that way?"',
      description: 'Analyze the Strategic Drivers and Execution Strategies that lead to the final Business Impact.',
      techniques: ['Feynman (Deep Dive)'],
      icon: '🔍',
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      title: 'Synthesis',
      subtitle: '"How does it all fit?"',
      description: 'Connect your understanding across all domains to see the big picture.',
      techniques: ['Concept Mapping'],
      icon: '🎯',
      color: 'from-purple-400 to-purple-600'
    }
  ];

  const validateForm = useCallback((data: EpistemicDriverInput): FormErrors => {
    const errors: FormErrors = {};
    
    if (!data.subject.trim()) {
      errors.subject = 'Subject is required';
    } else if (data.subject.trim().length < 3) {
      errors.subject = 'Subject must be at least 3 characters';
    }
    
    if (!data.objectives.trim()) {
      errors.objectives = 'Objectives are required';
    } else if (data.objectives.trim().length < 50) {
      errors.objectives = 'Objectives must be at least 50 characters for meaningful analysis';
    }
    
    return errors;
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const input: EpistemicDriverInput = {
      subject: formData.get('subject') as string || '',
      objectives: formData.get('objectives') as string || ''
    };

    // Validate form
    const errors = validateForm(input);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setCurrentInput(input);

    try {
      const response = await supabaseServices.callADKAgents({
        agent_type: 'orchestrator',
        task: 'epistemic_driver_generation',
        payload: input
      });

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          data: response.data,
          expandedAccordion: response.data.learning_paths[0]?.domain || null
        }));
      } else {
        throw new Error(response.error || 'Failed to generate epistemic driver');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }));
    }
  }, [validateForm]);

  const handleAccordionToggle = useCallback((domain: string) => {
    setState(prev => ({
      ...prev,
      expandedAccordion: prev.expandedAccordion === domain ? null : domain
    }));
  }, []);

  const handleLoadFromHistory = useCallback((entry: EpistemicDriverHistoryEntry) => {
    // Load the saved data into the current state
    setState(prev => ({
      ...prev,
      data: entry.study_map_data,
      expandedAccordion: entry.study_map_data.learning_paths[0]?.domain || null,
      error: null
    }));

    // Set the input data for potential re-saving
    setCurrentInput({
      subject: entry.subject,
      objectives: entry.objectives
    });

    // Clear any form errors
    setFormErrors({});

    // Optionally populate the form fields (if you want to show the loaded data in the form)
    const subjectInput = document.getElementById('subject') as HTMLInputElement;
    const objectivesInput = document.getElementById('objectives') as HTMLTextAreaElement;

    if (subjectInput) subjectInput.value = entry.subject;
    if (objectivesInput) objectivesInput.value = entry.objectives;
  }, []);

  const handleRetry = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Handler for Sensa Mindmap generation
  const handleGenerateMindmap = useCallback(async () => {
    if (!currentInput?.subject) {
      setMindmapError('Please generate a study map first to create a mind map visualization.');
      return;
    }

    console.log('🚀 Starting mindmap generation for subject:', currentInput.subject);
    console.log('📊 Current mindmap state:', { loadingStatus, nodes: nodes.length, edges: edges.length, jobId, mindmapError });

    try {
      await startGeneration(currentInput.subject);
      console.log('✅ Mindmap generation started successfully');
    } catch (error) {
      console.error('❌ Mindmap generation failed:', error);
      setMindmapError(error instanceof Error ? error.message : 'Failed to start mind map generation');
    }
  }, [currentInput, startGeneration, setMindmapError, loadingStatus, nodes, edges, jobId, mindmapError]);

  // Helper function to get user-friendly loading messages
  const getMindmapStatusMessage = (status: LoadingStatus): string => {
    switch (status) {
      case 'pending_jobId':
        return 'Initializing mind map generation...';
      case 'generating':
        return 'Processing structure and calculating layout...';
      case 'layout_complete':
        return 'Finalizing mind map visualization...';
      case 'success':
        return 'Mind map generated successfully!';
      case 'error':
        return 'Generation failed. Please try again.';
      default:
        return 'Generating mind map...';
    }
  };

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <BackButton variant="floating" />

      <div className={styles.innerContainer}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <h1 className={styles.title}>Epistemic Drivers</h1>
          <p className={styles.subtitle}>
            Transform your exam objectives into a strategic, connected study plan. 
            Discover the "Why," master the "How," and understand the "So What" of your learning journey.
          </p>
        </motion.div>

        {/* History Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <HistoryManager
            currentData={state.data}
            currentInput={currentInput}
            onLoadFromHistory={handleLoadFromHistory}
            onSaveSuccess={() => {
              // Optional: Show a success message or refresh history
              console.log('Study map saved successfully!');
            }}
          />
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.inputSection}
        >
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="subject" className={styles.label}>
                What is the subject or exam?
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                className={styles.input}
                placeholder="e.g., Azure AZ-104 Administrator Exam"
                disabled={state.isLoading}
              />
              {formErrors.subject && (
                <div className={styles.error}>{formErrors.subject}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="objectives" className={styles.label}>
                Paste the Exam Objectives / Study Guide Topics
              </label>
              <textarea
                id="objectives"
                name="objectives"
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Paste your complete exam objectives or study guide topics here..."
                disabled={state.isLoading}
              />
              {formErrors.objectives && (
                <div className={styles.error}>{formErrors.objectives}</div>
              )}
            </div>

            <button
              type="submit"
              className={styles.generateButton}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <div className={styles.spinner} />
                  Generating Strategic Study Map...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate Study Map
                </>
              )}
            </button>

            {/* Sensa Mindmap Button */}
            <Button
              onClick={handleGenerateMindmap}
              disabled={!canGenerate || !currentInput?.subject}
              className={`${styles.generateButton} ${styles.mindmapButton}`}
              variant="secondary"
            >
              {loadingStatus === 'pending_jobId' || loadingStatus === 'generating' || loadingStatus === 'layout_complete' ? (
                <>
                  <div className={styles.spinner} />
                  {getMindmapStatusMessage(loadingStatus)}
                </>
              ) : (
                <>
                  <Map className="w-5 h-5 mr-2" />
                  Generate Sensa Mindmap
                </>
              )}
            </Button>

            {/* Reset Button for stuck loading states */}
            {(loadingStatus === 'generating' || loadingStatus === 'pending_jobId' || loadingStatus === 'layout_complete') && (
              <Button
                onClick={() => {
                  reset();
                  setMindmapError('');
                }}
                className={`${styles.generateButton}`}
                variant="outline"
                style={{ marginTop: '10px', backgroundColor: '#f87171', color: 'white' }}
              >
                Reset Generation
              </Button>
            )}

            {/* Debug Button to show mindmap modal */}
            <Button
              onClick={() => {
                console.log('🔍 Debug: Opening mindmap modal manually');
                console.log('📊 Current state:', { loadingStatus, nodes: nodes.length, edges: edges.length, jobId, mindmapError });
                setShowMindmapModal(true);
              }}
              className={`${styles.generateButton}`}
              variant="outline"
              style={{ marginTop: '10px', backgroundColor: '#3b82f6', color: 'white' }}
            >
              Debug: Show Mindmap Modal
            </Button>
          </form>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {state.isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.loadingContainer}
            >
              <div className={styles.spinner} />
              <p className={styles.loadingText}>
                Creating your strategic study map...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={styles.errorContainer}
            >
              <h3 className={styles.errorTitle}>Generation Failed</h3>
              <p className={styles.errorMessage}>{state.error}</p>
              <button onClick={handleRetry} className={styles.retryButton}>
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mindmap Loading State */}
        <AnimatePresence>
          {(loadingStatus === 'pending_jobId' || loadingStatus === 'generating' || loadingStatus === 'layout_complete') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.loadingContainer}
            >
              <div className={styles.spinner} />
              <p className={styles.loadingText}>
                {getMindmapStatusMessage(loadingStatus)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mindmap Error State */}
        <AnimatePresence>
          {mindmapError && loadingStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={styles.errorContainer}
            >
              <h3 className={styles.errorTitle}>Mindmap Generation Failed</h3>
              <p className={styles.errorMessage}>{mindmapError}</p>
              <button 
                onClick={() => {
                  setMindmapError('');
                  resetMindmap();
                }} 
                className={styles.retryButton}
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Study Map Results */}
        <AnimatePresence>
          {state.data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Foundation Section */}
              <div className={styles.foundationSection}>
                <h2 className={styles.foundationTitle}>
                  The "Why": Foundational Drivers
                </h2>
                <div className={styles.foundationGrid}>
                  {state.data.epistemological_drivers.points.map((point, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={styles.foundationCard}
                    >
                      <div className={`${styles.foundationBadge} ${
                        point.type === 'Concept/Fact' ? styles.conceptBadge :
                        point.type === 'Process/Explanation' ? styles.processBadge :
                        styles.implicationBadge
                      }`}>
                        {index + 1}. {point.type}
                      </div>
                      <div className={styles.foundationContent}>
                        {point.content}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Connecting Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={styles.connectingSection}
              >
                <ArrowDown className={`w-8 h-8 ${styles.connectingArrow}`} />
                <p className={styles.connectingText}>
                  {state.data.connecting_link}
                </p>
              </motion.div>

              {/* Learning Paths */}
              <div className={styles.learningPathsSection}>
                <h2 className={styles.learningPathsTitle}>
                  Learning Paths: The "How" & "So What"
                </h2>
                
                {state.data.learning_paths.map((path, index) => (
                  <motion.div
                    key={path.domain}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={styles.accordion}
                  >
                    <div
                      className={styles.accordionHeader}
                      onClick={() => handleAccordionToggle(path.domain)}
                    >
                      <h3 className={styles.accordionTitle}>
                        Domain: {path.domain}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 ${styles.accordionChevron} ${
                          state.expandedAccordion === path.domain ? styles.expanded : ''
                        }`}
                      />
                    </div>
                    
                    <AnimatePresence>
                      {state.expandedAccordion === path.domain && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className={styles.accordionContent}
                        >
                          <div className={styles.pillarGrid}>
                            {/* Methodology Column */}
                            <div className={`${styles.pillarColumn} ${styles.methodologyColumn}`}>
                              <h4 className={styles.pillarTitle}>
                                {path.methodology.pillar} (The "How")
                              </h4>
                              <div className={styles.pointList}>
                                {path.methodology.points.map((point, pointIndex) => (
                                  <div key={pointIndex} className={styles.pointGroup}>
                                    <h5 className={styles.pointSubheader}>{point.type}</h5>
                                    <p className={styles.pointContent}>{point.content}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Application Column */}
                            <div className={`${styles.pillarColumn} ${styles.applicationColumn}`}>
                              <h4 className={styles.pillarTitle}>
                                {path.application.pillar} (The "So What")
                              </h4>
                              <div className={styles.pointList}>
                                {path.application.points.map((point, pointIndex) => (
                                  <div key={pointIndex} className={styles.pointGroup}>
                                    <h5 className={styles.pointSubheader}>{point.type}</h5>
                                    <p className={styles.pointContent}>{point.content}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Learning Strategy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className={styles.strategySection}
              >
                <h2 className={styles.strategyTitle}>
                  Your Learning Strategy: The Cohesive Cycle
                </h2>
                <div className={styles.strategyGrid}>
                  {learningStrategyPhases.map((phase, index) => (
                    <motion.div
                      key={phase.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={styles.strategyCard}
                    >
                      <div className={styles.strategyIcon}>
                        {phase.icon}
                      </div>
                      <h3 className={styles.strategyCardTitle}>
                        Phase {index + 1}: {phase.title}
                      </h3>
                      <p className={styles.strategySubtitle}>
                        {phase.subtitle}
                      </p>
                      <p className={styles.strategyDescription}>
                        {phase.description}
                      </p>
                      <div className={styles.techniquesList}>
                        <h4 className={styles.techniquesTitle}>Techniques:</h4>
                        <ul className={styles.techniques}>
                          {phase.techniques.map((technique, techIndex) => (
                            <li key={techIndex} className={styles.technique}>
                              {technique}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sensa Mindmap Modal */}
        <AnimatePresence>
          {showMindmapModal && (loadingStatus === 'success' || loadingStatus === 'error') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowMindmapModal(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>Sensa Mindmap Visualization</h2>
                  <button
                    onClick={() => setShowMindmapModal(false)}
                    className={styles.modalCloseButton}
                    aria-label="Close mindmap modal"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.modalBody}>
                  {nodes.length > 0 ? (
                    <SensaMindmapEditor
                      nodes={nodes}
                      edges={edges}
                      className={styles.mindmapEditor}
                      ariaLabel={`Interactive mind map for ${currentInput?.subject || 'study material'}`}
                    />
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <h3>Debug Information</h3>
                      <p><strong>Loading Status:</strong> {loadingStatus}</p>
                      <p><strong>Nodes:</strong> {nodes.length}</p>
                      <p><strong>Edges:</strong> {edges.length}</p>
                      <p><strong>Job ID:</strong> {jobId || 'None'}</p>
                      <p><strong>Error:</strong> {mindmapError || 'None'}</p>
                      <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                        {JSON.stringify({ nodes, edges }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <div className={styles.modalFooter}>
                  <Button
                    onClick={() => setShowMindmapModal(false)}
                    variant="secondary"
                    className={styles.modalButton}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // Future: Add export functionality
                      console.log('Export mindmap functionality to be implemented');
                    }}
                    variant="primary"
                    className={styles.modalButton}
                  >
                    Export
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EpistemicDriver;
