import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect } from "react";
import { StyleSheet } from "react-native";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { PromptEditForm, type PromptFormValues } from "@/components/PromptEditForm";
import { EmptyState } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { makeLocalPrompt } from "@/lib/local";
import { useSaved } from "@/lib/saved";

function cleanPatch(values: PromptFormValues) {
  return {
    name: values.name,
    promptContent: values.promptContent || null,
    description: values.description || null,
    negativePrompt: values.negativePrompt || null,
    category: values.category || null,
    promptType: values.promptType || null,
    tags: values.tags.length ? values.tags : null,
  };
}

export default function PromptEditScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { saved, add, update } = useSaved();

  const isNew = id === "new";
  const existing = isNew ? undefined : saved.find((p) => p.id === id);
  // Only device-created prompts (local- ids) are editable in v1; server prompts
  // are read-only in this public-browsing app.
  const editable = isNew || (!!existing && !!id && id.startsWith("local-"));

  useLayoutEffect(() => {
    navigation.setOptions({ title: isNew ? "New prompt" : "Edit prompt" });
  }, [navigation, isNew]);

  if (!editable) {
    return (
      <EmptyState
        icon="lock"
        title="This prompt can't be edited"
        subtitle="Only prompts you create or save to your own library can be edited."
      />
    );
  }

  function handleSubmit(values: PromptFormValues) {
    const patch = cleanPatch(values);
    if (isNew) {
      const prompt = makeLocalPrompt(patch);
      add(prompt);
      router.replace(`/prompt/${prompt.id}`);
      return;
    }
    update(id, patch);
    router.back();
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      bottomOffset={24}
      showsVerticalScrollIndicator={false}
    >
      <PromptEditForm
        key={id}
        initial={existing}
        submitLabel={isNew ? "Create prompt" : "Save changes"}
        onSubmit={handleSubmit}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 56 },
});
