import { resolve, relative } from 'node:path';
import { fileExists, isDirectory, listFiles } from '../../utils/fs.js';

interface VendorLocation {
  vendor: string;
  path: string;
  pattern: string;
}

const VENDOR_LOCATIONS: VendorLocation[] = [
  { vendor: 'Claude', path: '.claude/skills', pattern: 'SKILL.md' },
  { vendor: 'Cursor', path: '.cursor/rules', pattern: 'RULE.md' },
  { vendor: 'Windsurf', path: '.windsurf/rules', pattern: '.md' },
  { vendor: 'Copilot', path: '.github/instructions', pattern: '.instructions.md' },
  { vendor: 'Codex', path: 'AGENTS.md', pattern: '' },
];

export async function listCommand(): Promise<void> {
  const projectRoot = resolve('.');
  let foundAny = false;

  for (const loc of VENDOR_LOCATIONS) {
    const fullPath = resolve(projectRoot, loc.path);

    if (loc.vendor === 'Codex') {
      if (await fileExists(fullPath)) {
        console.log(`\n${loc.vendor}:`);
        console.log(`  ${relative(projectRoot, fullPath)}`);
        foundAny = true;
      }
      continue;
    }

    if (await isDirectory(fullPath)) {
      const entries = await listFiles(fullPath);
      if (entries.length > 0) {
        console.log(`\n${loc.vendor}:`);
        for (const entry of entries) {
          console.log(`  ${relative(projectRoot, entry)}`);
        }
        foundAny = true;
      }
    }
  }

  if (!foundAny) {
    console.log('No skills found in the current project.');
  }
}
