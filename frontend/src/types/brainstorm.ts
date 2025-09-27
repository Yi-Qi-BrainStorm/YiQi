// 头脑风暴相关类型定义
import type { AgentResult } from './agent';

export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type BrainstormStage = 1 | 2 | 3;

export interface BrainstormSession {
  id: string;
  topic: string;
  userId: string;
  agentIds: string[];
  currentStage: number;
  status: SessionStatus;
  stageResults: StageResult[];
  finalReport?: FinalReport;
  createdAt: string;
  updatedAt: string;
}

export interface StageResult {
  stage: number;
  stageName: string;
  agentResults: AgentResult[];
  aiSummary: AISummary;
  completedAt: string;
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
  sessionId: string;
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
  topic: string;
  agentIds: string[];
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
    sessionId: string;
    topic: string;
    agentIds: string[];
  };
  'brainstorm:proceed': {
    sessionId: string;
    stage: number;
  };
  'brainstorm:restart-stage': {
    sessionId: string;
    stage: number;
  };
  'agent:status-update': {
    sessionId: string;
    agentId: string;
    status: import('./agent').AgentStatus;
  };
  'agent:result': {
    sessionId: string;
    agentId: string;
    result: import('./agent').AgentResult;
  };
  'stage:summary': {
    sessionId: string;
    stage: number;
    summary: AISummary;
  };
  'session:complete': {
    sessionId: string;
    finalReport: FinalReport;
  };
}