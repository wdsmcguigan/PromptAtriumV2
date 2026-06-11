import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.secondary,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primaryForeground : colors.secondaryForeground },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? (
        <Text style={[styles.dim, { color: colors.mutedForeground }]}>{label}</Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={28} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.dim, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Feather name="alert-triangle" size={28} color={colors.destructive} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        Something went wrong
      </Text>
      <Text style={[styles.dim, { color: colors.mutedForeground }]}>
        {message || "Could not load content. Check your connection."}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retry,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="refresh-ccw" size={16} color={colors.primaryForeground} />
          <Text style={[styles.retryText, { color: colors.primaryForeground }]}>
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SkeletonCard() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.skeleton,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.skelLine, { backgroundColor: colors.secondary, width: "55%" }]} />
      <View style={[styles.skelLine, { backgroundColor: colors.muted, width: "90%" }]} />
      <View style={[styles.skelLine, { backgroundColor: colors.muted, width: "75%" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    paddingHorizontal: 32,
    gap: 10,
  },
  dim: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 20 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  retryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  skeleton: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  skelLine: { height: 12, borderRadius: 6 },
});
