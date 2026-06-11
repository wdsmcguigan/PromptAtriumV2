import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const STANDARD_RATIOS = [
  { ratio: "1:1", description: "Social media profiles and posts", w: 1, h: 1 },
  { ratio: "3:2", description: "Classic photography and print", w: 3, h: 2 },
  { ratio: "4:3", description: "Standard TV and monitors", w: 4, h: 3 },
  { ratio: "4:5", description: "Instagram feed posts", w: 4, h: 5 },
  { ratio: "16:9", description: "Widescreen HD video", w: 16, h: 9 },
  { ratio: "16:10", description: "Modern display ratio", w: 16, h: 10 },
  { ratio: "21:9", description: "Ultrawide cinema", w: 21, h: 9 },
  { ratio: "2.35:1", description: "Cinemascope", w: 2.35, h: 1 },
  { ratio: "2.39:1", description: "Anamorphic widescreen", w: 2.39, h: 1 },
  { ratio: "2:3", description: "Portrait vertical", w: 2, h: 3 },
  { ratio: "3:4", description: "Portrait vertical", w: 3, h: 4 },
  { ratio: "9:16", description: "Mobile vertical / stories", w: 9, h: 16 },
  { ratio: "1.91:1", description: "Social media horizontal", w: 1.91, h: 1 },
];

