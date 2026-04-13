export interface UniversalSkill {
  name: string;
  description: string;
  globs?: string;
  activation?: 'auto' | 'manual' | 'always';
  allowedTools?: string;
  disableModelInvocation?: boolean;
  body: string;
  resources?: SkillResources;
}

export interface SkillResources {
  scripts?: string[];
  references?: string[];
  assets?: string[];
}

export type VendorName = 'claude' | 'cursor' | 'windsurf' | 'copilot' | 'codex';

export const VENDOR_NAMES: VendorName[] = ['claude', 'cursor', 'windsurf', 'copilot', 'codex'];

export interface ExportOptions {
  vendor: VendorName;
  outputDir?: string;
  projectRoot: string;
}

export interface ExportResult {
  vendor: VendorName;
  files: string[];
  warnings: string[];
}
