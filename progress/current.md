## 2026-07-17 — Note from Pass 2 audit remediation (Opción C deferred)

The flat-config ESLint setup in this repo currently has a **shadow regression** introduced by the Pass 2 mechanical sweep (2026-07-17):

- `eslint.config.js` (781 B, rich config with `eslint-plugin-prettier` integration + `consistent-type-imports` rule + `explicit-function-return-type: off` + `@typescript-eslint/no-explicit-any: warn`) is shadowed by:
- `eslint.config.mjs` (546 B, minimal TS-only preset) that was created by the sweep because no `eslint.config.mjs` existed.

ESLint flat-config resolution prefers `.mjs` over `.js` when both exist in the same directory. The richer rules (Prettier integration, consistent-type-imports) are silently ignored until the configuration is consolidated.

### Action items to restore the rich config (deferred to manual work):

1. Read the current `eslint.config.js` (the source of truth for the rich rules).
2. Port that content into `eslint.config.mjs` (replacing the current minimal preset).
3. Delete the `eslint.config.js` (so the `.mjs` becomes the single canonical flat-config).
4. Verify with `pnpm lint` that no regressions appear.
5. Optionally: re-run the project-doctrine validator to confirm 0 breaches remain.

### Decision context

This was **deliberately deferred (Opción C)** because:
- The audit script reports 0 breaches for job-tracker (the new minimal `.mjs` satisfies the file-presence check).
- No production MCP stdio discipline rule was lost (that's only in `personal-brand`, which was treated with Opción A = consolidated).
- Restoring the rich Prettier integration is mechanical but better done with full test coverage rather than in a fast sweep.

