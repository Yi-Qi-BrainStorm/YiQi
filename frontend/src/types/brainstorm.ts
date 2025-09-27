// 头脑风暴相关类型定义
import type { AgentResult, AgentResponse } from './agent';

export type SessionStatus = 'CREATED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type PhaseType = 'IDEA_GENERATION' | 'FEASIBILITY_ANALYSIS' | 'CRITICISM_DISCUSSION';
export type PhaseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface BrainstormSession {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  topic: string | null;
  status: SessionStatus;
  currentPhase: PhaseType | null;
  createdAt: string;
  updatedAt: string;
  agents: SessionAgent[];
  phases: Phase[];
  report?: Report;
}

export interface SessionAgent {
  id: number;
  sessionId: number;
  agentId: number;
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
  agent: {
    id: number;
    name: string;
    roleType: string;
    aiModel: string;
  };
}

export interface Phase {
  id: number;
  sessionId: number;
  phaseType: PhaseType;
  status: PhaseStatus;
  summary: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  responses: AgentResponse[];
}

export interface Report {
  id: number;
  sessionId: number;
  title: string;
  content: string; // JSON格式的报告内容
  status: 'GENERATING' | 'GENERATED' | 'FAILED';
  filePath: string | null;
  generatedAt: string;
}

export interface StageResult {
  phase: Phase;
  agentResults: AgentResult[];
  aiSummary: AISummary;
}

export interface AISummary {
  keyPoints: string[];
  commonSuggestions: string[];
  conflictingViews: ConflictingView[];
  overallAssessment: string;
  nextStepRecommendations: string[];
}

export interface ConflictingView {
  topic: string;
  agentViews: {
    agentId: string;
    agentName: string;
    viewpoint: string;
  }[];
  analysis: string;
}

export interface FinalReport {
  sessionId: number;
  topic: string;
  executiveSummary: string;
  designConcept: DesignConcept;
  technicalSolution: TechnicalSolution;
  marketingStrategy: MarketingStrategy;
  implementationPlan: ImplementationPlan;
  riskAssessment: RiskAssessment;
  generatedAt: string;
}

export interface DesignConcept {
  productType: string;
  culturalBackground: string;
  designElements: string[];
  visualDescription: string;
  targetAudience: string;
}

export interface TechnicalSolution {
  materials: string[];
  productionProcess: string[];
  qualityStandards: string[];
  costEstimation: CostBreakdown;
  timeline: ProductionTimeline;
}

export interface MarketingStrategy {
  positioningStatement: string;
  channels: MarketingChannel[];
  campaigns: MarketingCampaign[];
  budget: MarketingBudget;
  kpis: string[];
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  resources: ResourceRequirement[];
  milestones: Milestone[];
  totalDuration: number;
}

export interface RiskAssessment {
  risks: Risk[];
  mitigationStrategies: MitigationStrategy[];
  overallRiskLevel: 'low' | 'medium' | 'high';
}

// 支持类型
export interface CostBreakdown {
  materials: number;
  labor: number;
  overhead: number;
  total: number;
  currency: string;
}

export interface ProductionTimeline {
  phases: TimelinePhase[];
  totalDuration: number;
  unit: 'days' | 'weeks' | 'months';
}

export interface TimelinePhase {
  name: string;
  duration: number;
  dependencies: string[];
}

export interface MarketingChannel {
  name: string;
  type: 'digital' | 'traditional' | 'social' | 'direct';
  budget: number;
  expectedReach: number;
}

export interface MarketingCampaign {
  name: string;
  description: string;
  channels: string[];
  budget: number;
  duration: number;
  expectedROI: number;
}

export interface MarketingBudget {
  total: number;
  breakdown: {
    advertising: number;
    content: number;
    events: number;
    other: number;
  };
  currency: string;
}

export interface ImplementationPhase {
  name: string;
  description: string;
  duration: number;
  tasks: string[];
  dependencies: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'equipment' | 'material' | 'financial';
  name: string;
  quantity: number;
  cost: number;
}

export interface Milestone {
  name: string;
  description: string;
  dueDate: string;
  deliverables: string[];
}

export interface Risk {
  id: string;
  category: 'technical' | 'market' | 'financial' | 'operational';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  severity: number; // 1-10
}

export interface MitigationStrategy {
  riskId: string;
  strategy: string;
  cost: number;
  effectiveness: number; // 1-10
}

// 会话创建相关类型
export interface CreateSessionRequest {
  title: string;
  description?: string;
  topic: string;
  agentIds: number[];
}

export interface SessionCreationResponse {
  session: BrainstormSession;
  message: string;
}

// 阶段进度相关类型
export interface StageProgress {
  current: number;
  total: number;
  stages: string[];
  completed: boolean[];
}

// WebSocket事件类型
export interface SocketEvents {
  'brainstorm:start': {
    sessionId: number;
    topic: string;
    agentIds: number[];
  };
  'brainstorm:proceed': {
    sessionId: number;
    phaseType: PhaseType;
  };
  'brainstorm:restart-phase': {
    sessionId: number;
    phaseType: PhaseType;
  };
  'agent:status-update': {
    sessionId: number;
    agentId: number;
    status: import('./agent').AgentRuntimeStatus;
  };
  'agent:result': {
    sessionId: number;
    agentId: number;
    result: import('./agent').AgentResult;
  };
  'phase:summary': {
    sessionId: number;
    phaseType: PhaseType;
    summary: AISummary;
  };
  'session:complete': {
    sessionId: number;
    finalReport: FinalReport;
  };
}