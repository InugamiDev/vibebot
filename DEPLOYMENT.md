# Deployment Guide

## Prerequisites

- Node.js 20 or higher
- Discord Bot Token and Application ID
- GitHub Personal Access Token
- OpenAI API Key (or Anthropic API Key)

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section and click "Add Bot"
4. Under "Token", click "Reset Token" and copy it (this is your `DISCORD_TOKEN`)
5. Enable these Privileged Gateway Intents:
   - Server Members Intent (if needed)
   - Message Content Intent (if needed)
6. Go to "OAuth2" → "General" and copy the "Client ID" (this is your `DISCORD_CLIENT_ID`)
7. Go to "OAuth2" → "URL Generator":
   - Select scopes: `bot`, `applications.commands`
   - Select bot permissions: `Send Messages`, `Use Slash Commands`
   - Copy the generated URL and open it to invite the bot to your server

## GitHub Token Setup

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name and select these scopes:
   - `repo` (full control of private repositories)
   - `workflow` (if you need to trigger workflows)
4. Click "Generate token" and copy it (this is your `GITHUB_TOKEN`)

## OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (this is your `OPENAI_API_KEY`)

## Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your tokens:
```bash
# Discord Configuration
DISCORD_TOKEN=your_actual_discord_bot_token
DISCORD_CLIENT_ID=your_actual_discord_client_id

# GitHub Configuration
GITHUB_TOKEN=your_actual_github_token

# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_key

# Optional: Anthropic
# ANTHROPIC_API_KEY=your_anthropic_key

# Server Configuration (optional, defaults shown)
PORT=3000
WEB_UI_PORT=3001

# Agent Configuration (optional, defaults shown)
SANDBOX_DIR=./sandbox
MAX_COST_PER_TASK=10.00
MAX_TIME_PER_TASK=3600
DEFAULT_MODEL=gpt-4-turbo-preview
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start in development mode:
```bash
npm run dev
```

Or build and run in production mode:
```bash
npm run build
npm start
```

## Production Deployment

### Using PM2 (Process Manager)

1. Install PM2:
```bash
npm install -g pm2
```

2. Start the application:
```bash
pm2 start dist/index.js --name vibebot
```

3. Save the PM2 process list:
```bash
pm2 save
pm2 startup
```

### Using Docker

1. Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t vibebot .
docker run -d --env-file .env -p 3000:3000 -p 3001:3001 vibebot
```

### Using Systemd (Linux)

1. Create `/etc/systemd/system/vibebot.service`:
```ini
[Unit]
Description=VibeBot - AI Dev Agent
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/vibebot
Environment="NODE_ENV=production"
EnvironmentFile=/path/to/vibebot/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Enable and start:
```bash
sudo systemctl enable vibebot
sudo systemctl start vibebot
sudo systemctl status vibebot
```

## Security Considerations

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Rotate tokens regularly** - Especially if they might be compromised
3. **Use least privilege** - GitHub token should only have necessary permissions
4. **Monitor costs** - Set appropriate `MAX_COST_PER_TASK` limits
5. **Review PRs** - Always review AI-generated PRs before merging
6. **Sandbox isolation** - Sandbox directory is isolated, but still review changes

## Monitoring

### Logs

View logs with PM2:
```bash
pm2 logs vibebot
```

View logs with systemd:
```bash
journalctl -u vibebot -f
```

### Web UI

Access the web interface at `http://localhost:3001` to:
- View active tasks
- Monitor progress
- Check costs and timing
- Access PR links

### Health Checks

The application doesn't currently expose health endpoints, but you can check:
- Discord bot is online in your server
- Web UI is accessible
- Process is running

## Troubleshooting

### Bot not responding to commands

1. Check bot is online in Discord
2. Verify `DISCORD_TOKEN` is correct
3. Check bot has proper permissions
4. Ensure slash commands are registered (happens on startup)

### GitHub operations failing

1. Verify `GITHUB_TOKEN` has correct permissions
2. Check repository access
3. Ensure token isn't expired

### AI requests failing

1. Verify `OPENAI_API_KEY` is valid
2. Check API quota/billing
3. Try a different model

### High costs

1. Lower `MAX_COST_PER_TASK` in `.env`
2. Use cheaper models (gpt-3.5-turbo)
3. Use "fast" preset
4. Monitor active tasks in Web UI

## Updating

```bash
git pull
npm install
npm run build
pm2 restart vibebot  # or your process manager
```
