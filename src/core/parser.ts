import { resolve, join } from 'node:path';
import { parseFrontmatter } from '../utils/frontmatter.js';
import { readFileContent, isDirectory, listFiles } from '../utils/fs.js';
import type { UniversalSkill, SkillResources } from './types.js';

const RESOURCE_DIRS = ['scripts', 'references', 'assets'] as const;

export async function parseSkill(skillPath: string): Promise<UniversalSkill> {
  const resolvedPath = resolve(skillPath);
  let skillFilePath: string;
  let skillDir: string | null = null;

  if (await isDirectory(resolvedPath)) {
    skillDir = resolvedPath;
    skillFilePath = join(resolvedPath, 'skill.md');
  } else {
    skillFilePath = resolvedPath;
  }

  const raw = await readFileContent(skillFilePath);
  const { data, body } = parseFrontmatter(raw);

  const name = asString(data.name);
  if (!name) {
    throw new Error(`Skill file must have a "name" field in frontmatter: ${skillFilePath}`);
  }

  const description = asString(data.description);
  if (!description) {
    throw new Error(`Skill file must have a "description" field in frontmatter: ${skillFilePath}`);
  }

  const skill: UniversalSkill = {
    name,
    description,
    body,
  };

  const globs = asString(data.globs);
  if (globs) skill.globs = globs;

  const activation = asString(data.activation);
  if (activation && isActivation(activation)) {
    skill.activation = activation;
  }

  const allowedTools = asString(data['allowed-tools']);
  if (allowedTools) skill.allowedTools = allowedTools;

  if (data['disable-model-invocation'] === true) {
    skill.disableModelInvocation = true;
  }

  if (skillDir) {
    skill.resources = await scanResources(skillDir);
  }

  return skill;
}

async function scanResources(skillDir: string): Promise<SkillResources | undefined> {
  const resources: SkillResources = {};
  let hasAny = false;

  for (const dir of RESOURCE_DIRS) {
    const dirPath = join(skillDir, dir);
    const files = await listFiles(dirPath);
    if (files.length > 0) {
      resources[dir] = files;
      hasAny = true;
    }
  }

  return hasAny ? resources : undefined;
}

function asString(val: unknown): string | undefined {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return undefined;
}

function isActivation(val: string): val is 'auto' | 'manual' | 'always' {
  return val === 'auto' || val === 'manual' || val === 'always';
}
