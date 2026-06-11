import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Chip, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useCodexCategories, useCodexTerms, type CodexTerm } from "@/lib/api";

function TermRow({ term, onCopy }: { term: CodexTerm; onCopy: (t: CodexTerm) => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => onCopy(term)}
      style={({ pressed }) => [
        styles.termRow,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 2, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.termBody}>
        <Text style={[styles.termTitle, { color: colors.foreground }]}>{term.term}</Text>
        {term.description ? (
          <Text style={[styles.termDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
            {term.description}
          </Text>
        ) : null}
      </View>
      <Feather name="copy" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function CodexScreen() {
  const colors = useColors();
  const categories = useCodexCategories();

  // The categories endpoint can return duplicate ids; dedupe so list keys stay
  // unique and selecting a chip highlights exactly one entry.
  const categoryList = useMemo(() => {
    const seen = new Set<string>();
    return (categories.data || []).filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [categories.data]);

  const [selected, setSelected] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Default to the first category once loaded.
  useEffect(() => {
    if (!selected && categoryList.length > 0) {
      setSelected(categoryList[0].id);
    }
  }, [categoryList, selected]);

  const terms = useCodexTerms(selected, search);
  const visibleTerms = useMemo(
    () => (terms.data || []).filter((t) => !t.isNsfw),
    [terms.data],
  );

  async function onCopy(term: CodexTerm) {
    await Clipboard.setStringAsync(term.term);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId((c) => (c === term.id ? null : c)), 1200);
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.controls}>
        <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search terms…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchInput.length > 0 ? (
            <Pressable onPress={() => setSearchInput("")} hitSlop={8}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        {categoryList.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipScroll}
          >
            {categoryList.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                active={selected === c.id}
                onPress={() => setSelected(c.id)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <FlatList
        data={visibleTerms}
        keyExtractor={(t, i) => `${t.id}-${i}`}
        renderItem={({ item }) => <TermRow term={item} onCopy={onCopy} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          categories.isLoading || terms.isLoading ? (
            <LoadingState label="Loading codex…" />
          ) : terms.isError ? (
            <ErrorState message={(terms.error as Error)?.message} onRetry={() => terms.refetch()} />
          ) : (
            <EmptyState
              icon="book-open"
              title="No terms found"
              subtitle="Try another category or search."
            />
          )
        }
      />

      {copiedId ? (
        <View style={[styles.toast, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={15} color={colors.primaryForeground} />
          <Text style={[styles.toastText, { color: colors.primaryForeground }]}>Copied to clipboard</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  controls: { paddingTop: 12, gap: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginHorizontal: 18,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  chipScroll: { flexGrow: 0 },
  chips: { paddingHorizontal: 18, paddingBottom: 4 },
  list: { padding: 18, gap: 10, paddingBottom: 60 },
  termRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  termBody: { flex: 1, gap: 4 },
  termTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  termDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  toast: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  toastText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
