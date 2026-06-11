import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import AspectRatioCalculator from "@/components/AspectRatioCalculator";
import { useColors } from "@/hooks/useColors";

export default function AspectRatioScreen() {
  const colors = useColors();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.lead, { color: colors.mutedForeground }]}>
        Pick a ratio and target resolution to get exact pixel dimensions for your image generations.
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 },
        ]}
      >
        <AspectRatioCalculator />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 16, paddingBottom: 48 },
  lead: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  card: { borderWidth: 1, padding: 18 },
});
