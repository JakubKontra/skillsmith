import { join } from 'node:path';
import type { UniversalSkill } from '../core/types.js';
import { VendorAdapter } from './base.js';

export class CopilotAdapter extends VendorAdapter {
  readonly vendor = 'copilot' as const;

  getOutputPath(skill: UniversalSkill, projectRoot: string): string {
    return join(projectRoot, '.github', 'instructions', `${skill.name}.instructions.md`);
  }

  buildFrontmatter(skill: UniversalSkill): Record<string, unknown> {
    const fm: Record<string, unknown> = {};

    if (skill.activation === 'always') {
      fm.applyTo = '**';
    } else if (skill.globs) {
      fm.applyTo = skill.globs;
    }

    return fm;
  }

  transformBody(skill: UniversalSkill): string {
    // Copilot doesn't have a description field in frontmatter,
    // so prepend it to the body
    return `# ${skill.name}\n\n${skill.description}\n\n${skill.body}`;
  }
}
