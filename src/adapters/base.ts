import { join } from 'node:path';
import { serializeFrontmatter } from '../utils/frontmatter.js';
import { writeFileEnsureDir, copyDir } from '../utils/fs.js';
import type { UniversalSkill, VendorName, ExportOptions, ExportResult } from '../core/types.js';

export abstract class VendorAdapter {
  abstract readonly vendor: VendorName;

  abstract getOutputPath(skill: UniversalSkill, projectRoot: string): string;

  abstract buildFrontmatter(skill: UniversalSkill): Record<string, unknown>;

  transformBody(skill: UniversalSkill): string {
    return skill.body;
  }

  supportsResources(): boolean {
    return false;
  }

  getResourceOutputDir(_skill: UniversalSkill, _projectRoot: string): string | null {
    return null;
  }

  async export(skill: UniversalSkill, options: ExportOptions): Promise<ExportResult> {
    const warnings: string[] = [];
    const files: string[] = [];
    const projectRoot = options.outputDir ?? options.projectRoot;

    const outputPath = this.getOutputPath(skill, projectRoot);
    const frontmatter = this.buildFrontmatter(skill);
    const body = this.transformBody(skill);
    const content = serializeFrontmatter(frontmatter, body);

    await writeFileEnsureDir(outputPath, content);
    files.push(outputPath);

    // Handle resources
    if (skill.resources && !this.supportsResources()) {
      warnings.push(
        `${this.vendor} does not support bundled resources. Scripts/references/assets were not exported.`
      );
    }

    if (skill.resources && this.supportsResources()) {
      const resourceDir = this.getResourceOutputDir(skill, projectRoot);
      if (resourceDir) {
        for (const [type, paths] of Object.entries(skill.resources)) {
          if (paths && paths.length > 0) {
            const srcDir = paths[0] ? join(paths[0], '..') : null;
            if (srcDir) {
              const destDir = join(resourceDir, type);
              await copyDir(srcDir, destDir);
              files.push(destDir);
            }
          }
        }
      }
    }

    // Warn about vendor-specific features that don't apply
    if (skill.allowedTools && this.vendor !== 'claude') {
      warnings.push(`"allowed-tools" is Claude-specific and was ignored for ${this.vendor}.`);
    }

    return { vendor: this.vendor, files, warnings };
  }
}
