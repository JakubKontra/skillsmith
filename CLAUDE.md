# Skillsmith

Forge AI coding skills once, export to Claude, Cursor, Windsurf, GitHub Copilot, and Codex.

## Commands

```bash
npm run build     # Build with tsup (ESM + DTS)
npm test          # Run tests with vitest
npm run dev       # Watch mode build
npm run test:watch # Watch mode tests
```

## Architecture

- `src/core/types.ts` — Universal skill interfaces (`UniversalSkill`, `VendorName`, etc.)
- `src/core/parser.ts` — Parses `skill.md` files (YAML frontmatter + Markdown body) into `UniversalSkill`
- `src/core/lockfile.ts` — Manages `.skillsmith.json` lockfile for tracking installed skills
- `src/adapters/base.ts` — Abstract `VendorAdapter` class with shared export logic
- `src/adapters/{claude,cursor,windsurf,copilot,codex}.ts` — Vendor-specific adapters
- `src/adapters/registry.ts` — Maps `VendorName` to adapter instances
- `src/cli/` — CLI commands (`add`, `sync`, `init`, `list`, `export`)
- `src/utils/` — Frontmatter parsing (`gray-matter`) and filesystem helpers

## Coding Standards

- TypeScript with strict mode, ESM modules
- No CLI framework — raw `process.argv` parsing
- Minimal dependencies (only `gray-matter` in production)
- Adapter pattern: adding a new vendor = one file in `src/adapters/` + one line in `registry.ts`
- Tests in `tests/` mirroring `src/` structure, using vitest
- Test fixtures in `tests/fixtures/`

## Key Concepts

- **Universal skill format**: `skill.md` with YAML frontmatter (`name`, `description`, `globs`, `activation`, `allowed-tools`)
- **Activation mapping**: `always` / `auto` / `manual` maps to vendor-specific concepts (see README table)
- **Lockfile**: `.skillsmith.json` tracks source paths + vendors for `sync` command
- Resources (scripts/references/assets) only supported by Claude adapter
