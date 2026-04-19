import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { resolveAssetUrl } from "../api/client";
import { colors } from "../theme/colors";
import type { TitleSummary } from "../types/api";
import { formatTitleType } from "../utils/titleType";

export function TitleCard({
  item,
  onPress,
  width = 148,
}: {
  item: TitleSummary;
  onPress: () => void;
  width?: number;
}) {
  const imageUrl = resolveAssetUrl(item.imagePath);
  const progress = typeof item.progressPct === "number" ? Math.max(0, Math.min(100, item.progressPct)) : 0;

  return (
    <Pressable onPress={onPress} style={[styles.card, { width }]}>
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderLabel}>{item.name}</Text>
          </View>
        )}
        {progress > 0 ? (
          <View style={styles.progressTrack} pointerEvents="none" testID="title-card-progress">
            <View style={[styles.progressFill, { width: `${progress}%` }]} testID="title-card-progress-fill" />
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.name}
      </Text>
      {!!item.type && (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{formatTitleType(item.type)}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    marginRight: 14,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    aspectRatio: 0.72,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  placeholder: {
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  placeholderLabel: {
    color: colors.textSoft,
    textAlign: "center",
    fontWeight: "700",
  },
  progressTrack: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  title: {
    marginTop: 10,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surfaceAccent,
  },
  badgeLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
});
