# VibeBot Usage Examples

This document provides real-world examples of using VibeBot for various development tasks.

## Example 1: Add a New Feature

**Scenario**: Add user authentication to an Express.js API

### Discord Command
```
/vibe 
  repo: myorg/api-server
  idea: Add JWT-based authentication middleware with login and register endpoints
  base: develop
  model: gpt-4-turbo-preview
  maxcost: 5.00
```

### What VibeBot Does
1. Clones the repository
2. Plans the implementation:
   - Read existing code structure
   - Edit authentication files (create middleware, routes)
   - Test the new endpoints
   - Update documentation
3. Creates a new branch `vibe/abc12345`
4. Implements the changes
5. Commits each step
6. Pushes the branch
7. Opens a PR with detailed description

### Expected Output
```
✅ Task completed!

Task ID: abc12345-def6-7890-ghij-klmnopqrstuv
Status: completed
Duration: 8m 32s
Cost: $2.47
PR: https://github.com/myorg/api-server/pull/42

Steps: 5/5 completed
```

## Example 2: Bug Fix

**Scenario**: Fix a memory leak in a Node.js service

### Discord Command
```
/vibe 
  repo: https://github.com/myorg/node-service
  idea: Fix memory leak in WebSocket connection handler by properly cleaning up event listeners
  preset: fast
```

### What VibeBot Does
1. Uses the "fast" preset (GPT-3.5, $1 max, 10 min max)
2. Analyzes WebSocket code
3. Identifies and fixes listener cleanup issues
4. Runs existing tests
5. Creates PR

## Example 3: Refactoring

**Scenario**: Refactor a large class into smaller modules

### Discord Command
```
/vibe 
  repo: company/legacy-app
  idea: Refactor UserManager class into separate services for authentication, profile, and permissions
  base: refactor-branch
  preset: thorough
  maxtime: 7200
```

### What VibeBot Does
1. Uses "thorough" preset (Claude 3 Opus, comprehensive testing)
2. Analyzes UserManager class
3. Creates new service files
4. Migrates functionality
5. Updates all imports
6. Runs full test suite
7. Updates documentation
8. Creates detailed PR

## Example 4: Add Tests

**Scenario**: Add unit tests to an existing module

### Discord Command
```
/vibe 
  repo: myorg/utils-library
  idea: Add comprehensive unit tests for the date formatting module using Jest
  model: claude-3-sonnet
  maxcost: 3.00
```

### What VibeBot Does
1. Reads existing date formatting code
2. Generates comprehensive test cases
3. Creates test file with Jest
4. Ensures edge cases are covered
5. Updates package.json if needed
6. Creates PR with test coverage report

## Example 5: Documentation

**Scenario**: Add API documentation

### Discord Command
```
/vibe 
  repo: startup/api
  idea: Generate OpenAPI/Swagger documentation for all REST endpoints and add JSDoc comments
  preset: balanced
```

### What VibeBot Does
1. Analyzes all API routes
2. Adds JSDoc comments to endpoints
3. Generates OpenAPI spec
4. Creates documentation UI setup
5. Updates README with API docs link
6. Creates PR

## Example 6: Performance Optimization

**Scenario**: Optimize database queries

### Web UI
Navigate to `http://localhost:3001` and fill the form:

- **Repository**: company/backend-api
- **Task**: Optimize slow user listing query by adding proper indexes and using select specific fields
- **Base Branch**: performance-improvements
- **Model**: GPT-4 Turbo
- **Max Cost**: $8.00
- **Max Time**: 1800 seconds

### What VibeBot Does
1. Analyzes current query patterns
2. Identifies N+1 queries
3. Adds database indexes
4. Optimizes query selection
5. Tests performance improvements
6. Documents changes
7. Creates PR with before/after metrics

## Example 7: Security Patch

**Scenario**: Fix security vulnerability

### Discord Command
```
/vibe 
  repo: org/web-app
  idea: Fix SQL injection vulnerability in search endpoint by using parameterized queries
  model: gpt-4-turbo-preview
  maxcost: 10.00
  maxtime: 3600
```

### What VibeBot Does
1. Locates vulnerable code
2. Replaces string concatenation with parameterized queries
3. Adds input validation
4. Tests with malicious inputs
5. Updates security documentation
6. Creates urgent PR

## Example 8: Dependency Update

**Scenario**: Update and migrate to new library version

### Discord Command
```
/vibe 
  repo: team/react-app
  idea: Migrate from React Router v5 to v6, updating all route configurations and navigation
  preset: thorough
```

### What VibeBot Does
1. Updates package.json
2. Analyzes all route usages
3. Migrates route syntax
4. Updates navigation hooks
5. Tests all routes
6. Updates documentation
7. Creates migration PR

## Monitoring Progress

### Via Discord

Check status:
```
/vibe-status taskid: abc12345
```

List all tasks:
```
/vibe-list
```

### Via Web UI

Visit `http://localhost:3001` to see:
- Real-time progress updates
- Step-by-step execution
- Cost tracking
- Time elapsed
- Direct PR links

## Best Practices

### 1. Be Specific
❌ "Fix the bug"
✅ "Fix null pointer exception in user profile load when avatar is missing"

### 2. Set Appropriate Limits
- Simple tasks: Use "fast" preset
- Complex tasks: Use "thorough" preset
- Balance cost vs quality based on task importance

### 3. Choose the Right Model
- **GPT-3.5 Turbo**: Quick fixes, simple features
- **GPT-4 Turbo**: Complex logic, refactoring
- **Claude 3 Sonnet**: Balanced tasks
- **Claude 3 Opus**: Critical features, comprehensive analysis

### 4. Review Before Merging
Always review the AI-generated PR:
- Check for logic errors
- Verify tests are meaningful
- Ensure coding standards are met
- Test locally if needed

### 5. Provide Context
Include relevant context in the task description:
- Technology stack
- Coding conventions
- Related files or modules
- Expected behavior

## Troubleshooting Common Issues

### Task Takes Too Long
- Reduce `maxtime` or use "fast" preset
- Break into smaller tasks
- Be more specific in the task description

### Task Costs Too Much
- Lower `maxcost`
- Use cheaper models (GPT-3.5)
- Use "fast" preset
- Simplify the task

### PR Not Created
- Check GitHub token permissions
- Verify repository access
- Check for uncommitted changes
- Review task logs in Web UI

### Changes Not as Expected
- Be more specific in task description
- Try a different model
- Use "thorough" preset for better quality
- Break complex tasks into steps

## Advanced Usage

### Chaining Tasks

For complex features, create multiple sequential tasks:

1. First task: Set up basic structure
2. Second task: Implement core logic
3. Third task: Add tests
4. Fourth task: Add documentation

Each task builds on the previous PR.

### Using Different Branches

Work on multiple features simultaneously:

```
/vibe repo:myorg/app idea:Feature A base:feature-a
/vibe repo:myorg/app idea:Feature B base:feature-b
```

### Cost Optimization

Balance quality and cost:
- Use GPT-3.5 for routine tasks
- Reserve GPT-4/Claude for complex logic
- Set reasonable `maxcost` limits
- Monitor costs via Web UI
