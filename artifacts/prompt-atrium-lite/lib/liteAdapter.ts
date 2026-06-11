import { LocalAdapter } from "@workspace/prompt-crud";

/**
 * Singleton LocalAdapter for the PromptAtriumLite personal library.
 * All screens share this instance so they all read/write the same storage key.
 */
export const liteAdapter = new LocalAdapter("lite_prompts");