const MIN_MP = 0.1;
const MAX_MP = 16;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplifyRatio(w: number, h: number): [number, number] {
  const d = gcd(Math.round(w), Math.round(h)) || 1;
  return [w / d, h / d];
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function AspectRatioCalculator() {
  const colors = useColors();

  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [megapixels, setMegapixels] = useState(1.1);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [aspect, setAspect] = useState<[number, number]>([1, 1]);
  const [ratioDisplay, setRatioDisplay] = useState("1:1");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trackW, setTrackW] = useState(0);

  const totalPixels = width * height;
  const fileSize = ((totalPixels * 4) / (1024 * 1024)).toFixed(1);

  function findMatchingRatio(w: number, h: number): string | null {
    if (!w || !h) return null;
    const [simpW, simpH] = simplifyRatio(w, h);
    for (const r of STANDARD_RATIOS) {
      if (r.ratio.includes(":") && !r.ratio.includes(".")) {
        if (Math.abs(simpW - r.w) < 0.01 && Math.abs(simpH - r.h) < 0.01) return r.ratio;
      } else {
        if (Math.abs(w / h - r.w / r.h) < 0.01) return r.ratio;
      }
    }
    return null;
  }

  function onWidthChange(text: string) {
    const newWidth = parseInt(text, 10) || 0;
    setWidth(newWidth);
    if (aspectLocked && newWidth > 0) {
      const [wr, hr] = aspect;
      setHeight(Math.round((newWidth / wr) * hr));
    } else if (newWidth > 0 && height > 0) {
      setAspect(simplifyRatio(newWidth, height));
      setRatioDisplay(findMatchingRatio(newWidth, height) || `${(newWidth / height).toFixed(3)}:1`);
    }
  }

  function onHeightChange(text: string) {
    const newHeight = parseInt(text, 10) || 0;
    setHeight(newHeight);
    if (aspectLocked && newHeight > 0) {
      const [wr, hr] = aspect;
      setWidth(Math.round((newHeight / hr) * wr));
    } else if (width > 0 && newHeight > 0) {
      setAspect(simplifyRatio(width, newHeight));
      setRatioDisplay(findMatchingRatio(width, newHeight) || `${(width / newHeight).toFixed(3)}:1`);
    }
  }

  function applyMegapixels(mp: number) {
    const clamped = Math.max(MIN_MP, Math.min(MAX_MP, mp));
    setMegapixels(parseFloat(clamped.toFixed(1)));
    const pixelCount = clamped * 1_000_000;
    const [wr, hr] = aspect;
    const scale = Math.sqrt(pixelCount / (wr * hr));
    setWidth(Math.round(wr * scale));
    setHeight(Math.round(hr * scale));
  }

  function selectRatio(r: (typeof STANDARD_RATIOS)[number]) {
    setAspect([r.w, r.h]);
    setRatioDisplay(r.ratio);
    setAspectLocked(true);
    const pixelCount = megapixels * 1_000_000;
    const scale = Math.sqrt(pixelCount / (r.w * r.h));
    setWidth(Math.round(r.w * scale));
    setHeight(Math.round(r.h * scale));
    setPickerOpen(false);
    Haptics.selectionAsync();
  }

  function swap() {
    setWidth(height);
    setHeight(width);
    if (aspectLocked) {
      setAspect([aspect[1], aspect[0]]);
      if (ratioDisplay.includes(":")) {
        const [a, b] = ratioDisplay.split(":");
        setRatioDisplay(`${b}:${a}`);
      }
    } else {
      setRatioDisplay(findMatchingRatio(height, width) || `${(height / width).toFixed(3)}:1`);
    }
    Haptics.selectionAsync();
  }

  async function copy() {
    await Clipboard.setStringAsync(`${width}×${height}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function reset() {
    setWidth(1024);
    setHeight(1024);
    setMegapixels(1.1);
    setAspect([1, 1]);
    setRatioDisplay("1:1");
    setAspectLocked(true);
    Haptics.selectionAsync();
  }

  function onTrackTouch(e: GestureResponderEvent) {
    if (trackW <= 0) return;
    const x = Math.max(0, Math.min(trackW, e.nativeEvent.locationX));
    applyMegapixels(MIN_MP + (x / trackW) * (MAX_MP - MIN_MP));
  }

  const pct = (megapixels - MIN_MP) / (MAX_MP - MIN_MP);
  const r = colors.radius;

  return (
    <View style={styles.wrap}>
      {/* Ratio selector + lock */}
      <View style={styles.rowBetween}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Ratio</Text>
        <Pressable onPress={() => setAspectLocked((v) => !v)} hitSlop={10}>
          <Feather
            name={aspectLocked ? "lock" : "unlock"}
            size={18}
            color={aspectLocked ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
      </View>

      <View style={styles.ratioRow}>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.ratioBtn,
            { backgroundColor: colors.input, borderColor: colors.border, borderRadius: r, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.ratioText, { color: colors.foreground }]}>{ratioDisplay}</Text>
          <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Dimensions */}
      <View style={styles.dimsRow}>
        <View style={styles.flex1}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Width (px)</Text>
          <TextInput
            value={String(width)}
            onChangeText={onWidthChange}
            keyboardType="number-pad"
            style={[
              styles.input,
              { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground, borderRadius: r },
            ]}
          />
        </View>
        <Pressable onPress={swap} hitSlop={8} style={styles.swapBtn}>
          <Feather name="repeat" size={18} color={colors.mutedForeground} />
        </Pressable>
        <View style={styles.flex1}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Height (px)</Text>
          <TextInput
            value={String(height)}
            onChangeText={onHeightChange}
            keyboardType="number-pad"
            style={[
              styles.input,
              { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground, borderRadius: r },
            ]}
          />
        </View>
      </View>

      {/* Megapixels slider */}
      <View style={styles.mpHeader}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Megapixels</Text>
        <Text style={[styles.mpValue, { color: colors.foreground }]}>{megapixels.toFixed(1)} MP</Text>
      </View>
      <View
        style={styles.trackHit}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onTrackTouch}
        onResponderMove={onTrackTouch}
      >
        <View style={[styles.track, { backgroundColor: colors.secondary }]}>
          <View
            style={[styles.trackFill, { backgroundColor: colors.primary, width: `${pct * 100}%` }]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            { backgroundColor: colors.primary, borderColor: colors.background, left: `${pct * 100}%` },
          ]}
        />
      </View>
      <View style={styles.mpScale}>
        <Text style={[styles.scaleText, { color: colors.mutedForeground }]}>0.1MP</Text>
        <Text style={[styles.scaleText, { color: colors.mutedForeground }]}>1.1MP</Text>
        <Text style={[styles.scaleText, { color: colors.mutedForeground }]}>16MP</Text>
      </View>

      {/* Results */}
      <View style={[styles.results, { borderTopColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.resLabel, { color: colors.mutedForeground }]}>Total pixels</Text>
          <Text style={[styles.resValue, { color: colors.foreground }]}>{formatNumber(totalPixels)} px</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={[styles.resLabel, { color: colors.mutedForeground }]}>File size (approx)</Text>
          <Text style={[styles.resValue, { color: colors.foreground }]}>{fileSize} MB</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={reset}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.secondary, borderRadius: r, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="rotate-ccw" size={16} color={colors.foreground} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Reset</Text>
        </Pressable>
        <Pressable
          onPress={copy}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.primary, borderRadius: r, opacity: pressed ? 0.85 : 1, flex: 1.4 },
          ]}
        >
          <Feather name={copied ? "check" : "copy"} size={16} color={colors.primaryForeground} />
          <Text style={[styles.actionText, { color: colors.primaryForeground }]}>
            {copied ? "Copied" : "Copy dimensions"}
          </Text>
        </Pressable>
      </View>

      {/* Ratio picker modal */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandleRow}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select ratio</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={10}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {STANDARD_RATIOS.map((item) => {
                const active = item.ratio === ratioDisplay;
                return (
                  <Pressable
                    key={item.ratio}
                    onPress={() => selectRatio(item)}
                    style={({ pressed }) => [
                      styles.ratioItem,
                      { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View style={styles.flex1}>
                      <Text style={[styles.ratioItemTitle, { color: active ? colors.primary : colors.foreground }]}>
                        {item.ratio}
                      </Text>
                      <Text style={[styles.ratioItemDesc, { color: colors.mutedForeground }]}>
                        {item.description}
                      </Text>
                    </View>
                    {active ? <Feather name="check" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ratioRow: { flexDirection: "row" },
  ratioBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
  },
  ratioText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dimsRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  flex1: { flex: 1, gap: 6 },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_500Medium" },
  swapBtn: { paddingBottom: 11, paddingHorizontal: 2 },
  mpHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  mpValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  trackHit: { height: 32, justifyContent: "center" },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  trackFill: { height: 6, borderRadius: 3 },
  thumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    marginLeft: -10,
  },
  mpScale: { flexDirection: "row", justifyContent: "space-between" },
  scaleText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  results: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  resLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  resValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  actionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "web" ? 24 : 36,
  },
  modalHandleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  ratioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ratioItemTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  ratioItemDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
