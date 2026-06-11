import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Badge, ErrorState, LoadingState } from "@/components/ui";
import { gradients } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { liteAdapter } from "@/lib/liteAdapter";
import type { PromptCrudItem } from "@workspace/prompt-crud";
import { LinearGradient } from "expo-linear-gradient";

export default function LibraryDetailScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prompt, setPrompt] = useState<PromptCrudItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    liteAdapter
      .get(id)
      .then(setPrompt)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: prompt?.name ?? "Prompt",
      headerRight: () =>
        prompt ? (
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push(`/library/edit/${id}` as never)}
              hitSlop={10}
            >
              <Feather name="edit-2" size={20} color={colors.foreground} />
            </Pressable>
            <Pressable
              onPress={() => {
                const doDelete = async () => {
                  await liteAdapter.delete(id!);
                  router.back();
                };
                if (Platform.OS === "web") {
                  if (window.confirm(`Delete "${prompt.name}"?`)) doDelete();
                } else {
                  Alert.alert("Delete prompt?", "This will permanently remove the prompt.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: doDelete },
                  ]);
                }
              }}
              hitSlop={10}
            >
              <Feather name="trash-2" size={20} color={colors.destructive} />
            </Pressable>
          </View>
        ) : null,
    });
  }, [navigation, prompt, id, router, colors]);

  async function copy(text: string, key: string) {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  }

  if (loading) return <LoadingState label="Loading prompt…" />;
  if (error || !prompt)
    return <ErrorState message={error ?? "Prompt not found"} />;

  const badges = [prompt.category, prompt.promptType].filter(Boolean) as string[];
  const tags = (prompt.tags ?? []).filter(Boolean);
  const r = colors.radius;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {badges.length > 0 ? (
        <View style={styles.badges}>
          {badges.map((b) => (
            <Badge key={b} label={b} />
          ))}
        </View>
      ) : null}

      <Text style={[styles.title, { color: colors.foreground }]}>{prompt.name}</Text>

      {prompt.description ? (
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>{prompt.description}</Text>
      ) : null}

      {prompt.promptContent ? (
        <View style={[styles.block, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: r + 4 }]}>
          <View style={styles.blockHeader}>
            <Text style={[styles.blockLabel, { color: colors.mutedForeground }]}>Prompt</Text>
            <Pressable
              onPress={() => copy(prompt.promptContent, "prompt")}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Feather
                name={copied === "prompt" ? "check" : "copy"}
                size={16}
                color={copied === "prompt" ? colors.primary : colors.mutedForeground}
              />
            </Pressable>
          </View>
          <Text style={[styles.blockContent, { color: colors.foreground }]} selectable>
            {prompt.promptContent}
          </Text>
        </View>
      ) : null}

      {tags.length > 0 ? (
        <View style={styles.tagsSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Tags</Text>
          <View style={styles.tags}>
            {tags.map((t: string) => (
              <View key={t} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.tagText, { color: colors.secondaryForeground }]} numberOfLines={1}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push(`/library/edit/${id}` as never)}
        style={({ pressed }) => [
          styles.editBtn,
          { backgroundColor: colors.secondary, borderRadius: r + 2, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Feather name="edit-2" size={16} color={colors.secondaryForeground} />
        <Text style={[styles.editBtnText, { color: colors.secondaryForeground }]}>Edit prompt</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 16, paddingBottom: 60 },
  headerRight: { flexDirection: "row", gap: 18 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3, lineHeight: 28 },
  desc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  block: { borderWidth: 1, padding: 14, gap: 10 },
  blockHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  blockLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  blockContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  tagsSection: { gap: 8 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    marginTop: 4,
  },
  editBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
