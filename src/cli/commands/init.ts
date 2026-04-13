import { join, resolve } from 'node:path';
import { writeFileEnsureDir } from '../../utils/fs.js';

const TEMPLATE = `---
name: my-skill
description: Describe what this skill does
globs: "**/*.ts"
activation: auto
---

# My Skill

Add your skill instructions here.

## When to use

Describe when this skill should be activated.

## Instructions

Your instructions for the AI coding assistant...
`;

export async function initCommand(args: string[]): Promise<void> {
  const name = args[0] || 'my-skill';
  const targetDir = resolve(name);
  const skillFile = join(targetDir, 'skill.md');

  const content = TEMPLATE.replace(/my-skill/g, name);

  await writeFileEnsureDir(skillFile, content);
  console.log(`Created skill template: ${skillFile}`);
  console.log(`\nEdit the file, then export with:`);
  console.log(`  npx skillsmith add ./${name} -a claude`);
  console.log(`  npx skillsmith add ./${name} -a all`);
}
