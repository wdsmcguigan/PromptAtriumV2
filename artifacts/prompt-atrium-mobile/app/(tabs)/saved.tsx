import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { Header } from "@/components/Header";
import { PromptCard } from "@/components/PromptCard";
import { EmptyState, LoadingState } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useSaved } from "@/lib/saved";

export default function SavedScreen() {
  const colors = useColors();
  const { saved, ready } = useSaved();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header
        title="Saved"
        subtitle={saved.length > 0 ? `${saved.length} saved prompt${saved.length === 1 ? "" : "s"}` : "Your bookmarked prompts"}
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PromptCard prompt={item} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark"
              title="No saved prompts yet"
              subtitle="Tap the bookmark icon on any prompt to save it here for quick access."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 120, flexGrow: 1 },
});
