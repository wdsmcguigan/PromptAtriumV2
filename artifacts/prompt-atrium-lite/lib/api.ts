import { useQuery } from "@tanstack/react-query";

/**
 * PromptAtriumLite data layer.
 *
 * Public, no-auth API calls only. AI tools and the Discover tab use these.
 */

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
export const API_BASE = DOMAIN ? `https://${DOMAIN}` : "";

export function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/objects/")) {
    const key = url.slice("/objects/".length);
    return `${API_BASE}/api/objects/serve/${encodeURIComponent(key)}`;
  }
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/api/objects/serve/${encodeURIComponent(url)}`;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

// ---- Lite public endpoints ----

export interface LitePrompt {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  promptType?: string | null;
  tags?: string[] | null;
  promptContent?: string | null;
  negativePrompt?: string | null;
  exampleImagesUrl?: string[] | null;
  likes?: number | null;
  usageCount?: number | null;
  intendedGenerator?: string | null;
  isFeatured?: boolean | null;
  isPublic?: boolean | null;
  createdAt?: string | null;
  user?: { username?: string | null; firstName?: string | null; lastName?: string | null } | null;
}

export function useLiteFeatured() {
  return useQuery<LitePrompt[]>({
    queryKey: ["/api/lite/featured"],
    queryFn: () => apiGet<LitePrompt[]>("/api/lite/featured"),
  });
}

export function useLitePreview() {
  return useQuery<LitePrompt[]>({
    queryKey: ["/api/lite/preview"],
    queryFn: () => apiGet<LitePrompt[]>("/api/lite/preview"),
  });
}

// ---- AI Tools (public, no-auth) ----

export type LlmProvider = "openai" | "google";

export interface EnhancePromptInput {
  prompt: string;
  llmProvider?: LlmProvider;
  llmModel?: string;
  useHappyTalk?: boolean;
  customBasePrompt?: string;
  subject?: string;
  character?: { name: string; description?: string };
}

export interface EnhancePromptResult {
  success: boolean;
  enhancedPrompt: string;
  metadata?: { provider?: string; model?: string };
}

export function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptResult> {
  return apiPost<EnhancePromptResult>("/api/enhance-prompt", {
    llmProvider: "google",
    llmModel: "gemini-2.5-flash",
    ...input,
  });
}

export interface MinerInput {
  taskType: "text" | "image";
  name: string;
  data?: string;
  base64?: string;
  mimeType?: string;
}

export interface MinedPrompt {
  id: string;
  title: string;
  content: string;
  negativePrompt?: string;
  model?: string;
  tags?: string[];
  source?: string;
  images?: string[];
}

export function minerAnalyze(input: MinerInput): Promise<{ prompts: MinedPrompt[] }> {
  if (input.taskType === "image") {
    const mimeType = input.mimeType ?? "image/jpeg";
    const raw = input.base64 ?? "";
    const base64 = raw.startsWith("data:") ? raw : `data:${mimeType};base64,${raw}`;
    return apiPost<{ prompts: MinedPrompt[] }>("/api/prompt-miner/analyze", {
      taskType: "file",
      name: input.name,
      mimeType,
      base64,
    });
  }
  return apiPost<{ prompts: MinedPrompt[] }>("/api/prompt-miner/analyze", {
    taskType: "text",
    name: input.name,
    data: input.data,
  });
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string | null;
  template_type?: string | null;
  master_prompt?: string | null;
  llm_provider?: string | null;
  llm_model?: string | null;
  use_happy_talk?: boolean | null;
}

export function useTemplates() {
  return useQuery<PromptTemplate[]>({
    queryKey: ["/api/system-data/prompt-templates"],
    queryFn: () => apiGet<PromptTemplate[]>("/api/system-data/prompt-templates"),
  });
}

export interface CharacterPreset {
  id: string;
  name: string;
  gender?: string | null;
  role?: string | null;
  description?: string | null;
}

export function usePresets() {
  return useQuery<CharacterPreset[]>({
    queryKey: ["/api/system-data/character-presets"],
    queryFn: () => apiGet<CharacterPreset[]>("/api/system-data/character-presets"),
  });
}

export function displayName(user?: LitePrompt["user"] | null): string {
  if (!user) return "Community";
  if (user.username) return user.username;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || "Community";
}
