import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { PromptForm, type PromptCreateInput, type PromptCrudItem } from "@workspace/prompt-crud";
import { useColors } from "@/hooks/useColors";
import { liteAdapter } from "@/lib/liteAdapter";

export default function EditPromptScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prompt, setPrompt] = useState<PromptCrudItem | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    liteAdapter.get(id).then(setPrompt).catch(() => {});
  }, [id]);

  const handleSubmit = useCallback(
    async (input: PromptCreateInput) => {
      if (!id) return;
      setLoading(true);
      try {
        await liteAdapter.update(id, input);
        router.back();
      } catch (err) {
        Alert.alert("Error", err instanceof Error ? err.message : "Failed to update prompt");
      } finally {
        setLoading(false);
      }
    },
    [id, router],
  );

  if (!prompt) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <PromptForm
      initial={prompt}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      loading={loading}
      colors={colors}
      radius={colors.radius}
    />
  );
}
