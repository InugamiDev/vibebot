import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { config, presets, models } from './config.js';
import { AgentOrchestrator } from './agent.js';
import { VibeTaskConfig } from './types.js';

export class DiscordBot {
  private client: Client;
  private agent: AgentOrchestrator;
  private rest: REST;

  constructor(agent: AgentOrchestrator) {
    this.agent = agent;
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });
    this.rest = new REST({ version: '10' }).setToken(config.discord.token);
  }

  async start(): Promise<void> {
    await this.registerCommands();
    
    this.client.on('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleCommand(interaction);
    });

    await this.client.login(config.discord.token);
  }

  private async registerCommands(): Promise<void> {
    const commands = [
      new SlashCommandBuilder()
        .setName('vibe')
        .setDescription('Execute an AI dev task')
        .addStringOption((option) =>
          option
            .setName('repo')
            .setDescription('GitHub repository (owner/repo or URL)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('idea')
            .setDescription('Description of the task to implement')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('base')
            .setDescription('Base branch (default: main)')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('model')
            .setDescription('AI model to use')
            .setRequired(false)
            .addChoices(
              ...Object.keys(models).map((key) => ({ name: key, value: key }))
            )
        )
        .addStringOption((option) =>
          option
            .setName('preset')
            .setDescription('Configuration preset')
            .setRequired(false)
            .addChoices(
              ...Object.keys(presets).map((key) => ({ name: key, value: key }))
            )
        )
        .addNumberOption((option) =>
          option
            .setName('maxcost')
            .setDescription('Maximum cost in USD')
            .setRequired(false)
            .setMinValue(0.1)
            .setMaxValue(100)
        )
        .addIntegerOption((option) =>
          option
            .setName('maxtime')
            .setDescription('Maximum time in seconds')
            .setRequired(false)
            .setMinValue(60)
            .setMaxValue(7200)
        ),
      
      new SlashCommandBuilder()
        .setName('vibe-status')
        .setDescription('Check status of a vibe task')
        .addStringOption((option) =>
          option
            .setName('taskid')
            .setDescription('Task ID to check')
            .setRequired(true)
        ),
      
      new SlashCommandBuilder()
        .setName('vibe-list')
        .setDescription('List all active vibe tasks'),
    ];

    try {
      console.log('Registering Discord slash commands...');
      await this.rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands.map((cmd) => cmd.toJSON()) }
      );
      console.log('Discord slash commands registered successfully');
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  }

  private async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      switch (interaction.commandName) {
        case 'vibe':
          await this.handleVibeCommand(interaction);
          break;
        case 'vibe-status':
          await this.handleStatusCommand(interaction);
          break;
        case 'vibe-list':
          await this.handleListCommand(interaction);
          break;
      }
    } catch (error) {
      console.error('Error handling command:', error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: `Error: ${message}` });
      } else {
        await interaction.reply({ content: `Error: ${message}`, ephemeral: true });
      }
    }
  }

  private async handleVibeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const taskConfig: VibeTaskConfig = {
      repo: interaction.options.getString('repo', true),
      idea: interaction.options.getString('idea', true),
      base: interaction.options.getString('base') || undefined,
      model: interaction.options.getString('model') || undefined,
      preset: interaction.options.getString('preset') || undefined,
      maxCost: interaction.options.getNumber('maxcost') || undefined,
      maxTime: interaction.options.getInteger('maxtime') || undefined,
    };

    // Normalize repo URL
    if (!taskConfig.repo.includes('/')) {
      await interaction.editReply('Invalid repository format. Use owner/repo or full GitHub URL.');
      return;
    }

    if (!taskConfig.repo.startsWith('http')) {
      taskConfig.repo = `https://github.com/${taskConfig.repo}`;
    }

    await interaction.editReply(
      `🚀 Starting vibe task...\n` +
      `**Repository**: ${taskConfig.repo}\n` +
      `**Task**: ${taskConfig.idea}\n` +
      `**Model**: ${taskConfig.model || config.agent.defaultModel}\n` +
      `**Preset**: ${taskConfig.preset || 'none'}\n\n` +
      `I'll update you when it's done!`
    );

    // Execute task asynchronously
    this.agent
      .executeTask(taskConfig)
      .then(async (execution) => {
        const message =
          `✅ Task completed!\n\n` +
          `**Task ID**: ${execution.id}\n` +
          `**Status**: ${execution.status}\n` +
          `**Duration**: ${this.formatDuration(execution)}\n` +
          `**Cost**: $${execution.totalCost.toFixed(4)}\n` +
          (execution.prUrl ? `**PR**: ${execution.prUrl}\n` : '') +
          `\n**Steps**: ${execution.steps.filter(s => s.status === 'completed').length}/${execution.steps.length} completed`;

        await interaction.followUp(message);
      })
      .catch(async (error) => {
        await interaction.followUp(
          `❌ Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      });
  }

  private async handleStatusCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const taskId = interaction.options.getString('taskid', true);
    const task = this.agent.getTask(taskId);

    if (!task) {
      await interaction.reply({ content: 'Task not found', ephemeral: true });
      return;
    }

    const completedSteps = task.steps.filter(s => s.status === 'completed').length;
    const message =
      `**Task Status**: ${task.status}\n` +
      `**Repository**: ${task.config.repo}\n` +
      `**Idea**: ${task.config.idea}\n` +
      `**Progress**: ${completedSteps}/${task.steps.length} steps\n` +
      `**Cost**: $${task.totalCost.toFixed(4)}\n` +
      `**Duration**: ${this.formatDuration(task)}\n` +
      (task.prUrl ? `**PR**: ${task.prUrl}` : '');

    await interaction.reply(message);
  }

  private async handleListCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const tasks = this.agent.getAllTasks();

    if (tasks.length === 0) {
      await interaction.reply({ content: 'No active tasks', ephemeral: true });
      return;
    }

    const lines = tasks.map((task) => {
      const status = task.status === 'completed' ? '✅' : task.status === 'failed' ? '❌' : '🔄';
      return `${status} \`${task.id.substring(0, 8)}\` - ${task.config.idea.substring(0, 50)}...`;
    });

    await interaction.reply(`**Active Tasks**:\n${lines.join('\n')}`);
  }

  private formatDuration(task: { startTime: Date; endTime?: Date }): string {
    const start = task.startTime.getTime();
    const end = task.endTime?.getTime() || Date.now();
    const seconds = Math.floor((end - start) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  async stop(): Promise<void> {
    await this.client.destroy();
  }
}
