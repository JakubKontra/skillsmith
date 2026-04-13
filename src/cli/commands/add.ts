import { resolve } from 'node:path';
import { parseSkill } from '../../core/parser.js';
import { getAdapter, getAllAdapters } from '../../adapters/registry.js';
import { trackSkill } from '../../core/lockfile.js';
import { VENDOR_NAMES, type VendorName } from '../../core/types.js';

export async function addCommand(args: string[]): Promise<void> {
  const skillPath = args[0];
  const vendorFlag = args.indexOf('-a');
  const vendorArg = vendorFlag !== -1 ? args[vendorFlag + 1] : undefined;

  if (!skillPath) {
    console.error('Usage: skillsmith add <skillpath> -a <vendor|all>');
    process.exit(1);
  }

  if (!vendorArg) {
    console.error('Missing vendor flag. Usage: -a <claude|cursor|windsurf|copilot|codex|all>');
    process.exit(1);
  }

  if (vendorArg !== 'all' && !VENDOR_NAMES.includes(vendorArg as VendorName)) {
    console.error(`Unknown vendor: ${vendorArg}. Available: ${VENDOR_NAMES.join(', ')}, all`);
    process.exit(1);
  }

  const projectRoot = resolve('.');

  console.log(`Parsing skill: ${skillPath}`);
  const skill = await parseSkill(skillPath);
  console.log(`  name: ${skill.name}`);
  console.log(`  description: ${skill.description}`);

  const adapters = vendorArg === 'all'
    ? getAllAdapters()
    : [getAdapter(vendorArg as VendorName)];

  for (const adapter of adapters) {
    console.log(`\nExporting to ${adapter.vendor}...`);
    const result = await adapter.export(skill, { vendor: adapter.vendor, projectRoot });

    for (const file of result.files) {
      console.log(`  ✓ ${file}`);
    }
    for (const warning of result.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
  }

  // Track in .skillsmith.json
  const vendors = adapters.map((a) => a.vendor);
  await trackSkill(projectRoot, skill.name, skillPath, vendors);
  console.log(`\nTracked in .skillsmith.json`);

  console.log('Done.');
}
