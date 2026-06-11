import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Alert } from "react-native";

import { PromptForm, type PromptCreateInput } from "@workspace/prompt-crud";
import { useColors } from "@/hooks/useColors";
import { liteAdapter } from "@/lib/liteAdapter";

export default function CreatePromptScreen() {
  const colors = useColors();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = useCallback(
    async (input: PromptCreateInput) => {
      setLoading(true);
      try {
        await liteAdapter.create(input);
        router.back();
      } catch (err) {
        Alert.alert("Error", err instanceof Error ? err.message : "Failed to create prompt");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  return (
    <PromptForm
      onSubmit={handleSubmit}
      submitLabel="Create Prompt"
      loading={loading}
      colors={colors}
      radius={colors.radius}
    />
  );
}
