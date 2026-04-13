import { resolve } from 'node:path';
import { readLockfile } from '../../core/lockfile.js';
import { parseSkill } from '../../core/parser.js';
import { getAdapter } from '../../adapters/registry.js';
import { fileExists, isDirectory } from '../../utils/fs.js';

export async function syncCommand(): Promise<void> {
  const projectRoot = resolve('.');
  const lockfile = await readLockfile(projectRoot);

  const entries = Object.entries(lockfile.skills);

  if (entries.length === 0) {
    console.log('No skills tracked in .skillsmith.json');
    console.log('Use "skillsmith add <skillpath> -a <vendor>" to install skills first.');
    return;
  }

  console.log(`Syncing ${entries.length} skill(s)...\n`);

  let updated = 0;
  let failed = 0;

  for (const [name, entry] of entries) {
    const sourcePath = entry.source;

    // Check if source still exists
    const exists = await fileExists(sourcePath) || await isDirectory(sourcePath);
    if (!exists) {
      console.log(`✗ ${name}`);
      console.log(`  Source not found: ${sourcePath}`);
      console.log(`  Skipped. Update the path in .skillsmith.json or re-add the skill.`);
      failed++;
      continue;
    }

    try {
      const skill = await parseSkill(sourcePath);
      console.log(`↻ ${name}`);

      for (const vendor of entry.vendors) {
        const adapter = getAdapter(vendor);
        const result = await adapter.export(skill, { vendor, projectRoot });

        for (const file of result.files) {
          console.log(`  ✓ ${vendor} → ${file}`);
        }
        for (const warning of result.warnings) {
          console.log(`  ⚠ ${warning}`);
        }
      }

      updated++;
    } catch (err) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\nSync complete: ${updated} updated, ${failed} failed.`);
}
