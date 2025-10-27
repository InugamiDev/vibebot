import dotenv from 'dotenv';
import { ModelConfig, PresetConfig } from './types.js';

dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    webUiPort: parseInt(process.env.WEB_UI_PORT || '3001'),
  },
  agent: {
    sandboxDir: process.env.SANDBOX_DIR || './sandbox',
    maxCostPerTask: parseFloat(process.env.MAX_COST_PER_TASK || '10.00'),
    maxTimePerTask: parseInt(process.env.MAX_TIME_PER_TASK || '3600'),
    defaultModel: process.env.DEFAULT_MODEL || 'gpt-4-turbo-preview',
  },
};

export const models: Record<string, ModelConfig> = {
  'gpt-4-turbo-preview': {
    name: 'gpt-4-turbo-preview',
    provider: 'openai',
    costPerToken: 0.00001,
    maxTokens: 128000,
  },
  'gpt-3.5-turbo': {
    name: 'gpt-3.5-turbo',
    provider: 'openai',
    costPerToken: 0.0000015,
    maxTokens: 16385,
  },
  'claude-3-opus': {
    name: 'claude-3-opus-20240229',
    provider: 'anthropic',
    costPerToken: 0.000015,
    maxTokens: 200000,
  },
  'claude-3-sonnet': {
    name: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    costPerToken: 0.000003,
    maxTokens: 200000,
  },
};

export const presets: Record<string, PresetConfig> = {
  fast: {
    name: 'fast',
    model: 'gpt-3.5-turbo',
    maxCost: 1.0,
    maxTime: 600,
    systemPrompt: 'You are a fast and efficient coding assistant. Make quick, focused changes.',
  },
  balanced: {
    name: 'balanced',
    model: 'gpt-4-turbo-preview',
    maxCost: 5.0,
    maxTime: 1800,
    systemPrompt: 'You are a balanced coding assistant. Make thoughtful, well-tested changes.',
  },
  thorough: {
    name: 'thorough',
    model: 'claude-3-opus',
    maxCost: 10.0,
    maxTime: 3600,
    systemPrompt: 'You are a thorough coding assistant. Make comprehensive, well-documented changes with extensive testing.',
  },
};
