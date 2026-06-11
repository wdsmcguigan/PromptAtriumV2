import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Header } from "@/components/Header";
import { PromptCard } from "@/components/PromptCard";
import { Chip, EmptyState, LoadingState } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { exportPrompts } from "@/lib/exportPrompts";
import { useSaved } from "@/lib/saved";

export default function SavedScreen() {
  const colors = useColors();
  const router = useRouter();
  const { saved, ready } = useSaved();
  const r = colors.radius;

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of saved) for (const t of p.tags ?? []) if (t) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [saved]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return saved.filter((p) => {
      if (activeTag && !(p.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      const hay = [
        p.name,
        p.description,
        p.promptContent,
        p.category,
        p.promptType,
        ...(p.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [saved, search, activeTag]);

  async function onExport() {
    try {
      await exportPrompts(saved);
    } catch {
      // user cancelled or sharing unavailable — no-op
    }
  }

  const headerActions = (
    <View style={styles.actions}>
      {saved.length > 0 ? (
        <Pressable
          onPress={onExport}
          hitSlop={8}
          style={[styles.iconBtn, { backgroundColor: colors.secondary, borderRadius: r }]}
        >
          <Feather name="share" size={18} color={colors.secondaryForeground} />
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => router.push("/prompt/edit/new")}
        hitSlop={8}
        style={[styles.iconBtn, { backgroundColor: colors.primary, borderRadius: r }]}
      >
        <Feather name="plus" size={20} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header
        title="Saved"
        subtitle={
          saved.length > 0
            ? `${saved.length} prompt${saved.length === 1 ? "" : "s"} in your library`
            : "Your personal prompt library"
        }
        right={headerActions}
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PromptCard prompt={item} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            saved.length > 0 ? (
              <View style={styles.controls}>
                <View
                  style={[
                    styles.searchBox,
                    { backgroundColor: colors.input, borderColor: colors.border, borderRadius: r },
                  ]}
                >
                  <Feather name="search" size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search your library"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.searchInput, { color: colors.foreground }]}
                    returnKeyType="search"
                  />
                  {search ? (
                    <Pressable onPress={() => setSearch("")} hitSlop={8}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                </View>

                {allTags.length > 0 ? (
                  <FlatList
                    horizontal
                    data={["All", ...allTags]}
                    keyExtractor={(t) => t}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagBar}
                    renderItem={({ item }) => {
                      const isAll = item === "All";
                      const active = isAll ? activeTag === null : activeTag === item;
                      return (
                        <Chip
                          label={item}
                          active={active}
                          onPress={() => setActiveTag(isAll ? null : item)}
                        />
                      );
                    }}
                  />
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            saved.length === 0 ? (
              <EmptyState
                icon="bookmark"
                title="No prompts yet"
                subtitle="Create your own with +, save one from Discover, or import a file to build your library."
              />
            ) : (
              <EmptyState
                icon="search"
                title="No matches"
                subtitle="Try a different search or clear the tag filter."
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 120, flexGrow: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  controls: { gap: 12, marginBottom: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 0 },
  tagBar: { paddingRight: 8 },
});
