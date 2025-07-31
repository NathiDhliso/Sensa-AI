// TypeScript interfaces for Epistemic Driver feature

/**
 * Input data for generating epistemic driver
 */
export interface EpistemicDriverInput {
  subject: string;
  objectives: string;
}

/**
 * Point types for epistemological drivers (the "Why")
 */
export type EpistemologicalDriverType = 'Concept/Fact' | 'Process/Explanation' | 'Implication/Application';

/**
 * Point types for methodology (the "How")
 */
export type MethodologyType = 'Technical Component' | 'Operational Process' | 'Direct Result';

/**
 * Point types for application (the "So What")
 */
export type ApplicationType = 'Strategic Driver' | 'Execution Strategy' | 'Business Impact';

/**
 * Individual point in epistemological drivers
 */
export interface EpistemologicalDriverPoint {
  type: EpistemologicalDriverType;
  content: string;
}

/**
 * Individual point in methodology section
 */
export interface MethodologyPoint {
  type: MethodologyType;
  content: string;
}

/**
 * Individual point in application section
 */
export interface ApplicationPoint {
  type: ApplicationType;
  content: string;
}

/**
 * Epistemological drivers section (the "Why")
 */
export interface EpistemologicalDrivers {
  pillar: string;
  points: EpistemologicalDriverPoint[];
}

/**
 * Methodology section for a learning path
 */
export interface MethodologySection {
  pillar: string;
  points: MethodologyPoint[];
}

/**
 * Application section for a learning path
 */
export interface ApplicationSection {
  pillar: string;
  points: ApplicationPoint[];
}

/**
 * Individual learning path (domain-specific)
 */
export interface LearningPath {
  domain: string;
  methodology: MethodologySection;
  application: ApplicationSection;
}

/**
 * Complete epistemic driver response
 */
export interface EpistemicDriverResponse {
  epistemological_drivers: EpistemologicalDrivers;
  learning_paths: LearningPath[];
  connecting_link: string;
}

/**
 * API response wrapper
 */
export interface EpistemicDriverApiResponse {
  success: boolean;
  data?: EpistemicDriverResponse;
  error?: string;
  timestamp: string;
  request_id?: string;
  processing_time_ms?: number;
}

/**
 * Component state for the epistemic driver
 */
export interface EpistemicDriverState {
  isLoading: boolean;
  error: string | null;
  data: EpistemicDriverResponse | null;
  expandedAccordion: string | null;
}

/**
 * Props for accordion components
 */
export interface AccordionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * Props for pillar content components
 */
export interface PillarContentProps {
  methodology: MethodologySection;
  application: ApplicationSection;
}

/**
 * Props for point list components
 */
export interface PointListProps {
  title: string;
  points: (MethodologyPoint | ApplicationPoint)[];
  colorClass: string;
}

/**
 * Props for foundation section
 */
export interface FoundationSectionProps {
  epistemologicalDrivers: EpistemologicalDrivers;
}

/**
 * Props for learning paths section
 */
export interface LearningPathsSectionProps {
  learningPaths: LearningPath[];
  expandedAccordion: string | null;
  onAccordionToggle: (domain: string) => void;
}

/**
 * Props for connecting link section
 */
export interface ConnectingLinkProps {
  connectingLink: string;
}

/**
 * Learning strategy phase for the cohesive cycle
 */
export interface LearningStrategyPhase {
  title: string;
  subtitle: string;
  description: string;
  techniques: string[];
  icon: string;
  color: string;
}

/**
 * Props for learning strategy section
 */
export interface LearningStrategySectionProps {
  phases: LearningStrategyPhase[];
}

/**
 * Form validation errors
 */
export interface FormErrors {
  subject?: string;
  objectives?: string;
}

/**
 * Props for input form component
 */
export interface InputFormProps {
  onSubmit: (data: EpistemicDriverInput) => void;
  isLoading: boolean;
  errors: FormErrors;
}

/**
 * Props for loading state component
 */
export interface LoadingStateProps {
  message?: string;
}

/**
 * Props for error state component
 */
export interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

/**
 * Theme colors for epistemic driver
 */
export interface EpistemicDriverTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  border: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  gradients: {
    foundation: string;
    methodology: string;
    application: string;
    strategy: string;
  };
}

/**
 * Epistemic driver history entry
 */
export interface EpistemicDriverHistoryEntry {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  objectives: string;
  study_map_data: EpistemicDriverResponse;
  is_favorite: boolean;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input for saving epistemic driver to history
 */
export interface SaveEpistemicDriverInput {
  title: string;
  subject: string;
  objectives: string;
  study_map_data: EpistemicDriverResponse;
  tags?: string[];
  notes?: string;
  is_favorite?: boolean;
}

/**
 * Input for updating epistemic driver history entry
 */
export interface UpdateEpistemicDriverHistoryInput {
  id: string;
  title?: string;
  tags?: string[];
  notes?: string;
  is_favorite?: boolean;
}

/**
 * Props for history manager component
 */
export interface HistoryManagerProps {
  currentData: EpistemicDriverResponse | null;
  currentInput: EpistemicDriverInput | null;
  onLoadFromHistory: (entry: EpistemicDriverHistoryEntry) => void;
  onSaveSuccess?: () => void;
  onMindmapGenerated?: () => void;
}

/**
 * Props for history list component
 */
export interface HistoryListProps {
  onSelectEntry: (entry: EpistemicDriverHistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (input: UpdateEpistemicDriverHistoryInput) => void;
  selectedEntryId?: string;
}
