import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Header } from "@/components/Header";
import { PromptCard } from "@/components/PromptCard";
import { Chip, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useInfinitePrompts, usePrompts, type PromptQuery } from "@/lib/api";

type Sort = "trending" | "recent";

function FilterRow({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value?: string;
  onSelect: (v?: string) => void;
}) {
  const colors = useColors();
  if (options.length === 0) return null;
  return (
    <View style={styles.filterRow}>
      <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" active={!value} onPress={() => onSelect(undefined)} />
        {options.map((o) => (
          <Chip key={o} label={o} active={value === o} onPress={() => onSelect(o)} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function BrowseScreen() {
  const colors = useColors();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<Sort>("trending");
  const [category, setCategory] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Derive filter facets from a recent sample (the options endpoint is auth-gated).
  const facetSource = usePrompts({ sortBy: "recent", limit: 80 });
  const { categories, types } = useMemo(() => {
    const data = facetSource.data || [];
    const cats = [...new Set(data.map((p) => p.category).filter(Boolean) as string[])].sort();
    const tps = [...new Set(data.map((p) => p.promptType).filter(Boolean) as string[])].sort();
    return { categories: cats.slice(0, 24), types: tps.slice(0, 16) };
  }, [facetSource.data]);

  const query: Omit<PromptQuery, "offset" | "limit"> = { search, sortBy, category, type };
  const list = useInfinitePrompts(query);
  const prompts = useMemo(() => (list.data?.pages || []).flat(), [list.data]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Browse" subtitle="Search the prompt library" />

      <View style={styles.controls}>
        <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search prompts, tags, styles…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchInput.length > 0 ? (
            <Pressable onPress={() => setSearchInput("")} hitSlop={8}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sortRow}>
          <Chip label="Trending" active={sortBy === "trending"} onPress={() => setSortBy("trending")} />
          <Chip label="Recent" active={sortBy === "recent"} onPress={() => setSortBy("recent")} />
        </View>
      </View>

      <FlatList
        data={prompts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PromptCard prompt={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <FilterRow label="Category" options={categories} value={category} onSelect={setCategory} />
            <FilterRow label="Type" options={types} value={type} onSelect={setType} />
          </View>
        }
        ListEmptyComponent={
          list.isLoading ? (
            <LoadingState label="Loading prompts…" />
          ) : list.isError ? (
            <ErrorState message={(list.error as Error)?.message} onRetry={() => list.refetch()} />
          ) : (
            <EmptyState
              icon="search"
              title="No prompts found"
              subtitle="Try a different search or clear the filters."
            />
          )
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
        }}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={{ height: 100 }} />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage}
            onRefresh={() => list.refetch()}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  controls: { paddingHorizontal: 18, paddingTop: 14, gap: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  sortRow: { flexDirection: "row" },
  filterRow: { marginBottom: 10 },
  filterLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  chips: { paddingHorizontal: 18 },
  listContent: { paddingHorizontal: 18, paddingTop: 14 },
  footer: { paddingVertical: 24 },
});
