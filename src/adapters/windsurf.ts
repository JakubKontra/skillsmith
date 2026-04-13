import { join } from 'node:path';
import type { UniversalSkill } from '../core/types.js';
import { VendorAdapter } from './base.js';

export class WindsurfAdapter extends VendorAdapter {
  readonly vendor = 'windsurf' as const;

  getOutputPath(skill: UniversalSkill, projectRoot: string): string {
    return join(projectRoot, '.windsurf', 'rules', `${skill.name}.md`);
  }

  buildFrontmatter(skill: UniversalSkill): Record<string, unknown> {
    const fm: Record<string, unknown> = {
      description: skill.description,
    };

    // Map activation to Windsurf trigger modes
    if (skill.globs) {
      fm.trigger = 'glob';
      fm.globs = skill.globs;
    } else {
      switch (skill.activation) {
        case 'always':
          fm.trigger = 'always_on';
          break;
        case 'manual':
          fm.trigger = 'manual';
          break;
        case 'auto':
        default:
          fm.trigger = 'model_decision';
          break;
      }
    }

    return fm;
  }
}
