import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { Prompt } from "./api";

/**
 * Export the local library to a JSON file the user can save or share.
 *
 * On native we write the file to the cache directory and hand it to the OS
 * share sheet (expo-sharing). expo-sharing has no web support, so on web we
 * fall back to a Blob download via an anchor element.
 */
export async function exportPrompts(prompts: Prompt[]): Promise<void> {
  const json = JSON.stringify(prompts, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `promptatrium-library-${stamp}.json`;

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const uri = `${FileSystem.cacheDirectory ?? ""}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Export prompt library",
      UTI: "public.json",
    });
  }
}
