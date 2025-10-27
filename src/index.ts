import { AgentOrchestrator } from './agent.js';
import { DiscordBot } from './discord.js';
import { WebUI } from './webui.js';
import { config } from './config.js';

async function main() {
  console.log('🤖 Starting VibeBot...');

  // Validate configuration
  if (!config.discord.token) {
    console.error('❌ DISCORD_TOKEN is not set in environment variables');
    process.exit(1);
  }

  if (!config.github.token) {
    console.error('❌ GITHUB_TOKEN is not set in environment variables');
    process.exit(1);
  }

  if (!config.openai.apiKey) {
    console.error('❌ OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
  }

  try {
    // Initialize agent orchestrator
    const agent = new AgentOrchestrator();
    console.log('✅ Agent orchestrator initialized');

    // Start Discord bot
    const bot = new DiscordBot(agent);
    await bot.start();
    console.log('✅ Discord bot started');

    // Start Web UI
    const webui = new WebUI(agent);
    await webui.start();
    console.log('✅ Web UI started');

    console.log('\n🎉 VibeBot is ready!');
    console.log(`   Discord: Connected as ${config.discord.clientId}`);
    console.log(`   Web UI: http://localhost:${config.server.webUiPort}`);
    console.log('\nUse /vibe command in Discord to start tasks');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n👋 Shutting down...');
      await bot.stop();
      await webui.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
