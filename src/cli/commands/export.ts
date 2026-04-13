import { resolve } from 'node:path';
import { parseSkill } from '../../core/parser.js';
import { getAllAdapters } from '../../adapters/registry.js';

export async function exportCommand(args: string[]): Promise<void> {
  const skillPaths = args.filter((a) => !a.startsWith('-'));

  if (skillPaths.length === 0) {
    console.error('Usage: skillsmith export <skillpath> [skillpath...]');
    console.error('Exports skill(s) to all vendor formats.');
    process.exit(1);
  }

  const projectRoot = resolve('.');
  const adapters = getAllAdapters();

  for (const skillPath of skillPaths) {
    console.log(`\nParsing: ${skillPath}`);
    const skill = await parseSkill(skillPath);

    for (const adapter of adapters) {
      console.log(`  → ${adapter.vendor}`);
      const result = await adapter.export(skill, { vendor: adapter.vendor, projectRoot });

      for (const file of result.files) {
        console.log(`    ✓ ${file}`);
      }
      for (const warning of result.warnings) {
        console.log(`    ⚠ ${warning}`);
      }
    }
  }

  console.log('\nDone.');
}
