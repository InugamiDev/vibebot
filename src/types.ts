export interface VibeTaskConfig {
  repo: string;
  base?: string;
  idea: string;
  model?: string;
  maxCost?: number;
  maxTime?: number;
  preset?: string;
}

export interface ModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  costPerToken: number;
  maxTokens: number;
}

export interface PresetConfig {
  name: string;
  model?: string;
  maxCost?: number;
  maxTime?: number;
  systemPrompt?: string;
}

export interface AgentStep {
  type: 'read' | 'edit' | 'test' | 'doc' | 'pr';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface TaskExecution {
  id: string;
  config: VibeTaskConfig;
  steps: AgentStep[];
  status: 'planning' | 'executing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalCost: number;
  branch?: string;
  prUrl?: string;
}
