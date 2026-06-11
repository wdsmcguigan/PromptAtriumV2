import { Feather } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import {
  PromptListItem,
  SearchBar,
  usePromptCrud,
  type PromptCrudItem,
} from "@workspace/prompt-crud";
import { Header } from "@/components/Header";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { liteAdapter } from "@/lib/liteAdapter";

async function exportLibrary(items: PromptCrudItem[]) {
  const json = JSON.stringify(items, null, 2);
  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompt-library.json";
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const path = `${FileSystem.cacheDirectory}prompt-library.json`;
  await FileSystem.writeAsStringAsync(path, json, { encoding: "utf8" });
  await Sharing.shareAsync(path, { mimeType: "application/json", UTI: "public.json" });
}

interface SwipeableRowProps {
  item: PromptCrudItem;
  onPress: (item: PromptCrudItem) => void;
  onEdit: (item: PromptCrudItem) => void;
  onDelete: (item: PromptCrudItem) => void;
}

function SwipeableRow({ item, onPress, onEdit, onDelete }: SwipeableRowProps) {
  const colors = useColors();
  const swipeRef = useRef<Swipeable>(null);

  const handleDelete = useCallback(() => {
    swipeRef.current?.close();
    onDelete(item);
  }, [item, onDelete]);

  const renderRightActions = (
    _: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });
    return (
      <Pressable
        onPress={handleDelete}
        style={[styles.deleteAction, { backgroundColor: colors.destructive }]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Feather name="trash-2" size={22} color="#fff" />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <PromptListItem
        item={item}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
        colors={colors}
      />
    </Swipeable>
  );
}

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { items, loading, error, refresh, remove } = usePromptCrud(liteAdapter);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const displayed = search.trim()
    ? items.filter(
        (p: PromptCrudItem) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.promptContent ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (p.tags ?? []).some((t: string) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : items;

  const handleEdit = useCallback(
    (item: PromptCrudItem) => {
      router.push(`/library/edit/${item.id}` as never);
    },
    [router],
  );

  const handleDelete = useCallback(
    (item: PromptCrudItem) => {
      const doDelete = async () => {
        await remove(item.id);
      };
      if (Platform.OS === "web") {
        if (window.confirm(`Delete "${item.name}"?`)) doDelete();
      } else {
        Alert.alert("Delete prompt?", `"${item.name}" will be permanently removed.`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ]);
      }
    },
    [remove],
  );

  const handlePress = useCallback(
    (item: PromptCrudItem) => {
      router.push(`/library/${item.id}` as never);
    },
    [router],
  );

  const handleExport = useCallback(async () => {
    if (items.length === 0) {
      Alert.alert("Library is empty", "Add some prompts before exporting.");
      return;
    }
    setExporting(true);
    try {
      await exportLibrary(items);
    } catch (e: unknown) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Could not export.");
    } finally {
      setExporting(false);
    }
  }, [items]);

  const headerRight = (
    <View style={styles.headerButtons}>
      <Pressable
        onPress={handleExport}
        hitSlop={10}
        disabled={exporting}
        style={({ pressed }) => ({ opacity: pressed || exporting ? 0.6 : 1 })}
      >
        <Feather name="share" size={20} color={colors.mutedForeground} />
      </Pressable>
      <Pressable
        onPress={() => router.push("/library/create" as never)}
        hitSlop={10}
        style={({ pressed }) => [
          styles.newBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name="plus" size={18} color={colors.primaryForeground} />
        <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>New</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header
        title="My Library"
        subtitle={
          items.length > 0 ? `${items.length} prompt${items.length === 1 ? "" : "s"}` : "Your private prompt collection"
        }
        right={headerRight}
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search prompts…"
        colors={colors}
      />

      {loading && items.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => refresh()} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(p: PromptCrudItem) => p.id}
          renderItem={({ item }) => (
            <SwipeableRow
              item={item}
              onPress={handlePress}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            search.trim() ? (
              <EmptyState
                icon="search"
                title="No results"
                subtitle={`No prompts match "${search}"`}
              />
            ) : (
              <EmptyState
                icon="book"
                title="Library is empty"
                subtitle='Tap "New" to create your first prompt, or use the Discover tab to save community prompts here.'
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
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120, flexGrow: 1 },
  headerButtons: { flexDirection: "row", alignItems: "center", gap: 12 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  deleteAction: {
    width: 72,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});
