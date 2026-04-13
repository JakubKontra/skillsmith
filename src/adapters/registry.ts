import type { VendorName } from '../core/types.js';
import { VendorAdapter } from './base.js';
import { ClaudeAdapter } from './claude.js';
import { CursorAdapter } from './cursor.js';
import { WindsurfAdapter } from './windsurf.js';
import { CopilotAdapter } from './copilot.js';
import { CodexAdapter } from './codex.js';

const adapters = new Map<VendorName, VendorAdapter>([
  ['claude', new ClaudeAdapter()],
  ['cursor', new CursorAdapter()],
  ['windsurf', new WindsurfAdapter()],
  ['copilot', new CopilotAdapter()],
  ['codex', new CodexAdapter()],
]);

export function getAdapter(vendor: VendorName): VendorAdapter {
  const adapter = adapters.get(vendor);
  if (!adapter) {
    throw new Error(`Unknown vendor: ${vendor}. Available: ${[...adapters.keys()].join(', ')}`);
  }
  return adapter;
}

export function getAllAdapters(): VendorAdapter[] {
  return [...adapters.values()];
}
