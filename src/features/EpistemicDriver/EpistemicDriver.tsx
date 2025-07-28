import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ArrowDown,
  Brain
} from 'lucide-react';
import { usePageTheme } from '../../contexts/ThemeContext';
import { supabaseServices } from '../../services/supabaseServices';
import { BackButton } from '../../components';
import { HistoryManager } from './components/HistoryManager';
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
      </div>
    </div>
  );
};

export default EpistemicDriver;
