# Asset Sync — Canonical Schema & Adapters (Claude Code + Cursor)

## What & Why
Turns §5 of the [context-injection formats survey](../research/context-injection-formats-survey.md) into buildable code: a canonical, transport-agnostic representation for "AI working set" assets and the first two per-tool adapters (**Claude Code** and **Cursor**). This is the core PromptAtrium sync engine that both the CLI and the MCP server will call.

The design follows the existing `@workspace/prompt-crud` pattern exactly: a small library that defines an **adapter interface** plus concrete implementations, depends on **no** filesystem/transport package directly (callers inject a `FileReader`/`FileWriter`), and ships its contracts as plain zod + TypeScript. Kinds align with the `prompt_types` rows already seeded in the DB (`rule`, `skill`, `agent`, `plugin`) — see [28-schema-db-additions](./28-schema-db-additions.md).

## Done looks like
- New workspace lib `@workspace/asset-core` (`lib/asset-core`) that builds under `pnpm run typecheck`.
- A **canonical asset model**: a zod discriminated union (`AssetFrontmatter`) over five kinds — `rule`, `skill`, `command`, `prompt`, `mcp-server` — plus an `AssetBundle` (frontmatter + markdown body + bundled resource files + provenance).
- A serializer/parser that round-trips an `AssetBundle` ↔ a frontmatter'd markdown file (`asset.md`) byte-faithfully.
- A `TargetAdapter` interface (emit / parse / detect) with injected fs, mirroring `PromptCrudAdapter`'s storage-agnostic style.
- **`ClaudeCodeAdapter`** and **`CursorAdapter`** implementing it, including:
  - Claude Code: the **AGENTS.md ↔ CLAUDE.md bridge** (default: write `AGENTS.md`, ensure `CLAUDE.md` contains `@AGENTS.md`), `.claude/rules/*.md` with `paths:` for glob-scoped rules, `.claude/skills/<name>/SKILL.md`, `.claude/commands/*.md`, `.mcp.json` entries.
  - Cursor: `.cursor/rules/*.mdc` with correct `alwaysApply`/`globs`/`description` per the four rule types, nested dirs for subdir scope, `.cursor/mcp.json` entries, and explicit lossy-degrade warnings for kinds Cursor can't represent natively.
- A `SyncEngine` that drives adapters, plus **drift detection** via a `.promptatrium/manifest.json` (per-emitted-file content hash).
- Unit tests for round-trip and for each adapter's emit + parse on a fixture asset set.

## Out of scope
- The MCP server and CLI front-ends (separate tasks; they import `@workspace/asset-core`).
- Adapters beyond Claude Code + Cursor (Copilot, Codex, Windsurf are the next tranche — interface is designed to absorb them).
- The `workflow` asset kind (deferred per survey §3 until `gh-aw` exits preview).
- Pulling MCP servers from the official registry / `server.json` resolution (the `mcp-server` *config-injection* is in scope; *discovery* is a later task).
- DB persistence of assets (this lib is filesystem-facing; mapping to `prompts`/`prompt_types` rows is a follow-up).
- Secret values — `mcp-server` env carries **references**, never secrets.

## Canonical model (concrete)

`lib/asset-core/src/schema.ts` — zod v4 to match `lib/db` (`import { z } from "zod/v4"`):

