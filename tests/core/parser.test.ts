import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { parseSkill } from '../../src/core/parser.js';

const FIXTURE_DIR = resolve(import.meta.dirname, '../fixtures');

describe('parseSkill', () => {
  describe('basic parsing', () => {
    it('should parse a skill directory with skill.md', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'sample-skill'));

      expect(skill.name).toBe('typescript-best-practices');
      expect(skill.description).toBe('Enforce TypeScript best practices and coding standards');
      expect(skill.globs).toBe('**/*.ts,**/*.tsx');
      expect(skill.activation).toBe('auto');
      expect(skill.allowedTools).toBe('Read Grep');
      expect(skill.body).toContain('# TypeScript Best Practices');
      expect(skill.body).toContain('Use `const` by default');
    });

    it('should parse a skill file directly', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'sample-skill/skill.md'));

      expect(skill.name).toBe('typescript-best-practices');
      expect(skill.description).toBe('Enforce TypeScript best practices and coding standards');
    });

    it('should parse a minimal skill with only required fields', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'minimal-skill.md'));

      expect(skill.name).toBe('minimal');
      expect(skill.description).toBe('A minimal skill with no optional fields');
      expect(skill.body).toBe('Just the basics.');
      expect(skill.globs).toBeUndefined();
      expect(skill.activation).toBeUndefined();
      expect(skill.allowedTools).toBeUndefined();
      expect(skill.resources).toBeUndefined();
    });
  });

  describe('activation modes', () => {
    it('should parse activation: always', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'always-active.md'));
      expect(skill.activation).toBe('always');
    });

    it('should parse activation: manual', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'manual-skill.md'));
      expect(skill.activation).toBe('manual');
    });

    it('should parse activation: auto', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'sample-skill'));
      expect(skill.activation).toBe('auto');
    });
  });

  describe('globs', () => {
    it('should parse globs from frontmatter', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'manual-skill.md'));
      expect(skill.globs).toBe('**/*.py');
    });

    it('should leave globs undefined when not set', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'minimal-skill.md'));
      expect(skill.globs).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should throw on missing name', async () => {
      await expect(
        parseSkill(resolve(FIXTURE_DIR, 'invalid-no-name.md'))
      ).rejects.toThrow('name');
    });

    it('should throw on missing description', async () => {
      await expect(
        parseSkill(resolve(FIXTURE_DIR, 'invalid-no-description.md'))
      ).rejects.toThrow('description');
    });

    it('should throw on non-existent file', async () => {
      await expect(
        parseSkill(resolve(FIXTURE_DIR, 'does-not-exist.md'))
      ).rejects.toThrow();
    });
  });
});
