// Connect to WebSocket for real-time updates
let ws;
const tasksContainer = document.getElementById('tasks-container');
const taskForm = document.getElementById('task-form');

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleWebSocketMessage(message);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting...');
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function handleWebSocketMessage(message) {
  if (message.type === 'task_created' || message.type === 'task_updated') {
    loadTasks();
  }
}

async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    const tasks = await response.json();

    if (tasks.length === 0) {
      tasksContainer.innerHTML = '<p class="empty-state">No tasks yet. Create one above!</p>';
      return;
    }

    tasksContainer.innerHTML = tasks
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .map(task => renderTask(task))
      .join('');
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasksContainer.innerHTML = '<p class="empty-state">Error loading tasks</p>';
  }
}

function renderTask(task) {
  const statusClass = `status-${task.status}`;
  const cardClass = task.status === 'completed' ? 'completed' : task.status === 'failed' ? 'failed' : '';
  const duration = formatDuration(task.startTime, task.endTime);
  const completedSteps = task.steps.filter(s => s.status === 'completed').length;

  return `
    <div class="task-card ${cardClass}">
      <div class="task-header">
        <span class="task-id">${task.id.substring(0, 8)}</span>
        <span class="task-status ${statusClass}">${task.status.toUpperCase()}</span>
      </div>
      
      <div class="task-idea">${task.config.idea}</div>
      
      <div class="task-meta">
        <div>📦 ${task.config.repo}</div>
        <div>⏱️ ${duration}</div>
        <div>💰 $${task.totalCost.toFixed(4)}</div>
        <div>📊 ${completedSteps}/${task.steps.length} steps</div>
      </div>

      ${task.steps.length > 0 ? `
        <div class="task-steps">
          ${task.steps.map(step => renderStep(step)).join('')}
        </div>
      ` : ''}

      ${task.prUrl ? `
        <div class="pr-link">
          🔗 <a href="${task.prUrl}" target="_blank">View Pull Request</a>
        </div>
      ` : ''}
    </div>
  `;
}

function renderStep(step) {
  const icons = {
    read: '📖',
    edit: '✏️',
    test: '🧪',
    doc: '📝',
    pr: '🔀',
  };

  const statusIcons = {
    pending: '⏳',
    running: '🔄',
    completed: '✅',
    failed: '❌',
  };

  return `
    <div class="step">
      <span class="step-icon">${statusIcons[step.status]}</span>
      <span class="step-type">${icons[step.type]} ${step.type}</span>
      <span class="step-description">${step.description}</span>
    </div>
  `;
}

function formatDuration(startTime, endTime) {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(taskForm);
  const taskConfig = {
    repo: formData.get('repo'),
    idea: formData.get('idea'),
    base: formData.get('base') || undefined,
    model: formData.get('model') || undefined,
    preset: formData.get('preset') || undefined,
    maxCost: formData.get('maxCost') ? parseFloat(formData.get('maxCost')) : undefined,
    maxTime: formData.get('maxTime') ? parseInt(formData.get('maxTime')) : undefined,
  };

  // Normalize repo URL
  if (!taskConfig.repo.startsWith('http')) {
    taskConfig.repo = `https://github.com/${taskConfig.repo}`;
  }

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskConfig),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    taskForm.reset();
    loadTasks();
  } catch (error) {
    console.error('Error creating task:', error);
    alert('Error creating task: ' + error.message);
  }
});

// Initialize
connectWebSocket();
loadTasks();

// Refresh tasks every 10 seconds
setInterval(loadTasks, 10000);
