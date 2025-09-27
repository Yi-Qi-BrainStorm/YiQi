// 组件Props和Emits类型定义

// 认证组件类型
export interface LoginFormProps {
  loading?: boolean;
  error?: string;
}

export interface LoginFormEmits {
  (e: 'submit', credentials: import('./user').LoginCredentials): void;
}

export interface RegisterFormProps {
  loading?: boolean;
  error?: string;
}

export interface RegisterFormEmits {
  (e: 'submit', userData: import('./user').RegisterData): void;
}

// 代理组件类型
export interface AgentCardProps {
  agent: import('./agent').Agent;
  selectable?: boolean;
  selected?: boolean;
}

export interface AgentCardEmits {
  (e: 'edit', agent: import('./agent').Agent): void;
  (e: 'delete', agentId: string): void;
  (e: 'duplicate', agent: import('./agent').Agent): void;
  (e: 'select', agentId: string): void;
  (e: 'deselect', agentId: string): void;
}

export interface AgentFormProps {
  agent?: import('./agent').Agent;
  availableModels: import('./agent').AIModel[];
  loading?: boolean;
}

export interface AgentFormEmits {
  (e: 'submit', agentData: import('./agent').AgentFormData): void;
  (e: 'cancel'): void;
}

export interface AgentListProps {
  agents: import('./agent').Agent[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
}

export interface AgentListEmits {
  (e: 'create-new'): void;
  (e: 'edit', agent: import('./agent').Agent): void;
  (e: 'delete', agentId: string): void;
  (e: 'selection-change', selectedIds: string[]): void;
}

// 头脑风暴组件类型
export interface BrainstormSessionProps {
  sessionId: string;
  currentStage: import('./brainstorm').BrainstormStage;
  agents: import('./agent').Agent[];
}

export interface BrainstormSessionEmits {
  (e: 'stage-complete', results: import('./brainstorm').StageResult): void;
  (e: 'restart-stage'): void;
  (e: 'session-complete', finalReport: import('./brainstorm').FinalReport): void;
}

export interface AgentThinkingPanelProps {
  agent: import('./agent').Agent;
  status: import('./agent').AgentStatus;
  result?: import('./agent').AgentResult;
}

export interface AgentThinkingPanelEmits {
  (e: 'view-details', result: import('./agent').AgentResult): void;
}

export interface StageProgressIndicatorProps {
  currentStage: number;
  totalStages: number;
  stageNames: string[];
  completedStages: boolean[];
}

export interface StageSummaryProps {
  summary: import('./brainstorm').AISummary;
  agentResults: import('./agent').AgentResult[];
  isLastStage?: boolean;
}

export interface StageSummaryEmits {
  (e: 'proceed-to-next'): void;
  (e: 'restart-stage'): void;
}

export interface SessionCreatorProps {
  availableAgents: import('./agent').Agent[];
  loading?: boolean;
}

export interface SessionCreatorEmits {
  (e: 'create-session', data: { topic: string; agentIds: string[] }): void;
  (e: 'cancel'): void;
}

// 结果展示组件类型
export interface AgentResultCardProps {
  result: import('./agent').AgentResult;
  expanded?: boolean;
}

export interface AgentResultCardEmits {
  (e: 'toggle-expand'): void;
  (e: 'save-result', result: import('./agent').AgentResult): void;
  (e: 'share-result', result: import('./agent').AgentResult): void;
}

export interface ResultReportProps {
  finalReport: import('./brainstorm').FinalReport;
  exportFormats?: string[];
}

export interface ResultReportEmits {
  (e: 'export', format: string): void;
  (e: 'share'): void;
  (e: 'save-draft'): void;
}

// 通用组件类型
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

export interface ErrorBoundaryProps {
  fallback?: string;
  showRefresh?: boolean;
}

export interface ErrorBoundaryEmits {
  (e: 'retry'): void;
  (e: 'refresh'): void;
}

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface ConfirmDialogEmits {
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'update:visible', visible: boolean): void;
}

// 布局组件类型
export interface MainLayoutProps {
  collapsed?: boolean;
}

export interface MainLayoutEmits {
  (e: 'toggle-sidebar'): void;
}

export interface SidebarProps {
  collapsed: boolean;
  currentRoute: string;
}

export interface SidebarEmits {
  (e: 'navigate', path: string): void;
}

export interface HeaderProps {
  user?: import('./user').User;
  title?: string;
}

export interface HeaderEmits {
  (e: 'logout'): void;
  (e: 'profile'): void;
  (e: 'settings'): void;
}

// 表单组件类型
export interface FormValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean | string;
  message?: string;
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rules?: FormValidationRule[];
  options?: { label: string; value: any }[];
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

export interface FileUploadEmits {
  (e: 'upload', files: File[]): void;
  (e: 'remove', file: File): void;
  (e: 'error', error: string): void;
}

// 数据展示组件类型
export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
  };
  selectable?: boolean;
  selectedKeys?: string[];
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => any;
}

export interface DataTableEmits<T = any> {
  (e: 'selection-change', selectedKeys: string[], selectedRows: T[]): void;
  (e: 'page-change', page: number, pageSize: number): void;
  (e: 'sort-change', field: string, order: 'asc' | 'desc' | null): void;
  (e: 'filter-change', filters: Record<string, any>): void;
}

// 图表组件类型
export interface ChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'area';
  width?: number;
  height?: number;
  options?: Record<string, any>;
}

export interface ChartEmits {
  (e: 'data-point-click', data: any): void;
  (e: 'legend-click', legend: any): void;
}