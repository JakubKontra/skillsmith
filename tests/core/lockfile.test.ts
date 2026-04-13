import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { readLockfile, writeLockfile, trackSkill, getLockfilePath } from '../../src/core/lockfile.js';
import { readFileContent, fileExists } from '../../src/utils/fs.js';

describe('lockfile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ste-lock-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('readLockfile', () => {
    it('should return empty lockfile when .skillsmith.json does not exist', async () => {
      const lockfile = await readLockfile(tempDir);
      expect(lockfile.skills).toEqual({});
    });

    it('should read existing .skillsmith.json', async () => {
      await writeLockfile(tempDir, {
        skills: {
          'my-skill': {
            source: '/path/to/skill',
            vendors: ['claude', 'cursor'],
            installedAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        },
      });

      const lockfile = await readLockfile(tempDir);
      expect(lockfile.skills['my-skill']).toBeDefined();
      expect(lockfile.skills['my-skill'].vendors).toEqual(['claude', 'cursor']);
    });
  });

  describe('trackSkill', () => {
    it('should create .skillsmith.json and track a new skill', async () => {
      await trackSkill(tempDir, 'test-skill', '/path/to/source', ['claude']);

      const lockfile = await readLockfile(tempDir);
      expect(lockfile.skills['test-skill']).toBeDefined();
      expect(lockfile.skills['test-skill'].vendors).toEqual(['claude']);
      expect(lockfile.skills['test-skill'].installedAt).toBeTruthy();
      expect(lockfile.skills['test-skill'].updatedAt).toBeTruthy();
    });

    it('should merge vendors when tracking the same skill again', async () => {
      await trackSkill(tempDir, 'test-skill', '/path/to/source', ['claude']);
      await trackSkill(tempDir, 'test-skill', '/path/to/source', ['cursor', 'windsurf']);

      const lockfile = await readLockfile(tempDir);
      const vendors = lockfile.skills['test-skill'].vendors;
      expect(vendors).toContain('claude');
      expect(vendors).toContain('cursor');
      expect(vendors).toContain('windsurf');
      expect(vendors).toHaveLength(3);
    });

    it('should not duplicate vendors', async () => {
      await trackSkill(tempDir, 'test-skill', '/path/to/source', ['claude', 'cursor']);
      await trackSkill(tempDir, 'test-skill', '/path/to/source', ['claude']);

      const lockfile = await readLockfile(tempDir);
      const vendors = lockfile.skills['test-skill'].vendors;
      expect(vendors.filter((v) => v === 'claude')).toHaveLength(1);
    });

    it('should update updatedAt on re-track', async () => {
      await trackSkill(tempDir, 'test-skill', '/path/to/source', ['claude']);
      const first = await readLockfile(tempDir);
      const firstUpdated = first.skills['test-skill'].updatedAt;

      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10));
      await trackSkill(tempDir, 'test-skill', '/path/to/source', ['cursor']);
      const second = await readLockfile(tempDir);

      expect(second.skills['test-skill'].updatedAt).not.toBe(firstUpdated);
      // installedAt should stay the same
      expect(second.skills['test-skill'].installedAt).toBe(first.skills['test-skill'].installedAt);
    });

    it('should track multiple skills independently', async () => {
      await trackSkill(tempDir, 'skill-a', '/path/a', ['claude']);
      await trackSkill(tempDir, 'skill-b', '/path/b', ['cursor']);

      const lockfile = await readLockfile(tempDir);
      expect(Object.keys(lockfile.skills)).toHaveLength(2);
      expect(lockfile.skills['skill-a'].vendors).toEqual(['claude']);
      expect(lockfile.skills['skill-b'].vendors).toEqual(['cursor']);
    });
  });

  describe('lockfile path', () => {
    it('should be .skillsmith.json in project root', () => {
      const path = getLockfilePath('/my/project');
      expect(path).toBe('/my/project/.skillsmith.json');
    });
  });
});
