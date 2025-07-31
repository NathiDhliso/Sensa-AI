// Business Lens Types

export interface BusinessLensInput {
  companyName: string;
  companyType: string;
  studyGuideText: string;
}

export interface ExtractedTool {
  name: string;
  category?: string;
}

export interface BusinessScenario {
  start: {
    title: string;
    description: string;
  };
  goal: {
    title: string;
    description: string;
  };
}

export interface DecisionPoint {
  id: string;
  question: string;
  options: {
    id: string;
    label: string;
    tool: string;
    description: string;
  }[];
}

export interface WorkflowPhase {
  id: string;
  title: string;
  description: string;
  tools: string[];
  decisionPoints?: DecisionPoint[];
  nextPhase?: string;
}

export interface ProjectWorkflow {
  phases: WorkflowPhase[];
  narrative: string;
}

export interface GraphvizNode {
  id: string;
  label: string;
  shape?: string;
  style?: string;
  color?: string;
}

export interface GraphvizEdge {
  from: string;
  to: string;
  label?: string;
  style?: string;
}

export interface GraphvizDiagram {
  nodes: GraphvizNode[];
  edges: GraphvizEdge[];
  clusters: {
    id: string;
    label: string;
    nodes: string[];
  }[];
}

export interface BusinessLensResponse {
  extractedTools: ExtractedTool[];
  scenario: BusinessScenario;
  workflow: ProjectWorkflow;
  graphvizCode: string;
  diagram: GraphvizDiagram;
}

export interface BusinessLensState {
  isLoading: boolean;
  error: string | null;
  data: BusinessLensResponse | null;
  currentStep: 'input' | 'processing' | 'results';
}