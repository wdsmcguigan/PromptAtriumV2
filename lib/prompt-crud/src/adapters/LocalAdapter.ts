import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PromptCreateInput, PromptCrudAdapter, PromptCrudItem } from "../types";

let counter = 0;

function generateId(): string {
  counter += 1;
  return `local-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * LocalAdapter — stores prompts entirely on-device in AsyncStorage.
 *
 * Used by PromptAtriumLite for a private, offline-first prompt library.
 * The storage key is configurable so multiple independent libraries can
 * coexist without collision.
 */
export class LocalAdapter implements PromptCrudAdapter {
  constructor(private readonly key: string = "prompt-crud.items.v1") {}

  private async readAll(): Promise<PromptCrudItem[]> {
    try {
      const raw = await AsyncStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as PromptCrudItem[]) : [];
    } catch {
      return [];
    }
  }

  private async writeAll(items: PromptCrudItem[]): Promise<void> {
    await AsyncStorage.setItem(this.key, JSON.stringify(items));
  }

  async list(params?: { search?: string }): Promise<PromptCrudItem[]> {
    const items = await this.readAll();
    const q = params?.search?.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.promptContent ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }

  async get(id: string): Promise<PromptCrudItem> {
    const items = await this.readAll();
    const item = items.find((p) => p.id === id);
    if (!item) throw new Error(`Prompt not found: ${id}`);
    return item;
  }

  async create(input: PromptCreateInput): Promise<PromptCrudItem> {
    const items = await this.readAll();
    const now = new Date().toISOString();
    const item: PromptCrudItem = {
      id: generateId(),
      name: input.name,
      promptContent: input.promptContent,
      description: input.description ?? null,
      tags: input.tags ?? null,
      promptType: input.promptType ?? null,
      category: input.category ?? null,
      isPublic: input.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await this.writeAll([item, ...items]);
    return item;
  }

  async update(id: string, input: Partial<PromptCreateInput>): Promise<PromptCrudItem> {
    const items = await this.readAll();
    const idx = items.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Prompt not found: ${id}`);
    const updated: PromptCrudItem = {
      ...items[idx],
      ...(input.name !== undefined && { name: input.name }),
      ...(input.promptContent !== undefined && { promptContent: input.promptContent }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.promptType !== undefined && { promptType: input.promptType }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      updatedAt: new Date().toISOString(),
    };
    items[idx] = updated;
    await this.writeAll(items);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const items = await this.readAll();
    await this.writeAll(items.filter((p) => p.id !== id));
  }

  /** Read the raw JSON from storage — used by export. */
  async exportAll(): Promise<PromptCrudItem[]> {
    return this.readAll();
  }

  /** Replace the entire library from an import — used by import. */
  async importAll(incoming: PromptCrudItem[]): Promise<void> {
    const existing = await this.readAll();
    const existingIds = new Map(existing.map((p) => [p.id, p]));
    const merged = [
      ...incoming.map((p) => ({ ...p })),
      ...existing.filter((p) => !incoming.some((q) => q.id === p.id) && !existingIds.has(p.id)),
    ];
    await this.writeAll(merged);
  }
}
