import { join } from 'node:path';
import type { UniversalSkill, ExportOptions, ExportResult } from '../core/types.js';
import { VendorAdapter } from './base.js';
import { readFileContent, writeFileEnsureDir, fileExists } from '../utils/fs.js';

export class CodexAdapter extends VendorAdapter {
  readonly vendor = 'codex' as const;

  getOutputPath(_skill: UniversalSkill, projectRoot: string): string {
    return join(projectRoot, 'AGENTS.md');
  }

  buildFrontmatter(_skill: UniversalSkill): Record<string, unknown> {
    // AGENTS.md doesn't use per-section frontmatter
    return {};
  }

  async export(skill: UniversalSkill, options: ExportOptions): Promise<ExportResult> {
    const warnings: string[] = [];
    const projectRoot = options.outputDir ?? options.projectRoot;
    const outputPath = this.getOutputPath(skill, projectRoot);

    const sectionHeader = `## ${skill.name}`;
    const sectionContent = `${sectionHeader}\n\n${skill.description}\n\n${skill.body}`;

    let finalContent: string;

    if (await fileExists(outputPath)) {
      const existing = await readFileContent(outputPath);
      const replaced = replaceSection(existing, sectionHeader, sectionContent);

      if (replaced !== null) {
        finalContent = replaced;
      } else {
        // Append new section
        finalContent = existing.trimEnd() + '\n\n' + sectionContent + '\n';
      }
    } else {
      // Create new AGENTS.md
      finalContent = `# AGENTS\n\n${sectionContent}\n`;
    }

    await writeFileEnsureDir(outputPath, finalContent);

    if (skill.resources) {
      warnings.push('AGENTS.md does not support bundled resources. Scripts/references/assets were not exported.');
    }
    if (skill.allowedTools) {
      warnings.push('"allowed-tools" is Claude-specific and was ignored for codex.');
    }

    return { vendor: this.vendor, files: [outputPath], warnings };
  }
}

function replaceSection(content: string, sectionHeader: string, newSection: string): string | null {
  const lines = content.split('\n');
  const startIdx = lines.findIndex((line) => line.trim() === sectionHeader);

  if (startIdx === -1) return null;

  // Find the end of this section (next ## heading or EOF)
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      endIdx = i;
      break;
    }
  }

  const before = lines.slice(0, startIdx).join('\n');
  const after = lines.slice(endIdx).join('\n');

  return (before.trimEnd() + '\n\n' + newSection + '\n\n' + after).trim() + '\n';
}
