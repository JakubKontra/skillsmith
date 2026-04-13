import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { parseSkill } from '../../src/core/parser.js';
import { getAdapter, getAllAdapters } from '../../src/adapters/registry.js';
import { readFileContent } from '../../src/utils/fs.js';
import type { VendorName } from '../../src/core/types.js';

const FIXTURE_DIR = resolve(import.meta.dirname, '../fixtures');

describe('adapters', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ste-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function exportFixture(fixture: string, vendor: VendorName) {
    const skill = await parseSkill(resolve(FIXTURE_DIR, fixture));
    const adapter = getAdapter(vendor);
    return { result: await adapter.export(skill, { vendor, projectRoot: tempDir }), skill };
  }

  // ── Claude ──────────────────────────────────────────────

  describe('claude', () => {
    it('should export to .claude/skills/{name}/SKILL.md', async () => {
      const { result } = await exportFixture('sample-skill', 'claude');

      expect(result.files).toHaveLength(1);
      expect(result.files[0]).toContain('.claude/skills/typescript-best-practices/SKILL.md');

      const content = await readFileContent(result.files[0]);
      expect(content).toContain('name: typescript-best-practices');
      expect(content).toContain('description: Enforce TypeScript best practices');
      expect(content).toContain('allowed-tools: Read Grep');
      expect(content).toContain('user-invocable: true');
      expect(content).toContain('# TypeScript Best Practices');
    });

    it('should set user-invocable: false for activation: always', async () => {
      const { result } = await exportFixture('always-active.md', 'claude');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('user-invocable: false');
    });

    it('should set user-invocable: true for activation: manual', async () => {
      const { result } = await exportFixture('manual-skill.md', 'claude');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('user-invocable: true');
    });

    it('should not include allowed-tools when not set', async () => {
      const { result } = await exportFixture('minimal-skill.md', 'claude');
      const content = await readFileContent(result.files[0]);
      expect(content).not.toContain('allowed-tools');
    });

    it('should not produce warnings for Claude-specific fields', async () => {
      const { result } = await exportFixture('sample-skill', 'claude');
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ── Cursor ──────────────────────────────────────────────

  describe('cursor', () => {
    it('should export to .cursor/rules/{name}/RULE.md', async () => {
      const { result } = await exportFixture('sample-skill', 'cursor');

      expect(result.files[0]).toContain('.cursor/rules/typescript-best-practices/RULE.md');

      const content = await readFileContent(result.files[0]);
      expect(content).toContain('description: Enforce TypeScript best practices');
      expect(content).toContain("globs: '**/*.ts,**/*.tsx'");
      expect(content).toContain('alwaysApply: false');
      expect(content).toContain('# TypeScript Best Practices');
    });

    it('should set alwaysApply: true for activation: always', async () => {
      const { result } = await exportFixture('always-active.md', 'cursor');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('alwaysApply: true');
    });

    it('should set alwaysApply: false for activation: manual', async () => {
      const { result } = await exportFixture('manual-skill.md', 'cursor');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('alwaysApply: false');
    });

    it('should not include globs when not set', async () => {
      const { result } = await exportFixture('always-active.md', 'cursor');
      const content = await readFileContent(result.files[0]);
      expect(content).not.toContain('globs:');
    });
  });

  // ── Windsurf ────────────────────────────────────────────

  describe('windsurf', () => {
    it('should export to .windsurf/rules/{name}.md', async () => {
      const { result } = await exportFixture('sample-skill', 'windsurf');

      expect(result.files[0]).toContain('.windsurf/rules/typescript-best-practices.md');

      const content = await readFileContent(result.files[0]);
      expect(content).toContain('description: Enforce TypeScript best practices');
      expect(content).toContain('trigger: glob');
      expect(content).toContain("globs: '**/*.ts,**/*.tsx'");
    });

    it('should use trigger: glob when globs are present regardless of activation', async () => {
      const { result } = await exportFixture('manual-skill.md', 'windsurf');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('trigger: glob');
      expect(content).toContain("globs: '**/*.py'");
    });

    it('should use trigger: always_on for activation: always without globs', async () => {
      const { result } = await exportFixture('always-active.md', 'windsurf');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('trigger: always_on');
      expect(content).not.toContain('globs:');
    });

    it('should use trigger: model_decision for activation: auto without globs', async () => {
      const { result } = await exportFixture('minimal-skill.md', 'windsurf');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('trigger: model_decision');
    });

    it('should use trigger: manual for activation: manual without globs', async () => {
      // Create a manual skill without globs inline
      const skillPath = join(tempDir, 'manual-no-globs.md');
      await writeFile(skillPath, [
        '---',
        'name: manual-no-globs',
        'description: Manual without globs',
        'activation: manual',
        '---',
        '',
        'Body.',
      ].join('\n'));

      const skill = await parseSkill(skillPath);
      const adapter = getAdapter('windsurf');
      const outDir = join(tempDir, 'out');
      const result = await adapter.export(skill, { vendor: 'windsurf', projectRoot: outDir });
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('trigger: manual');
    });
  });

  // ── Copilot ─────────────────────────────────────────────

  describe('copilot', () => {
    it('should export to .github/instructions/{name}.instructions.md', async () => {
      const { result } = await exportFixture('sample-skill', 'copilot');

      expect(result.files[0]).toContain('.github/instructions/typescript-best-practices.instructions.md');

      const content = await readFileContent(result.files[0]);
      expect(content).toContain("applyTo: '**/*.ts,**/*.tsx'");
      expect(content).toContain('# typescript-best-practices');
      expect(content).toContain('Enforce TypeScript best practices');
    });

    it('should set applyTo: ** for activation: always', async () => {
      const { result } = await exportFixture('always-active.md', 'copilot');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain("applyTo: '**'");
    });

    it('should not include applyTo when no globs and activation is not always', async () => {
      const { result } = await exportFixture('minimal-skill.md', 'copilot');
      const content = await readFileContent(result.files[0]);
      expect(content).not.toContain('applyTo');
    });

    it('should prepend name and description to body', async () => {
      const { result } = await exportFixture('minimal-skill.md', 'copilot');
      const content = await readFileContent(result.files[0]);
      expect(content).toContain('# minimal');
      expect(content).toContain('A minimal skill with no optional fields');
      expect(content).toContain('Just the basics.');
    });
  });

  // ── Codex ───────────────────────────────────────────────

  describe('codex', () => {
    it('should export to AGENTS.md', async () => {
      const { result } = await exportFixture('sample-skill', 'codex');

      expect(result.files[0]).toContain('AGENTS.md');

      const content = await readFileContent(result.files[0]);
      expect(content).toContain('# AGENTS');
      expect(content).toContain('## typescript-best-practices');
      expect(content).toContain('Enforce TypeScript best practices');
      expect(content).toContain('# TypeScript Best Practices');
    });

    it('should replace existing section in AGENTS.md', async () => {
      await exportFixture('sample-skill', 'codex');
      const { result } = await exportFixture('sample-skill', 'codex');
      const content = await readFileContent(result.files[0]);

      const matches = content.match(/## typescript-best-practices/g);
      expect(matches).toHaveLength(1);
    });

    it('should append new sections without overwriting existing ones', async () => {
      await exportFixture('sample-skill', 'codex');
      await exportFixture('minimal-skill.md', 'codex');

      const agentsPath = join(tempDir, 'AGENTS.md');
      const content = await readFileContent(agentsPath);

      expect(content).toContain('## typescript-best-practices');
      expect(content).toContain('## minimal');
    });

    it('should preserve other sections when replacing', async () => {
      // Create AGENTS.md with existing content
      const agentsPath = join(tempDir, 'AGENTS.md');
      await writeFile(agentsPath, [
        '# AGENTS',
        '',
        '## existing-skill',
        '',
        'This was already here.',
        '',
        '## typescript-best-practices',
        '',
        'Old content that should be replaced.',
        '',
        '## another-skill',
        '',
        'This should also stay.',
      ].join('\n'));

      await exportFixture('sample-skill', 'codex');
      const content = await readFileContent(agentsPath);

      expect(content).toContain('## existing-skill');
      expect(content).toContain('This was already here.');
      expect(content).toContain('## another-skill');
      expect(content).toContain('This should also stay.');
      expect(content).not.toContain('Old content that should be replaced.');
      expect(content).toContain('Enforce TypeScript best practices');
    });
  });

  // ── Warnings ────────────────────────────────────────────

  describe('warnings', () => {
    it('should warn about allowed-tools for non-Claude vendors', async () => {
      for (const vendor of ['cursor', 'windsurf', 'copilot'] as VendorName[]) {
        const { result } = await exportFixture('sample-skill', vendor);
        expect(result.warnings).toContain(
          `"allowed-tools" is Claude-specific and was ignored for ${vendor}.`
        );
      }
    });

    it('should not warn about allowed-tools for Claude', async () => {
      const { result } = await exportFixture('sample-skill', 'claude');
      const toolWarnings = result.warnings.filter((w) => w.includes('allowed-tools'));
      expect(toolWarnings).toHaveLength(0);
    });

    it('should not warn about allowed-tools when not set', async () => {
      const { result } = await exportFixture('minimal-skill.md', 'cursor');
      const toolWarnings = result.warnings.filter((w) => w.includes('allowed-tools'));
      expect(toolWarnings).toHaveLength(0);
    });
  });

  // ── Registry ────────────────────────────────────────────

  describe('registry', () => {
    it('should return all 5 adapters', () => {
      const adapters = getAllAdapters();
      expect(adapters).toHaveLength(5);
      const vendors = adapters.map((a) => a.vendor).sort();
      expect(vendors).toEqual(['claude', 'codex', 'copilot', 'cursor', 'windsurf']);
    });

    it('should throw on unknown vendor', () => {
      expect(() => getAdapter('unknown' as VendorName)).toThrow('Unknown vendor');
    });
  });

  // ── Export all vendors ──────────────────────────────────

  describe('export to all vendors', () => {
    it('should export the same skill to all 5 vendors', async () => {
      const skill = await parseSkill(resolve(FIXTURE_DIR, 'sample-skill'));
      const allFiles: string[] = [];

      for (const adapter of getAllAdapters()) {
        const result = await adapter.export(skill, {
          vendor: adapter.vendor,
          projectRoot: tempDir,
        });
        allFiles.push(...result.files);
      }

      expect(allFiles).toHaveLength(5);
      expect(allFiles.some((f) => f.includes('.claude/skills/'))).toBe(true);
      expect(allFiles.some((f) => f.includes('.cursor/rules/'))).toBe(true);
      expect(allFiles.some((f) => f.includes('.windsurf/rules/'))).toBe(true);
      expect(allFiles.some((f) => f.includes('.github/instructions/'))).toBe(true);
      expect(allFiles.some((f) => f.includes('AGENTS.md'))).toBe(true);
    });
  });
});
