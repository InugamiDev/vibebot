import { GitHubService } from '../github';

describe('GitHubService', () => {
  let service: GitHubService;

  beforeEach(() => {
    service = new GitHubService();
  });

  describe('parseRepoUrl', () => {
    it('should parse owner/repo format', () => {
      const result = service.parseRepoUrl('github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse https URL', () => {
      const result = service.parseRepoUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse http URL', () => {
      const result = service.parseRepoUrl('http://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should throw error for invalid URL', () => {
      expect(() => service.parseRepoUrl('invalid')).toThrow('Invalid GitHub repository URL');
    });
  });
});
