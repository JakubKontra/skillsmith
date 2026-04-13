import { join } from 'node:path';
import type { UniversalSkill } from '../core/types.js';
import { VendorAdapter } from './base.js';

export class CursorAdapter extends VendorAdapter {
  readonly vendor = 'cursor' as const;

  getOutputPath(skill: UniversalSkill, projectRoot: string): string {
    return join(projectRoot, '.cursor', 'rules', skill.name, 'RULE.md');
  }

  buildFrontmatter(skill: UniversalSkill): Record<string, unknown> {
    const fm: Record<string, unknown> = {
      description: skill.description,
    };

    if (skill.globs) {
      fm.globs = skill.globs;
    }

    fm.alwaysApply = skill.activation === 'always';

    return fm;
  }
}
