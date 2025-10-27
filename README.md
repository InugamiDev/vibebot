# 🤖 VibeBot

**VibeCode: Local AI Dev Agent + UI**

VibeBot is an AI-powered development agent that executes coding tasks through Discord commands. It clones repositories, plans and executes changes using AI models, runs tests, and creates pull requests—all in a sandboxed environment.

## Features

- 🎮 **Discord Integration**: Control tasks via `/vibe` slash command
- 🤖 **AI Agent Orchestrator**: Plans and executes development tasks autonomously
- 🔧 **Sandbox Execution**: Safe isolated environment for code changes
- 🌐 **Web UI**: Monitor and manage tasks through a browser interface
- 🔀 **GitHub Sync**: Automatic branch creation and PR opening
- 💰 **Cost & Time Caps**: Built-in limits to control resource usage
- 🎯 **Model Routing**: Support for multiple AI models (GPT-4, Claude, etc.)
- ⚡ **Presets**: Quick configurations (fast, balanced, thorough)

## Quick Start

### Prerequisites

- Node.js 20+
- Discord Bot Token
- GitHub Personal Access Token
- OpenAI API Key (and/or Anthropic API Key)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/InugamiDev/vibebot.git
cd vibebot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your tokens:
- `DISCORD_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your Discord application client ID
- `GITHUB_TOKEN`: Your GitHub personal access token
- `OPENAI_API_KEY`: Your OpenAI API key

4. Build the project:
```bash
npm run build
```

5. Start the bot:
```bash
npm start
```

Or run in development mode:
```bash
npm run dev
```

## Usage

### Discord Commands

#### `/vibe` - Execute a development task

**Required Parameters:**
- `repo`: GitHub repository (owner/repo or full URL)
- `idea`: Description of what to implement

**Optional Parameters:**
- `base`: Base branch (default: main)
- `model`: AI model to use (gpt-4-turbo-preview, gpt-3.5-turbo, claude-3-opus, claude-3-sonnet)
- `preset`: Configuration preset (fast, balanced, thorough)
- `maxcost`: Maximum cost in USD (0.1-100)
- `maxtime`: Maximum time in seconds (60-7200)

**Example:**
```
/vibe repo:myorg/myrepo idea:Add user authentication with JWT base:develop model:gpt-4-turbo-preview
```

#### `/vibe-status` - Check task status

Check the status of a running or completed task:
```
/vibe-status taskid:abc12345
```

#### `/vibe-list` - List all tasks

View all active and recent tasks:
```
/vibe-list
```

### Web UI

Access the web interface at `http://localhost:3001` to:
- Create new tasks
- Monitor task progress in real-time
- View task history
- See detailed execution steps
- Access pull request links

## Configuration

### Models

Supported AI models:
- **GPT-4 Turbo**: High quality, best for complex tasks
- **GPT-3.5 Turbo**: Fast and cost-effective
- **Claude 3 Opus**: Excellent for thorough analysis
- **Claude 3 Sonnet**: Balanced performance

### Presets

**Fast**
- Model: GPT-3.5 Turbo
- Max Cost: $1.00
- Max Time: 10 minutes
- Best for: Quick fixes and simple tasks

**Balanced** (default)
- Model: GPT-4 Turbo
- Max Cost: $5.00
- Max Time: 30 minutes
- Best for: Most development tasks

**Thorough**
- Model: Claude 3 Opus
- Max Cost: $10.00
- Max Time: 60 minutes
- Best for: Complex refactoring and new features

## Architecture

```
┌─────────────┐
│   Discord   │ ──┐
│     Bot     │   │
└─────────────┘   │
                  ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│   Web UI    │──│    Agent     │──│   GitHub    │
│   Server    │  │ Orchestrator │  │   Service   │
└─────────────┘  └──────────────┘  └─────────────┘
                        │
                        ▼
                  ┌──────────┐
                  │ AI Model │
                  │  Router  │
                  └──────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
         OpenAI    Anthropic     Custom
```

## Development

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Lint
```bash
npm run lint
```

### Development Mode
```bash
npm run dev
```

## Security

- All code execution happens in isolated sandbox directories
- GitHub tokens are used securely for API access
- API keys are stored in environment variables
- Cost and time limits prevent runaway execution

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open a GitHub issue.