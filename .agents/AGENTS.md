# Rules

- **Verbatim Module Syntax (TypeScript)**: Always use `import type` instead of standard `import` when importing types, interfaces, or type-only modules. This project has `verbatimModuleSyntax` enabled in `tsconfig.json`, and failing to use `import type` will cause build errors and white screen crashes.
