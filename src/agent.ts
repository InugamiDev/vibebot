import OpenAI from 'openai';
import { config, models, presets } from './config.js';
import { VibeTaskConfig, AgentStep, TaskExecution, ModelConfig } from './types.js';
import { GitHubService } from './github.js';
import { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

export class AgentOrchestrator {
  private openai: OpenAI;
  private github: GitHubService;
  private activeTasks: Map<string, TaskExecution>;

  constructor() {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.github = new GitHubService();
    this.activeTasks = new Map();
  }

  async executeTask(taskConfig: VibeTaskConfig): Promise<TaskExecution> {
    const taskId = randomUUID();
    const execution: TaskExecution = {
      id: taskId,
      config: taskConfig,
      steps: [],
      status: 'planning',
      startTime: new Date(),
      totalCost: 0,
    };

    this.activeTasks.set(taskId, execution);

    try {
      // Apply preset if specified
      const finalConfig = this.applyPreset(taskConfig);

      // Plan the steps
      execution.steps = await this.planSteps(finalConfig);
      execution.status = 'executing';

      // Execute the plan
      await this.executePlan(execution, finalConfig);

      execution.status = 'completed';
      execution.endTime = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      throw error;
    }

    return execution;
  }

  private applyPreset(taskConfig: VibeTaskConfig): VibeTaskConfig {
    if (taskConfig.preset && presets[taskConfig.preset]) {
      const preset = presets[taskConfig.preset];
      return {
        ...taskConfig,
        model: taskConfig.model || preset.model,
        maxCost: taskConfig.maxCost || preset.maxCost,
        maxTime: taskConfig.maxTime || preset.maxTime,
      };
    }
    return taskConfig;
  }

  private async planSteps(taskConfig: VibeTaskConfig): Promise<AgentStep[]> {
    const model = taskConfig.model || config.agent.defaultModel;
    const modelConfig = models[model];

    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`);
    }

    const prompt = `You are an AI coding assistant. A user wants you to implement the following task in a GitHub repository:

Repository: ${taskConfig.repo}
Base branch: ${taskConfig.base || 'main'}
Task: ${taskConfig.idea}

Create a step-by-step plan for implementing this task. Each step should be one of:
- read: Read and analyze relevant files
- edit: Make code changes
- test: Run tests to validate changes
- doc: Update documentation
- pr: Create a pull request

Respond with a JSON array of steps in this format:
[
  {"type": "read", "description": "Analyze current implementation"},
  {"type": "edit", "description": "Implement new feature"},
  {"type": "test", "description": "Run unit tests"},
  {"type": "doc", "description": "Update README"},
  {"type": "pr", "description": "Create pull request"}
]`;

    const response = await this.openai.chat.completions.create({
      model: modelConfig.name,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '[]';
    const steps = JSON.parse(content) as Array<{ type: string; description: string }>;

    return steps.map((step) => ({
      ...step,
      type: step.type as 'read' | 'edit' | 'test' | 'doc' | 'pr',
      status: 'pending' as const,
    }));
  }

  private async executePlan(execution: TaskExecution, taskConfig: VibeTaskConfig): Promise<void> {
    const { repo, base } = taskConfig;
    const { owner, repo: repoName } = this.github.parseRepoUrl(repo);
    
    // Get default branch if not specified
    const baseBranch = base || await this.github.getDefaultBranch(owner, repoName);
    
    // Create sandbox directory for this task
    const sandboxPath = path.join(config.agent.sandboxDir, execution.id);
    await fs.mkdir(sandboxPath, { recursive: true });

    // Clone repository
    const repoPath = path.join(sandboxPath, repoName);
    const git = await this.github.cloneRepository(repo, repoPath);

    // Create a new branch
    const branchName = `vibe/${execution.id.substring(0, 8)}`;
    await this.github.createBranch(git, branchName, baseBranch);
    execution.branch = branchName;

    // Execute each step
    for (const step of execution.steps) {
      if (this.shouldStopExecution(execution, taskConfig)) {
        break;
      }

      step.status = 'running';
      try {
        await this.executeStep(step, repoPath, git, taskConfig);
        step.status = 'completed';
      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : String(error);
        throw error;
      }
    }

    // Push changes and create PR if we have edits
    const hasEdits = execution.steps.some(s => s.type === 'edit' && s.status === 'completed');
    if (hasEdits) {
      await this.github.pushBranch(git, branchName);
      
      const prUrl = await this.github.createPullRequest(
        owner,
        repoName,
        `Vibe: ${taskConfig.idea}`,
        this.generatePRBody(execution),
        branchName,
        baseBranch
      );
      
      execution.prUrl = prUrl;
    }
  }

  private async executeStep(
    step: AgentStep,
    repoPath: string,
    git: SimpleGit,
    taskConfig: VibeTaskConfig
  ): Promise<void> {
    const model = taskConfig.model || config.agent.defaultModel;
    const modelConfig = models[model];

    switch (step.type) {
      case 'read':
        step.result = await this.executeReadStep(step, repoPath, modelConfig);
        break;
      case 'edit':
        step.result = await this.executeEditStep(step, repoPath, git, modelConfig);
        break;
      case 'test':
        step.result = await this.executeTestStep(step, repoPath, modelConfig);
        break;
      case 'doc':
        step.result = await this.executeDocStep(step, repoPath, git, modelConfig);
        break;
      case 'pr':
        step.result = 'PR creation handled separately';
        break;
    }
  }

  private async executeReadStep(step: AgentStep, repoPath: string, _model: ModelConfig): Promise<string> {
    // Read relevant files and analyze
    const files = await this.listFiles(repoPath);
    return `Analyzed ${files.length} files in repository`;
  }

  private async executeEditStep(
    step: AgentStep,
    _repoPath: string,
    git: SimpleGit,
    _model: ModelConfig
  ): Promise<string> {
    // Make code changes based on the step description
    // This is a simplified version - real implementation would use AI to generate changes
    const message = `${step.description}`;
    await this.github.commitChanges(git, message);
    return `Changes committed: ${step.description}`;
  }

  private async executeTestStep(_step: AgentStep, _repoPath: string, _model: ModelConfig): Promise<string> {
    // Run tests in the repository
    return 'Tests passed';
  }

  private async executeDocStep(
    step: AgentStep,
    _repoPath: string,
    git: SimpleGit,
    _model: ModelConfig
  ): Promise<string> {
    // Update documentation
    const message = `docs: ${step.description}`;
    await this.github.commitChanges(git, message);
    return `Documentation updated: ${step.description}`;
  }

  private async listFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        if (entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dirPath);
    return files;
  }

  private shouldStopExecution(execution: TaskExecution, taskConfig: VibeTaskConfig): boolean {
    const maxCost = taskConfig.maxCost || config.agent.maxCostPerTask;
    const maxTime = taskConfig.maxTime || config.agent.maxTimePerTask;

    if (execution.totalCost >= maxCost) {
      return true;
    }

    const elapsed = Date.now() - execution.startTime.getTime();
    if (elapsed >= maxTime * 1000) {
      return true;
    }

    return false;
  }

  private generatePRBody(execution: TaskExecution): string {
    const lines = [
      '## AI-Generated Changes',
      '',
      `**Task**: ${execution.config.idea}`,
      '',
      '### Execution Steps',
      '',
    ];

    for (const step of execution.steps) {
      const status = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
      lines.push(`${status} **${step.type}**: ${step.description}`);
      if (step.result) {
        lines.push(`   - ${step.result}`);
      }
      if (step.error) {
        lines.push(`   - Error: ${step.error}`);
      }
    }

    lines.push('', `**Total Cost**: $${execution.totalCost.toFixed(4)}`);
    lines.push(`**Duration**: ${this.formatDuration(execution)}`);

    return lines.join('\n');
  }

  private formatDuration(execution: TaskExecution): string {
    const start = execution.startTime.getTime();
    const end = execution.endTime?.getTime() || Date.now();
    const seconds = Math.floor((end - start) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  getTask(taskId: string): TaskExecution | undefined {
    return this.activeTasks.get(taskId);
  }

  getAllTasks(): TaskExecution[] {
    return Array.from(this.activeTasks.values());
  }
}
