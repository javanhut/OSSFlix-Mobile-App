import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { resolveAssetUrl } from "../api/client";
import { colors } from "../theme/colors";
import type { TitleSummary } from "../types/api";

const AUTO_ADVANCE_MS = 6000;

export function FeaturedCarousel({
  items,
  onSelect,
}: {
  items: TitleSummary[];
  onSelect: (item: TitleSummary) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const listRef = useRef<FlatList<TitleSummary>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (items.length <= 1 || slideWidth === 0) {
      clearTimer();
      return;
    }
    clearTimer();
    timerRef.current = setTimeout(() => {
      const next = (activeIndex + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * slideWidth, animated: true });
      setActiveIndex(next);
    }, AUTO_ADVANCE_MS);
    return clearTimer;
  }, [activeIndex, items.length, slideWidth, clearTimer]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w !== slideWidth) setSlideWidth(w);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth === 0) return;
    const idx = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== activeIndex) setActiveIndex(clamped);
  };

  if (!items.length) return null;

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.pathToDir}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        renderItem={({ item }) => {
          const imageUrl = resolveAssetUrl(item.imagePath);
          return (
            <Pressable onPress={() => onSelect(item)} style={[styles.slide, { width: slideWidth }]}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.imageFallback]} />
              )}
              <LinearGradient
                pointerEvents="none"
                colors={["transparent", "rgba(7,11,22,0.92)"]}
                style={styles.overlay}
              />
              <View style={styles.content}>
                <View style={styles.eyebrowBadge}>
                  <Text style={styles.eyebrow}>Newly Added</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.action}>
                  <Feather name="play-circle" size={16} color={colors.primaryText} />
                  <Text style={styles.actionLabel}>Open Title</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item, idx) => (
            <View key={item.pathToDir} style={[styles.dot, idx === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  slide: {
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surfaceElevated,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    backgroundColor: colors.surfaceElevated,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
  },
  content: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  eyebrowBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(7,11,22,0.7)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  eyebrow: {
    color: colors.accentText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
    lineHeight: 26,
  },
  action: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionLabel: {
    color: colors.primaryText,
    fontWeight: "800",
    fontSize: 13,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
});
