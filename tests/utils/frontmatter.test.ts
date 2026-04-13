import { describe, it, expect } from 'vitest';
import { parseFrontmatter, serializeFrontmatter } from '../../src/utils/frontmatter.js';

describe('frontmatter', () => {
  describe('parseFrontmatter', () => {
    it('should parse YAML frontmatter and body', () => {
      const input = `---
name: test
description: A test
---

Body content here.`;

      const { data, body } = parseFrontmatter(input);
      expect(data.name).toBe('test');
      expect(data.description).toBe('A test');
      expect(body).toBe('Body content here.');
    });

    it('should handle content without frontmatter', () => {
      const input = 'Just plain content.';
      const { data, body } = parseFrontmatter(input);
      expect(Object.keys(data)).toHaveLength(0);
      expect(body).toBe('Just plain content.');
    });

    it('should handle empty body', () => {
      const input = `---
name: empty
---`;
      const { data, body } = parseFrontmatter(input);
      expect(data.name).toBe('empty');
      expect(body).toBe('');
    });

    it('should handle boolean values', () => {
      const input = `---
enabled: true
disabled: false
---

Body.`;
      const { data } = parseFrontmatter(input);
      expect(data.enabled).toBe(true);
      expect(data.disabled).toBe(false);
    });
  });

  describe('serializeFrontmatter', () => {
    it('should produce valid frontmatter + body', () => {
      const result = serializeFrontmatter(
        { name: 'test', description: 'A test' },
        'Body here.'
      );

      expect(result).toContain('---');
      expect(result).toContain('name: test');
      expect(result).toContain('description: A test');
      expect(result).toContain('Body here.');
    });

    it('should skip undefined values', () => {
      const result = serializeFrontmatter(
        { name: 'test', optional: undefined },
        'Body.'
      );

      expect(result).toContain('name: test');
      expect(result).not.toContain('optional');
    });

    it('should output body only when frontmatter is empty', () => {
      const result = serializeFrontmatter({}, 'Just body.');
      expect(result).toBe('Just body.\n');
      expect(result).not.toContain('---');
    });

    it('should round-trip correctly', () => {
      const original = { name: 'roundtrip', globs: '**/*.ts' };
      const body = 'Content stays the same.';

      const serialized = serializeFrontmatter(original, body);
      const { data, body: parsedBody } = parseFrontmatter(serialized);

      expect(data.name).toBe('roundtrip');
      expect(data.globs).toBe('**/*.ts');
      expect(parsedBody).toContain('Content stays the same.');
    });
  });
});