```ts
import { z } from "zod/v4";

export const AssetKind = z.enum(["rule", "skill", "command", "prompt", "mcp-server"]);
export type AssetKind = z.infer<typeof AssetKind>;

export const AssetScope = z.enum(["global", "project", "subdir"]);

/** Maps to Cursor rule types, Copilot applyTo, Windsurf trigger, Claude paths. */
export const RuleActivation = z.enum([
  "always",          // Cursor alwaysApply:true · Windsurf always_on · Claude top-level
  "auto-attached",   // Cursor globs · Copilot applyTo · Windsurf glob
  "agent-requested", // Cursor description-driven · Windsurf model_decision
  "manual",          // @-mention only
  "glob",            // alias of auto-attached when only globs drive it
]);

const TargetRouting = z.object({
  include: z.array(z.string()).optional(), // e.g. ["claude-code","cursor"]
  exclude: z.array(z.string()).optional(),
});

const ArgSpec = z.object({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(false),
});

/** Reference to a secret/env value — never the value itself. */
const EnvRef = z.object({
  from: z.enum(["env", "prompt", "literal-nonsecret"]),
  key: z.string(),          // env var name or prompt label
  default: z.string().optional(),
});

const PackageRef = z.object({
  registry: z.enum(["npm", "pypi", "oci", "remote"]),
  identifier: z.string(),   // pkg name, image, or URL
  version: z.string().optional(),
});

/**
 * Shared base. `x` is the namespaced escape hatch: tool-specific fields are
 * preserved verbatim under `x["claude-code"]`, `x.cursor`, `x.mcp`, … so a
 * Tool→canonical→same-Tool round-trip is lossless, while a cross-tool
 * projection drops inapplicable keys *explicitly* (reported, not silent).
 */
const BaseFrontmatter = z.object({
  name: z.string().min(1).max(64),
  description: z.string().max(1024).optional(),
  scope: AssetScope.default("project"),
  targets: TargetRouting.optional(),
  x: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
});

const RuleFrontmatter = BaseFrontmatter.extend({
  kind: z.literal("rule"),
  activation: RuleActivation.default("agent-requested"),
  globs: z.array(z.string()).optional(),
});

const SkillFrontmatter = BaseFrontmatter.extend({
  kind: z.literal("skill"),
  description: z.string().max(1024),          // required for skills (open spec)
  license: z.string().optional(),
  compatibility: z.string().max(500).optional(),
  allowedTools: z.array(z.string()).optional(),
});

const CommandFrontmatter = BaseFrontmatter.extend({
  kind: z.literal("command"),
  argumentHint: z.string().optional(),
  arguments: z.array(ArgSpec).optional(),
  allowedTools: z.array(z.string()).optional(),
});

const PromptFrontmatter = BaseFrontmatter.extend({
  kind: z.literal("prompt"),
  arguments: z.array(ArgSpec).optional(),     // body holds the template; multi-message via ---
});

const McpServerFrontmatter = BaseFrontmatter.extend({
  kind: z.literal("mcp-server"),
  transport: z.enum(["stdio", "http"]),
  package: PackageRef,
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), EnvRef).optional(),
});

export const AssetFrontmatter = z.discriminatedUnion("kind", [
  RuleFrontmatter, SkillFrontmatter, CommandFrontmatter, PromptFrontmatter, McpServerFrontmatter,
]);
export type AssetFrontmatter = z.infer<typeof AssetFrontmatter>;
```

`lib/asset-core/src/types.ts` — the bundle + injected fs (mirrors `KeyValueStore`/`FetchLike`):

