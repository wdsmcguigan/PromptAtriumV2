import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Prompt } from "@/lib/api";

export interface PromptFormValues {
  name: string;
  promptContent: string;
  description: string;
  negativePrompt: string;
  category: string;
  promptType: string;
  tags: string[];
}

type Colors = ReturnType<typeof useColors>;

function toValues(initial?: Prompt): PromptFormValues {
  return {
    name: initial?.name ?? "",
    promptContent: initial?.promptContent ?? "",
    description: initial?.description ?? "",
    negativePrompt: initial?.negativePrompt ?? "",
    category: initial?.category ?? "",
    promptType: initial?.promptType ?? "",
    tags: (initial?.tags ?? []).filter(Boolean) as string[],
  };
}

function Field({
  label,
  colors,
  children,
}: {
  label: string;
  colors: Colors;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

/**
 * Create/edit form for a locally-stored prompt. There is no `isPublic` switch:
 * the mobile app keeps a device-only library and never writes prompts to the
 * server. `onSubmit` returns the trimmed field values; the caller decides
 * whether to create (makeLocalPrompt) or patch an existing entry.
 */
export function PromptEditForm({
  initial,
  submitLabel = "Save prompt",
  onSubmit,
}: {
  initial?: Prompt;
  submitLabel?: string;
  onSubmit: (values: PromptFormValues) => void;
}) {
  const colors = useColors();
  const r = colors.radius;
  const start = toValues(initial);

  const [name, setName] = useState(start.name);
  const [promptContent, setPromptContent] = useState(start.promptContent);
  const [description, setDescription] = useState(start.description);
  const [negativePrompt, setNegativePrompt] = useState(start.negativePrompt);
  const [category, setCategory] = useState(start.category);
  const [promptType, setPromptType] = useState(start.promptType);
  const [tags, setTags] = useState<string[]>(start.tags);
  const [draftTag, setDraftTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fieldStyle = [
    styles.input,
    {
      color: colors.foreground,
      backgroundColor: colors.input,
      borderColor: colors.border,
      borderRadius: r,
    },
  ];

  function addTag() {
    const t = draftTag.trim();
    if (!t || tags.includes(t) || tags.length >= 20) {
      setDraftTag("");
      return;
    }
    setTags((prev) => [...prev, t]);
    setDraftTag("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function submit() {
    if (!name.trim()) {
      setError("Give your prompt a name.");
      return;
    }
    if (!promptContent.trim()) {
      setError("Prompt content can't be empty.");
      return;
    }
    setError(null);
    onSubmit({
      name: name.trim(),
      promptContent: promptContent.trim(),
      description: description.trim(),
      negativePrompt: negativePrompt.trim(),
      category: category.trim(),
      promptType: promptType.trim(),
      tags,
    });
  }

  return (
    <View style={styles.container}>
      <Field label="Name" colors={colors}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="My prompt"
          placeholderTextColor={colors.mutedForeground}
          style={fieldStyle}
        />
      </Field>

      <Field label="Prompt" colors={colors}>
        <TextInput
          value={promptContent}
          onChangeText={setPromptContent}
          placeholder="Write the prompt…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlignVertical="top"
          style={[fieldStyle, styles.multiline]}
        />
      </Field>

      <Field label="Negative prompt" colors={colors}>
        <TextInput
          value={negativePrompt}
          onChangeText={setNegativePrompt}
          placeholder="Optional — things to avoid"
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlignVertical="top"
          style={[fieldStyle, styles.multilineShort]}
        />
      </Field>

      <Field label="Description" colors={colors}>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description"
          placeholderTextColor={colors.mutedForeground}
          style={fieldStyle}
        />
      </Field>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Field label="Category" colors={colors}>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Marketing"
              placeholderTextColor={colors.mutedForeground}
              style={fieldStyle}
            />
          </Field>
        </View>
        <View style={styles.rowItem}>
          <Field label="Type" colors={colors}>
            <TextInput
              value={promptType}
              onChangeText={setPromptType}
              placeholder="e.g. Text to Image"
              placeholderTextColor={colors.mutedForeground}
              style={fieldStyle}
            />
          </Field>
        </View>
      </View>

      <Field label="Tags" colors={colors}>
        <View style={styles.tagInputRow}>
          <TextInput
            value={draftTag}
            onChangeText={setDraftTag}
            onSubmitEditing={addTag}
            placeholder="Add a tag…"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
            blurOnSubmit={false}
            style={[fieldStyle, styles.tagInput]}
          />
          <Pressable
            onPress={addTag}
            style={[styles.addTag, { backgroundColor: colors.secondary, borderRadius: r }]}
          >
            <Feather name="plus" size={18} color={colors.secondaryForeground} />
          </Pressable>
        </View>
        {tags.length > 0 ? (
          <View style={styles.tagWrap}>
            {tags.map((t) => (
              <Pressable
                key={t}
                onPress={() => removeTag(t)}
                style={[styles.tagChip, { backgroundColor: colors.secondary, borderRadius: r }]}
              >
                <Text style={[styles.tagChipText, { color: colors.secondaryForeground }]}>{t}</Text>
                <Feather name="x" size={13} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </Field>

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      <Pressable
        onPress={submit}
        style={({ pressed }) => [
          styles.submit,
          { backgroundColor: colors.primary, borderRadius: r, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="check" size={18} color={colors.primaryForeground} />
        <Text style={[styles.submitText, { color: colors.primaryForeground }]}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  field: { gap: 7 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  multiline: { minHeight: 140 },
  multilineShort: { minHeight: 80 },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  tagInputRow: { flexDirection: "row", gap: 8 },
  tagInput: { flex: 1 },
  addTag: { width: 46, alignItems: "center", justifyContent: "center" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tagChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  error: { fontSize: 14, fontFamily: "Inter_500Medium" },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    marginTop: 4,
  },
  submitText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
