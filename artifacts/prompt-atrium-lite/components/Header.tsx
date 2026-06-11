import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const MARK = require("@/assets/images/brand/atrium-square.png");

export function Header({
  title,
  subtitle,
  brand,
  right,
}: {
  title: string;
  subtitle?: string;
  brand?: boolean;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, 12) + 8,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {brand ? <Image source={MARK} style={styles.mark} contentFit="cover" /> : null}
          <View style={styles.titles}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {right ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  left: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1 },
  mark: { width: 34, height: 34, borderRadius: 9 },
  titles: { flexShrink: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
});