```ts
import type { AssetFrontmatter, AssetKind } from "./schema";

export interface ResourceFile { relativePath: string; contents: string; }

/** Canonical in-memory asset: one frontmatter'd entrypoint + optional resources. */
export interface AssetBundle {
  frontmatter: AssetFrontmatter;
  body: string;                       // markdown after the frontmatter
  resources?: ResourceFile[];         // skills/commands bundle (scripts/, references/)
  source?: { adapterId: string; path: string };  // provenance when parsed
}

/** Injected read side — a node fs wrapper, an in-memory map in tests, or git. */
export interface FileReader {
  read(path: string): Promise<string | null>;
  list(globPattern: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
}

/** Injected write side. `symlink` lets the Claude bridge offer symlink mode. */
export interface FileWriter {
  write(path: string, contents: string): Promise<void>;
  symlink(targetPath: string, linkPath: string): Promise<void>;
}

export interface EmitContext {
  scope: "global" | "project" | "subdir";
  root: string;                       // project root, or home dir for global
  options?: Record<string, unknown>;  // adapter-specific, e.g. claudeBridge
}

export interface WriteFile {
  path: string;
  contents: string;
  mode: "write" | "symlink";
  symlinkTarget?: string;
}

export interface Lint { level: "warn" | "error"; message: string; }

export interface EmitResult {
  files: WriteFile[];
  droppedFields: string[];            // explicit lossy-projection report
  warnings: Lint[];
}

export interface NativeFile { path: string; contents: string; }

/** Bidirectional, fs-agnostic. Pure where possible: emit() returns files; the
 *  engine (not the adapter) touches the FileWriter and the manifest. */
export interface TargetAdapter {
  readonly id: string;                // "claude-code" | "cursor"
  readonly displayName: string;
  readonly supportedKinds: ReadonlySet<AssetKind>;

  /** Canonical -> native files for one asset. Pure. */
  emit(asset: AssetBundle, ctx: EmitContext): EmitResult;

  /** Native files -> canonical (best-effort import). */
  parse(files: NativeFile[], ctx: EmitContext): AssetBundle[];

  /** Locate this tool's native asset files under a root. */
  detect(fs: FileReader, root: string): Promise<NativeFile[]>;
}
```

## Adapter behavior reference

### ClaudeCodeAdapter (`id: "claude-code"`)
| Kind | Emits | Notes |
|---|---|---|
| `rule` (project, no globs) | `AGENTS.md` body **+** ensure `CLAUDE.md` has `@AGENTS.md` | The **bridge** — option `claudeBridge: "import" \| "symlink" \| "inline"` (default `import`). Solves the one gap every other tool ignores. |
| `rule` (subdir or globs) | `.claude/rules/<name>.md` with `paths:` frontmatter | Claude Code's native path-scoped rules. |
| `rule` (global) | `~/.claude/CLAUDE.md` (append region) | No global AGENTS.md native. |
| `skill` | `.claude/skills/<name>/SKILL.md` + resources | `allowedTools`→`allowed-tools`; restore `x["claude-code"]` (`when_to_use`, `context`, `model`, `effort`, `hooks`). |
| `command` | `.claude/commands/<name>.md` | `argumentHint`/`arguments` preserved. |
| `prompt` | — (warn) | No native prompt-library file; routed to the MCP-server surface instead. `droppedFields` notes it. |
| `mcp-server` | `.mcp.json` (project) / `~/.claude.json` (global) entry | env as refs; never writes secret values. |

### CursorAdapter (`id: "cursor"`)
| Kind | Emits | Notes |
|---|---|---|
| `rule` | `.cursor/rules/<name>.mdc` | Mapping: `always`→`alwaysApply:true`; `auto-attached`/`glob`→`alwaysApply:false`+`globs`; `agent-requested`→`alwaysApply:false`+`description`; `manual`→`alwaysApply:false`, no desc/globs. Restore `x.cursor`. |
| `rule` (subdir) | `.cursor/rules/<dir>/<name>.mdc` | Nested dirs scope to folder. |
| `skill` | `.cursor/rules/<name>.mdc` (`agent-requested`) **+ warn** | Cursor has no skill runtime; degrade to a description-driven rule; bundled resources dropped (reported). |
| `command` | — (warn) | No native slash-command file; skipped with a warning. |
| `prompt` | — (warn) | Routed to MCP surface. |
| `mcp-server` | `.cursor/mcp.json` entry | |

Both adapters also honor `AGENTS.md` as an import path in `parse()` (Cursor reads it natively; Claude via the bridge).

## Round-trip & drift
- **Serializer** (`serialize.ts`): `AssetBundle ↔ asset.md` (YAML frontmatter via a small, dependency-light emitter; body verbatim). Property test: `parse(serialize(x)) deepEquals x`.
- **SyncEngine** (`engine.ts`): given canonical assets + a target list, calls `adapter.emit`, writes via `FileWriter`, and records each emitted file's path + SHA-256 in `.promptatrium/manifest.json`.
- **Drift**: `engine.status()` re-emits in-memory and compares hashes against on-disk native files; reports `in-sync | drifted | missing | foreign-edit`. This generalizes the one feature only Block's `ai-rules` has today (survey §4.4) and is the headline differentiator.

