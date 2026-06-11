import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Header } from "@/components/Header";
import { EmptyState, ErrorState, LoadingState, SkeletonCard } from "@/components/ui";
import { gradients } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { displayName, resolveImageUrl, useLiteFeatured, useLitePreview, type LitePrompt } from "@/lib/api";
import { liteAdapter } from "@/lib/liteAdapter";

function DiscoverCard({
  prompt,
  onSave,
}: {
  prompt: LitePrompt;
  onSave: (prompt: LitePrompt) => void;
}) {
  const colors = useColors();
  const cover = resolveImageUrl(prompt.exampleImagesUrl?.[0]);
  const tags = (prompt.tags ?? []).filter(Boolean).slice(0, 3);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 4,
        },
      ]}
    >
      {cover ? (
        <View style={[styles.cover, { borderTopLeftRadius: colors.radius + 4, borderTopRightRadius: colors.radius + 4 }]}>
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={styles.coverGradient}
          />
        </View>
      ) : (
        <LinearGradient
          colors={gradients.library as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cover, { borderTopLeftRadius: colors.radius + 4, borderTopRightRadius: colors.radius + 4, alignItems: "center", justifyContent: "center" }]}
        >
          <Feather name="zap" size={28} color="rgba(255,255,255,0.85)" />
        </LinearGradient>
      )}
      <View style={styles.cardBody}>
        {prompt.category ? (
          <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>
            {prompt.category}
          </Text>
        ) : null}
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
          {prompt.name}
        </Text>
        {prompt.description ? (
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {prompt.description}
          </Text>
        ) : null}
        {tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((t) => (
              <View key={t} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.tagText, { color: colors.secondaryForeground }]} numberOfLines={1}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.author, { color: colors.mutedForeground }]} numberOfLines={1}>
            by {displayName(prompt.user)}
          </Text>
          <Pressable
            onPress={() => onSave(prompt)}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="download" size={14} color={colors.primaryForeground} />
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              Save
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LockedCard({ prompt }: { prompt: LitePrompt }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        styles.lockedCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 4,
        },
      ]}
    >
      <LinearGradient
        colors={gradients.tools as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cover, { borderTopLeftRadius: colors.radius + 4, borderTopRightRadius: colors.radius + 4, alignItems: "center", justifyContent: "center" }]}
      >
        <Feather name="lock" size={24} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
      <View style={[styles.cardBody, styles.lockedBody]}>
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {prompt.name}
        </Text>
        <View style={[styles.blurredLine, { backgroundColor: colors.secondary }]} />
        <View style={[styles.blurredLine, { backgroundColor: colors.secondary, width: "60%" }]} />
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const colors = useColors();

  const featured = useLiteFeatured();
  const preview = useLitePreview();

  const refreshing = featured.isRefetching || preview.isRefetching;
  const loading = featured.isLoading;

  const onRefresh = useCallback(() => {
    featured.refetch();
    preview.refetch();
  }, [featured, preview]);

  const handleSave = useCallback(async (prompt: LitePrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await liteAdapter.create({
        name: prompt.name,
        promptContent: prompt.promptContent ?? "",
        description: prompt.description ?? undefined,
        tags: (prompt.tags ?? []).filter(Boolean),
        promptType: prompt.promptType ?? undefined,
        category: prompt.category ?? undefined,
        isPublic: false,
      });
      if (Platform.OS === "web") {
        alert(`"${prompt.name}" saved to your library!`);
      } else {
        Alert.alert("Saved!", `"${prompt.name}" has been added to your library.`);
      }
    } catch {
      Alert.alert("Error", "Could not save the prompt. Please try again.");
    }
  }, []);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Discover" subtitle="Curated community prompts" brand />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <LinearGradient
          colors={gradients.library as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderRadius: colors.radius + 6 }]}
        >
          <Feather name="zap" size={20} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>Curated for you</Text>
          <Text style={styles.heroSub}>
            Hand-picked prompts from the PromptAtrium community. Save any to your personal library — no account needed.
          </Text>
        </LinearGradient>

        {loading ? (
          <View style={styles.skeletons}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : featured.isError ? (
          <ErrorState
            message={(featured.error as Error)?.message}
            onRetry={() => featured.refetch()}
          />
        ) : (featured.data?.length ?? 0) === 0 ? (
          <EmptyState icon="compass" title="No featured prompts yet" subtitle="Check back soon — the community is adding content." />
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Featured prompts</Text>
            {featured.data!.map((p) => (
              <DiscoverCard key={p.id} prompt={p} onSave={handleSave} />
            ))}
          </View>
        )}

        {(preview.data?.length ?? 0) > 0 ? (
          <View style={[styles.section, styles.upgradeSection]}>
            <View style={[styles.upgradeHeader, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
              <LinearGradient
                colors={gradients.tools as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.upgradeIconBox, { borderRadius: colors.radius + 2 }]}
              >
                <Feather name="star" size={18} color="#fff" />
              </LinearGradient>
              <View style={styles.upgradeText}>
                <Text style={[styles.upgradeTitle, { color: colors.foreground }]}>
                  Unlock the full library
                </Text>
                <Text style={[styles.upgradeSub, { color: colors.mutedForeground }]}>
                  Browse thousands of community prompts, create and share your own, and sync across devices.
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              More prompts in PromptAtrium
            </Text>
            <View style={styles.lockedGrid}>
              {preview.data!.map((p) => (
                <LockedCard key={p.id} prompt={p} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 120 },
  hero: {
    margin: 18,
    padding: 20,
    gap: 8,
  },
  heroTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  heroSub: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  section: { paddingHorizontal: 18, gap: 14 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  card: { borderWidth: 1, overflow: "hidden" },
  cover: { height: 110 },
  coverGradient: { ...StyleSheet.absoluteFillObject },
  cardBody: { padding: 14, gap: 7 },
  category: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 21 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  author: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1, marginRight: 8 },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7 },
  saveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  upgradeSection: { marginTop: 24 },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  upgradeIconBox: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  upgradeText: { flex: 1, gap: 4 },
  upgradeTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  upgradeSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  lockedGrid: { gap: 14 },
  lockedCard: { opacity: 0.55 },
  lockedBody: { opacity: 0.6 },
  blurredLine: { height: 10, borderRadius: 5, width: "100%" },
  skeletons: { padding: 18 },
});
