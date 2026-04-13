import { resolve, join } from 'node:path';
import { readFileContent, writeFileEnsureDir, fileExists } from '../utils/fs.js';
import type { VendorName } from './types.js';

const LOCKFILE_NAME = '.skillsmith.json';

export interface SkillEntry {
  source: string;
  vendors: VendorName[];
  installedAt: string;
  updatedAt: string;
}

export interface Lockfile {
  skills: Record<string, SkillEntry>;
}

export function getLockfilePath(projectRoot: string): string {
  return join(projectRoot, LOCKFILE_NAME);
}

export async function readLockfile(projectRoot: string): Promise<Lockfile> {
  const lockfilePath = getLockfilePath(projectRoot);

  if (!(await fileExists(lockfilePath))) {
    return { skills: {} };
  }

  const raw = await readFileContent(lockfilePath);
  return JSON.parse(raw) as Lockfile;
}

export async function writeLockfile(projectRoot: string, lockfile: Lockfile): Promise<void> {
  const lockfilePath = getLockfilePath(projectRoot);
  const content = JSON.stringify(lockfile, null, 2) + '\n';
  await writeFileEnsureDir(lockfilePath, content);
}

export async function trackSkill(
  projectRoot: string,
  skillName: string,
  source: string,
  vendors: VendorName[],
): Promise<void> {
  const lockfile = await readLockfile(projectRoot);
  const now = new Date().toISOString();
  const resolvedSource = resolve(source);

  const existing = lockfile.skills[skillName];

  if (existing) {
    // Merge vendors (no duplicates) and update timestamp
    const mergedVendors = [...new Set([...existing.vendors, ...vendors])];
    lockfile.skills[skillName] = {
      ...existing,
      source: resolvedSource,
      vendors: mergedVendors,
      updatedAt: now,
    };
  } else {
    lockfile.skills[skillName] = {
      source: resolvedSource,
      vendors,
      installedAt: now,
      updatedAt: now,
    };
  }

  await writeLockfile(projectRoot, lockfile);
}
