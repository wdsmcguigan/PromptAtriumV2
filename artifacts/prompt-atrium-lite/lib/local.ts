import type { PromptCrudItem } from "@workspace/prompt-crud";

let counter = 0;

export function localId(): string {
  counter += 1;
  return `local-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function toTags(v: unknown): string[] | undefined {
  if (Array.isArray(v)) {
    const t = v.map((x) => str(x)).filter(Boolean);
    return t.length ? t : undefined;
  }
  if (typeof v === "string" && v.trim()) {
    const t = v.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    return t.length ? t : undefined;
  }
  return undefined;
}

/**
 * Best-effort mapping of an arbitrary imported record onto a PromptCrudItem.
 * Returns null when the record has neither a usable name nor body.
 */
export function normalizeToItem(rec: unknown): PromptCrudItem | null {
  if (!rec || typeof rec !== "object") return null;
  const r = rec as Record<string, unknown>;

  const name = str(r.name ?? r.title ?? r.Name ?? r.Title);
  const content = str(
    r.promptContent ?? r.prompt ?? r.content ?? r.text ?? r.Prompt ?? r.body,
  );
  if (!name && !content) return null;

  const now = new Date().toISOString();
  return {
    id: localId(),
    name: name || content.slice(0, 60) || "Imported prompt",
    promptContent: content || "",
    description: str(r.description ?? r.Description ?? r.desc) || null,
    tags: toTags(r.tags ?? r.Tags ?? r.keywords) ?? null,
    promptType: str(r.promptType ?? r.type ?? r.Type) || null,
    category: str(r.category ?? r.Category) || null,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  };
}
