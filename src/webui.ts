import express, { Request, Response } from 'express';
import { Server as WebSocketServer } from 'ws';
import { config } from './config.js';
import { AgentOrchestrator } from './agent.js';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebUI {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private agent: AgentOrchestrator;

  constructor(agent: AgentOrchestrator) {
    this.agent = agent;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  private setupRoutes(): void {
    // API Routes
    this.app.get('/api/tasks', this.getTasks.bind(this));
    this.app.get('/api/tasks/:id', this.getTask.bind(this));
    this.app.post('/api/tasks', this.createTask.bind(this));
    this.app.get('/api/config', this.getConfig.bind(this));
    
    // Serve index.html for all other routes (SPA support)
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      
      ws.on('message', (message) => {
        console.log('Received:', message.toString());
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }

  private getTasks(req: Request, res: Response): void {
    const tasks = this.agent.getAllTasks();
    res.json(tasks);
  }

  private getTask(req: Request, res: Response): void {
    const task = this.agent.getTask(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  }

  private async createTask(req: Request, res: Response): Promise<void> {
    try {
      const taskConfig = req.body;
      
      // Validate required fields
      if (!taskConfig.repo || !taskConfig.idea) {
        res.status(400).json({ error: 'Missing required fields: repo, idea' });
        return;
      }

      // Start task asynchronously
      const execution = await this.agent.executeTask(taskConfig);
      
      // Broadcast task update via WebSocket
      this.broadcast({ type: 'task_created', data: execution });
      
      res.json(execution);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private getConfig(req: Request, res: Response): void {
    res.json({
      models: Object.keys(config),
      presets: Object.keys(config),
      defaults: {
        maxCost: config.agent.maxCostPerTask,
        maxTime: config.agent.maxTimePerTask,
        model: config.agent.defaultModel,
      },
    });
  }

  private broadcast(message: { type: string; data: unknown }): void {
    const data = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data);
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(config.server.webUiPort, () => {
        console.log(`Web UI running on http://localhost:${config.server.webUiPort}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close();
      this.server.close(() => {
        console.log('Web UI stopped');
        resolve();
      });
    });
  }
}
