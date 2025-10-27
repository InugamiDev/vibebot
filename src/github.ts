import { Octokit } from '@octokit/rest';
import simpleGit, { SimpleGit } from 'simple-git';
import { config } from './config.js';
import fs from 'fs/promises';

export class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: config.github.token,
    });
  }

  async cloneRepository(repoUrl: string, targetDir: string): Promise<SimpleGit> {
    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });

    const git: SimpleGit = simpleGit(targetDir);
    
    // Parse repository URL to add authentication
    const authUrl = this.addAuthToUrl(repoUrl);
    
    await git.clone(authUrl, targetDir);
    return simpleGit(targetDir);
  }

  async createBranch(git: SimpleGit, branchName: string, baseBranch?: string): Promise<void> {
    if (baseBranch) {
      await git.checkout(baseBranch);
    }
    await git.checkoutLocalBranch(branchName);
  }

  async commitChanges(git: SimpleGit, message: string): Promise<void> {
    await git.add('.');
    await git.commit(message);
  }

  async pushBranch(git: SimpleGit, branchName: string): Promise<void> {
    await git.push('origin', branchName);
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<string> {
    const response = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    });

    return response.data.html_url;
  }

  parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    // Support both github.com/owner/repo and https://github.com/owner/repo formats
    const match = repoUrl.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/.]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return { owner: match[1], repo: match[2] };
  }

  private addAuthToUrl(repoUrl: string): string {
    if (!config.github.token) {
      return repoUrl;
    }
    
    // Convert SSH to HTTPS if needed
    if (repoUrl.startsWith('git@github.com:')) {
      repoUrl = repoUrl.replace('git@github.com:', 'https://github.com/');
    }
    
    // Add token to HTTPS URL
    if (repoUrl.startsWith('https://')) {
      return repoUrl.replace('https://', `https://${config.github.token}@`);
    }
    
    return repoUrl;
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const response = await this.octokit.repos.get({ owner, repo });
    return response.data.default_branch;
  }
}
