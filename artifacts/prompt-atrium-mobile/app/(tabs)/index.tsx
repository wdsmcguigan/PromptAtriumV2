import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Header } from "@/components/Header";
import { PromptCard } from "@/components/PromptCard";
import { ErrorState, SkeletonCard } from "@/components/ui";
import { gradients } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { usePrompts, type Prompt } from "@/lib/api";

function SectionTitle({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          <Feather name="chevron-right" size={15} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function HRow({ data }: { data: Prompt[] }) {
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PromptCard prompt={item} compact />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.hList}
      ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
    />
  );
}

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();

  const trending = usePrompts({ sortBy: "trending", limit: 10 });
  const featured = usePrompts({ isFeatured: true, sortBy: "featured", limit: 8 });
  const recent = usePrompts({ sortBy: "recent", limit: 8 });

  const refreshing =
    trending.isRefetching || featured.isRefetching || recent.isRefetching;

  const onRefresh = useCallback(() => {
    trending.refetch();
    featured.refetch();
    recent.refetch();
  }, [trending, featured, recent]);

  const loading = trending.isLoading && recent.isLoading;
  const errored = trending.isError && recent.isError;
  const featuredList = (featured.data || []).filter((p) => p.isFeatured);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="PromptAtrium" subtitle="Discover community AI prompts" brand />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Hero */}
        <LinearGradient
          colors={gradients.library as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderRadius: colors.radius + 6 }]}
        >
          <Feather name="layers" size={22} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>A library for AI prompts</Text>
          <Text style={styles.heroSub}>
            Explore, copy, and save the community&apos;s best prompts for images, writing, and more.
          </Text>
          <Pressable
            onPress={() => router.push("/browse")}
            style={({ pressed }) => [styles.heroBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Feather name="search" size={16} color="#0b1220" />
            <Text style={styles.heroBtnText}>Browse the library</Text>
          </Pressable>
        </LinearGradient>

        {errored ? (
          <ErrorState message={(trending.error as Error)?.message} onRetry={onRefresh} />
        ) : loading ? (
          <View style={styles.skeletons}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <>
            {(trending.data?.length ?? 0) > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="Trending now" onSeeAll={() => router.push("/browse")} />
                <HRow data={trending.data!} />
              </View>
            ) : null}

            {featuredList.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="Featured" />
                <HRow data={featuredList} />
              </View>
            ) : null}

            {(recent.data?.length ?? 0) > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="Recently added" onSeeAll={() => router.push("/browse")} />
                <View style={styles.vList}>
                  {recent.data!.map((p) => (
                    <PromptCard key={p.id} prompt={p} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 120 },
  hero: {
    margin: 18,
    padding: 22,
    gap: 8,
    overflow: "hidden",
  },
  heroTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  heroSub: { color: "rgba(255,255,255,0.92)", fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 8,
  },
  heroBtnText: { color: "#0b1220", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: { marginTop: 6, marginBottom: 8 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  hList: { paddingHorizontal: 18 },
  vList: { paddingHorizontal: 18 },
  skeletons: { padding: 18 },
});
