import { join } from 'node:path';
import type { UniversalSkill } from '../core/types.js';
import { VendorAdapter } from './base.js';

export class ClaudeAdapter extends VendorAdapter {
  readonly vendor = 'claude' as const;

  getOutputPath(skill: UniversalSkill, projectRoot: string): string {
    return join(projectRoot, '.claude', 'skills', skill.name, 'SKILL.md');
  }

  buildFrontmatter(skill: UniversalSkill): Record<string, unknown> {
    const fm: Record<string, unknown> = {
      name: skill.name,
      description: skill.description,
    };

    if (skill.allowedTools) {
      fm['allowed-tools'] = skill.allowedTools;
    }

    if (skill.disableModelInvocation) {
      fm['disable-model-invocation'] = true;
    }

    // Map activation to user-invocable
    if (skill.activation === 'always') {
      // Always active — not user-invocable, auto-applied
      fm['user-invocable'] = false;
    } else {
      // auto or manual — user can invoke
      fm['user-invocable'] = true;
    }

    return fm;
  }

  supportsResources(): boolean {
    return true;
  }

  getResourceOutputDir(skill: UniversalSkill, projectRoot: string): string {
    return join(projectRoot, '.claude', 'skills', skill.name);
  }
}
