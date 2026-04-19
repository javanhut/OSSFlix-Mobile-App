import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import type { ParsedEpisode } from "../utils/episodeNaming";

export type EpisodeRowProgress = {
  current_time: number;
  duration: number;
};

function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${m}:${ss}`;
}

export function EpisodeRow({
  parsed,
  fallbackLabel,
  progress,
  onPlay,
  onRestart,
}: {
  parsed: ParsedEpisode | null;
  fallbackLabel: string;
  progress?: EpisodeRowProgress | null;
  onPlay: () => void;
  onRestart?: () => void;
}) {
  const isInProgress =
    !!progress &&
    progress.current_time > 0 &&
    (progress.duration === 0 || progress.current_time < progress.duration - 5);
  const isWatched = !!progress && progress.duration > 0 && progress.current_time >= progress.duration - 5;
  const pct = progress && progress.duration > 0 ? Math.min(100, (progress.current_time / progress.duration) * 100) : 0;

  const badgeText = parsed ? `Episode ${parsed.episode}` : "Movie";
  const titleText = parsed ? parsed.title || `Episode ${parsed.episode}` : fallbackLabel;

  let metaText: string | null = null;
  if (progress && progress.duration > 0) {
    if (isInProgress) {
      metaText = `${formatTime(progress.current_time)} / ${formatTime(progress.duration)}`;
    } else {
      metaText = formatTime(progress.duration);
    }
  }

  return (
    <View style={[styles.container, isWatched && styles.containerWatched]}>
      <Pressable
        onPress={onPlay}
        style={({ pressed }) => [styles.main, pressed && styles.mainPressed]}
        accessibilityRole="button"
        accessibilityLabel={parsed ? `Play Episode ${parsed.episode}` : `Play ${titleText}`}
      >
        <View style={[styles.badge, isInProgress && styles.badgeInProgress, isWatched && styles.badgeWatched]}>
          <Text style={styles.badgeLabel} numberOfLines={1}>
            {badgeText}
          </Text>
          {isWatched ? <Feather name="check" size={12} color={colors.primaryText} style={styles.badgeCheck} /> : null}
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, isWatched && styles.titleWatched]} numberOfLines={2}>
            {titleText}
          </Text>
          {metaText ? <Text style={styles.meta}>{metaText}</Text> : null}
        </View>
        <Feather name="play" size={16} color={colors.accentText} style={styles.playIcon} />
      </Pressable>
      {isInProgress && onRestart ? (
        <Pressable
          onPress={onRestart}
          style={({ pressed }) => [styles.restart, pressed && styles.restartPressed]}
          accessibilityRole="button"
          accessibilityLabel="Play from beginning"
        >
          <Feather name="rotate-ccw" size={14} color={colors.text} />
        </Pressable>
      ) : null}
      {pct > 0 ? (
        <View style={styles.progressTrack} pointerEvents="none">
          <View style={[styles.progressFill, { width: `${pct}%` }, isWatched && styles.progressFillComplete]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  containerWatched: {
    opacity: 0.72,
  },
  main: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  mainPressed: {
    backgroundColor: colors.surfaceAccent,
  },
  badge: {
    minWidth: 80,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceAccent,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  badgeInProgress: {
    backgroundColor: "rgba(37,99,235,0.25)",
    borderColor: colors.primary,
  },
  badgeWatched: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: "rgba(34,197,94,0.55)",
  },
  badgeLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  badgeCheck: {
    marginLeft: 4,
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  titleWatched: {
    color: colors.textMuted,
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  playIcon: {
    marginLeft: 4,
  },
  restart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(10,15,28,0.9)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  restartPressed: {
    backgroundColor: colors.surfaceAccent,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressFillComplete: {
    backgroundColor: "rgba(34,197,94,0.85)",
  },
});