## Steps
1. **Scaffold the lib** — `lib/asset-core/{package.json,tsconfig.json,src/}`. Copy the `@workspace/prompt-crud` package.json/tsconfig shape (`type: module`, `exports: "./src/index.ts"`, `composite`). Add `zod` (catalog) as a dependency. Add to nothing else — no fs deps.
2. **Schema** — write `src/schema.ts` (above). Export `AssetFrontmatter`, `AssetKind`, `AssetScope`, `RuleActivation`.
3. **Types** — write `src/types.ts` (above): `AssetBundle`, `FileReader`, `FileWriter`, `TargetAdapter`, `EmitContext`, `EmitResult`, etc.
4. **Serializer** — `src/serialize.ts`: `serializeAsset(bundle): string` and `parseAsset(raw, source): AssetBundle` (validates frontmatter with `AssetFrontmatter.parse`). Keep the YAML subset small and deterministic.
5. **Adapter base helpers** — `src/adapters/shared.ts`: frontmatter mapping helpers, `x`-namespace merge/restore, glob-scope detection, `droppedFields` accounting.
6. **ClaudeCodeAdapter** — `src/adapters/ClaudeCodeAdapter.ts` per the table, including the `claudeBridge` option and `.claude/rules` `paths:` handling. `parse()` reads `CLAUDE.md` (resolving `@imports`, max 4 hops), `AGENTS.md`, `.claude/{skills,commands,rules}`, `.mcp.json`.
7. **CursorAdapter** — `src/adapters/CursorAdapter.ts` per the table, including the four-rule-type `.mdc` mapping and nested-dir scope. `parse()` reads `.cursor/rules/**/*.mdc`, `AGENTS.md`, `.cursor/mcp.json`.
8. **SyncEngine + manifest** — `src/engine.ts`: `sync(assets, targets, {reader, writer})` and `status(...)` with `.promptatrium/manifest.json` SHA tracking.
9. **Barrel** — `src/index.ts` re-exports schema, types, serializer, adapters, engine.
10. **Tests** — `src/__tests__/`: round-trip property test; per-adapter emit snapshots against a 5-asset fixture (one of each kind); a parse→emit→parse stability test; a drift-detection test using an in-memory `FileReader`/`FileWriter`.
11. **Verify** — `pnpm run typecheck` clean; tests pass; manually emit the fixture rule and confirm Claude gets `AGENTS.md` + `@AGENTS.md` CLAUDE.md and Cursor gets a correct `.mdc`.

## Open questions
- **Claude bridge default** — `import` (`@AGENTS.md` in CLAUDE.md) vs `symlink`. Recommend `import` as default (works in containers/CI where symlinks are fragile), `symlink` opt-in. Confirm.
- **`prompt` kind native home** — confirmed there's no native per-tool *file* for prompts in Claude/Cursor; they surface through the MCP-server prompts/list. OK to make `prompt` MCP-surface-only at launch (no file emit)?
- **mcp-server scope** — project `.mcp.json`/`.cursor/mcp.json` only at first, or also user-global (`~/.claude.json`)? Global config files don't version-sync cleanly (secrets/auth) — suggest project-scope first.

## Relevant files
- `lib/asset-core/` (new)
- `lib/prompt-crud/src/types.ts` — adapter-interface pattern to mirror
- `lib/prompt-crud/package.json`, `lib/prompt-crud/tsconfig.json` — package shape to copy
- `lib/db/src/schema/schema.ts` — `prompt_types` rows (`rule`/`skill`/`agent`/`plugin`) to align kinds with
- `docs/research/context-injection-formats-survey.md` — source of the format facts the adapters encode
