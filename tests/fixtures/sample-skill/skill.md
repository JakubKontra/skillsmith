---
name: typescript-best-practices
description: Enforce TypeScript best practices and coding standards
globs: "**/*.ts,**/*.tsx"
activation: auto
allowed-tools: "Read Grep"
---

# TypeScript Best Practices

Apply these rules when working with TypeScript files.

## Coding Standards

- Use `const` by default, `let` when reassignment is needed, never `var`
- Prefer `interface` over `type` for object shapes
- Use strict TypeScript settings
- Always handle Promise rejections
- Use explicit return types on exported functions

## Naming Conventions

- PascalCase for types, interfaces, enums, and classes
- camelCase for variables, functions, and methods
- UPPER_SNAKE_CASE for constants
- Prefix interfaces with descriptive names, not `I`

## Error Handling

- Use custom error classes for domain errors
- Never swallow errors silently
- Log errors with context
