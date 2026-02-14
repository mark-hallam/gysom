/**
 * GYSOM Core Type Definitions
 * All TypeScript interfaces for the prompt compiler pipeline.
 */

// ============================================================================
// PROJECT & COMPILATION TYPES
// ============================================================================

export interface ProjectManifest {
  name: string;
  description: string;
  goals: string[];
  constraints: string[];
  techStack: string[];
  complexityScore: number;
  estimatedAgents: number;
  estimatedTokens: number;
  projectType: ProjectType;
}

export type ProjectType =
  | "SaaS"
  | "ecommerce"
  | "api"
  | "mobile"
  | "cli"
  | "data_pipeline";

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  rawInput: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = "draft" | "compiling" | "completed" | "failed";

// ============================================================================
// DEPENDENCY GRAPH & DAG TYPES
// ============================================================================

export type NodeType =
  | "feature"
  | "module"
  | "integration"
  | "infrastructure"
  | "test"
  | "documentation";

export type EdgeType = "blocking" | "soft";

export interface DependencyNode {
  id: string;
  label: string;
  type: NodeType;
  agentRole: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  layer: number;
  estimatedTokens: number;
  description?: string;
  priority: Priority;
}

export type Priority = "critical" | "high" | "normal" | "low";

export interface DependencyEdge {
  source: string;
  target: string;
  type: EdgeType;
  description?: string;
}

export interface CriticalPath {
  nodes: string[];
  estimatedTokens: number;
  estimatedDuration: string;
}

export interface DAG {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  criticalPath: CriticalPath;
  parallelismScore: number;
  layers: DependencyNode[][];
  estimatedTotalTokens: number;
}

// ============================================================================
// AGENT & ROLE TYPES
// ============================================================================

export type ModelTier = "opus46" | "opus45" | "sonnet45";

export interface AgentRole {
  id: string;
  name: string;
  description: string;
  model: ModelTier;
  ownedFiles: string[];
  dependencies: string[];
  claudeMdSnippet: string;
  expertise: string[];
  priority: Priority;
  estimatedTokens: number;
}

export interface AgentAssignment {
  roleId: string;
  tasks: Task[];
  estimatedTokens: number;
  priority: Priority;
  dependencies: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  files: string[];
  completionCriteria: string[];
  blockedBy: string[];
  estimatedTokens: number;
}

// ============================================================================
// HUMAN DECISION TYPES
// ============================================================================

export interface DecisionOption {
  value: string;
  label: string;
  description: string;
  impact?: string;
}

export type DecisionCategory =
  | "architecture"
  | "technology"
  | "strategy"
  | "trade-off"
  | "configuration";

export type DecisionUrgency = "blocking" | "high" | "normal" | "optional";

export interface HumanDecision {
  id: string;
  category: DecisionCategory;
  question: string;
  description: string;
  options: DecisionOption[];
  defaultOption: string;
  urgency: DecisionUrgency;
  blockingTasks: string[];
  context?: string;
}

export interface DecisionQueue {
  decisions: HumanDecision[];
  answeredCount: number;
  totalCount: number;
  answers: Record<string, string>;
}

export interface DecisionAnswer {
  decisionId: string;
  selectedOption: string;
  reasoning?: string;
}

// ============================================================================
// EXECUTION PROMPT TYPES
// ============================================================================

export interface ExecutionPrompt {
  id: string;
  agentRole: string;
  layer: number;
  prompt: string;
  dependencies: string[];
  completionCriteria: string[];
  expectedOutput: string;
  estimatedTokens: number;
  handoff?: string;
}

export interface ExecutionPlan {
  manifest: ProjectManifest;
  dag: DAG;
  agents: AgentRole[];
  assignments: AgentAssignment[];
  decisionQueue: DecisionQueue;
  prompts: ExecutionPrompt[];
  tokenBudget: TokenBudget;
  layers: ExecutionPrompt[][];
}

// ============================================================================
// TOKEN BUDGET TYPES
// ============================================================================

export interface TokenBudgetByAgent {
  agentId: string;
  agentName: string;
  estimated: number;
  allocated: number;
  model: ModelTier;
}

export interface TokenBudgetByStage {
  stage: string;
  estimated: number;
  allocated: number;
  model: ModelTier;
}

export interface TokenBudgetOptimization {
  suggestion: string;
  impact: string;
  difficulty: "easy" | "moderate" | "hard";
}

export interface TokenBudget {
  totalEstimate: number;
  totalAllocated: number;
  byAgent: TokenBudgetByAgent[];
  byStage: TokenBudgetByStage[];
  modelDistribution: Record<ModelTier, number>;
  optimizationSuggestions: TokenBudgetOptimization[];
}

// ============================================================================
// PIPELINE & COMPILATION TYPES
// ============================================================================

export type PipelineStageName =
  | "intent-extraction"
  | "dependency-analysis"
  | "agent-assignment"
  | "human-decision-id"
  | "prompt-generation"
  | "execution-plan";

export interface PipelineStage {
  name: PipelineStageName;
  number: number;
  status: "pending" | "running" | "completed" | "failed";
  inputType: string;
  outputType: string;
  model: ModelTier;
  duration?: number;
  tokensUsed?: number;
  error?: string;
}

export interface CompilationConfig {
  userPreferences: {
    modelTier: ModelTier;
    maxTokens: number;
    parallelism: "aggressive" | "moderate" | "conservative";
  };
  outputFormats: ("markdown" | "json" | "code")[];
  includeTimings: boolean;
}

export interface CompilationResult {
  id: string;
  projectId: string;
  manifest: ProjectManifest;
  dag: DAG;
  agentAssignments: AgentRole[];
  decisionQueue: DecisionQueue;
  executionPrompts: ExecutionPrompt[];
  tokenBudget: TokenBudget;
  status: "pending" | "executing" | "completed" | "failed";
  errorLog?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompilationSession {
  projectId: string;
  stages: PipelineStage[];
  currentStage: PipelineStageName;
  progress: number;
  result?: CompilationResult;
  error?: string;
  startTime: number;
  endTime?: number;
}

// ============================================================================
// UI & COMPONENT TYPES
// ============================================================================

export interface ProjectInputState {
  description: string;
  projectType: ProjectType;
  isLoading: boolean;
  error?: string;
}

export interface DAGNode {
  id: string;
  data: { label: string; layer: number; type: NodeType };
  position: { x: number; y: number };
}

export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
}

export interface CompilationUIState {
  currentStep: number;
  steps: string[];
  results: Partial<CompilationResult>;
  isLoading: boolean;
  error?: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportOptions {
  format: "markdown" | "json" | "html";
  includeTimings: boolean;
  splitByAgent: boolean;
}

export interface ExportedContent {
  claudeMd: string;
  agentsMd: string;
  executeJson?: Record<string, ExecutionPrompt>;
  summary: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface CompileRequest {
  description: string;
  projectType: ProjectType;
  modelTier: ModelTier;
  maxTokens?: number;
}

export interface CompileResponse {
  id: string;
  result: CompilationResult;
}

export interface StreamEvent {
  type: "stage_start" | "stage_complete" | "chunk" | "error" | "complete";
  stage?: PipelineStageName;
  data: string;
  progress: number;
  timestamp: number;
}
