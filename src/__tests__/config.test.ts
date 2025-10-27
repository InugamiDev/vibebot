import { models, presets } from '../config';

describe('Configuration', () => {
  describe('models', () => {
    it('should have GPT-4 Turbo configured', () => {
      expect(models['gpt-4-turbo-preview']).toBeDefined();
      expect(models['gpt-4-turbo-preview'].provider).toBe('openai');
    });

    it('should have GPT-3.5 configured', () => {
      expect(models['gpt-3.5-turbo']).toBeDefined();
      expect(models['gpt-3.5-turbo'].provider).toBe('openai');
    });

    it('should have Claude models configured', () => {
      expect(models['claude-3-opus']).toBeDefined();
      expect(models['claude-3-sonnet']).toBeDefined();
      expect(models['claude-3-opus'].provider).toBe('anthropic');
    });

    it('should have cost per token for all models', () => {
      Object.values(models).forEach(model => {
        expect(model.costPerToken).toBeGreaterThan(0);
        expect(model.maxTokens).toBeGreaterThan(0);
      });
    });
  });

  describe('presets', () => {
    it('should have fast preset', () => {
      expect(presets.fast).toBeDefined();
      expect(presets.fast.model).toBe('gpt-3.5-turbo');
      expect(presets.fast.maxCost).toBe(1.0);
    });

    it('should have balanced preset', () => {
      expect(presets.balanced).toBeDefined();
      expect(presets.balanced.model).toBe('gpt-4-turbo-preview');
      expect(presets.balanced.maxCost).toBe(5.0);
    });

    it('should have thorough preset', () => {
      expect(presets.thorough).toBeDefined();
      expect(presets.thorough.model).toBe('claude-3-opus');
      expect(presets.thorough.maxCost).toBe(10.0);
    });
  });
});
