import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { api, resolveAssetUrl } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { EpisodeRow } from "../components/EpisodeRow";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import {
  compareVideoSrc,
  formatEpisodeLabel,
  parseEpisodePath,
  titleFromStem,
  type ParsedEpisode,
} from "../utils/episodeNaming";
import { formatTitleType } from "../utils/titleType";
import { useLockPortrait } from "../hooks/useLockPortrait";

type Props = NativeStackScreenProps<RootStackParamList, "TitleDetails">;

type EpisodeEntry = {
  video: string;
  parsed: ParsedEpisode | null;
  label: string;
};

function toRelative(video: string, dirPath: string): string {
  if (!dirPath) return video;
  const prefix = dirPath.endsWith("/") ? dirPath : `${dirPath}/`;
  if (video.startsWith(prefix)) return video.slice(prefix.length);
  const idx = video.indexOf(dirPath);
  if (idx >= 0) return video.slice(idx + prefix.length);
  return video;
}

function buildEntry(video: string, dirPath: string): EpisodeEntry {
  const rel = toRelative(video, dirPath);
  const parsed = parseEpisodePath(rel);
  if (parsed) {
    return { video, parsed, label: formatEpisodeLabel(parsed) };
  }
  const fileName = video.split("/").pop() || video;
  const stem = fileName.replace(/\.[^/.]+$/, "");
  const fallback = titleFromStem(stem) || fileName;
  return { video, parsed: null, label: fallback };
}

export function TitleDetailsScreen({ route, navigation }: Props) {
  useLockPortrait();

  const queryClient = useQueryClient();
  const { dirPath } = route.params;
  const detailsQuery = useQuery({ queryKey: ["title-details", dirPath], queryFn: () => api.getTitleDetails(dirPath) });
  const watchlistQuery = useQuery({ queryKey: ["watchlist-check", dirPath], queryFn: () => api.watchlistCheck(dirPath) });
  const progressQuery = useQuery({ queryKey: ["progress-dir", dirPath], queryFn: () => api.getProgressForDir(dirPath) });

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (watchlistQuery.data?.inList) {
        return api.removeFromWatchlist(dirPath);
      }
      return api.addToWatchlist(dirPath);
    },
    onMutate: async () => {
      const checkKey = ["watchlist-check", dirPath];
      await queryClient.cancelQueries({ queryKey: checkKey });
      const previous = queryClient.getQueryData<{ inList: boolean }>(checkKey);
      queryClient.setQueryData(checkKey, { inList: !previous?.inList });
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["watchlist-check", dirPath], context.previous);
      }
      Alert.alert("Unable to update My List", error instanceof Error ? error.message : "Request failed.");
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
        queryClient.invalidateQueries({ queryKey: ["watchlist-check", dirPath] }),
      ]);
    },
  });

  const details = detailsQuery.data;

  const grouped = useMemo(() => {
    if (!details) return { bySeason: new Map<number, EpisodeEntry[]>(), other: [] as EpisodeEntry[] };
    const bySeason = new Map<number, EpisodeEntry[]>();
    const other: EpisodeEntry[] = [];
    const sorted = [...details.videos].sort(compareVideoSrc);
    for (const video of sorted) {
      const entry = buildEntry(video, details.dirPath);
      if (entry.parsed) {
        const list = bySeason.get(entry.parsed.season) ?? [];
        list.push(entry);
        bySeason.set(entry.parsed.season, list);
      } else {
        other.push(entry);
      }
    }
    return { bySeason, other };
  }, [details]);

  const seasonKeys = useMemo(
    () => [...grouped.bySeason.keys()].sort((a, b) => a - b),
    [grouped.bySeason],
  );

  const progressByVideo = useMemo(() => {
    const map = new Map<string, { current_time: number; duration: number }>();
    for (const entry of progressQuery.data || []) {
      map.set(entry.video_src, { current_time: entry.current_time, duration: entry.duration });
    }
    return map;
  }, [progressQuery.data]);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [seasonMenuOpen, setSeasonMenuOpen] = useState(false);

  const effectiveSeason = selectedSeason ?? seasonKeys[0] ?? null;
  const seasonMeta = useMemo(
    () => details?.seasonsMeta?.find((m) => m.season === effectiveSeason) ?? null,
    [details?.seasonsMeta, effectiveSeason],
  );

  const playTarget = useMemo(() => {
    if (!details?.videos?.length) return null;
    const progressEntries = progressQuery.data || [];
    const resumeEntry = progressEntries.find((entry) => entry.current_time > 0 && (entry.duration === 0 || entry.current_time < entry.duration - 5));
    if (resumeEntry) {
      const startIndex = details.videos.findIndex((video) => video === resumeEntry.video_src);
      return {
        startIndex: startIndex >= 0 ? startIndex : 0,
        initialTime: resumeEntry.current_time,
      };
    }
    return {
      startIndex: 0,
      initialTime: 0,
    };
  }, [details, progressQuery.data]);

  if (detailsQuery.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!details) {
    return null;
  }

  const bannerSrc = seasonMeta?.logo ?? details.bannerImage;
  const description = seasonMeta?.description ?? details.description;
  const imageUrl = resolveAssetUrl(bannerSrc);

  const visibleEntries = effectiveSeason != null
    ? grouped.bySeason.get(effectiveSeason) ?? []
    : grouped.other;

  const showDropdown = seasonKeys.length >= 2;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.poster} /> : <View style={styles.posterFallback} />}
      <Text style={styles.title}>{details.name}</Text>
      <Text style={styles.meta}>{formatTitleType(details.type)}</Text>
      <Text style={styles.description}>{description}</Text>
      {!!details.genre?.length ? (
        <View style={styles.chipRow}>
          {details.genre.map((genre) => (
            <Pressable
              key={genre}
              onPress={() => navigation.navigate("Genre", { genre })}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            >
              <Text style={styles.chipLabel}>{genre}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!!details.cast?.length ? <Text style={styles.cast}>Cast: {details.cast.join(", ")}</Text> : null}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() =>
            playTarget &&
            navigation.navigate("Player", {
              dirPath: details.dirPath,
              title: details.name,
              videos: details.videos,
              startIndex: playTarget.startIndex,
              initialTime: playTarget.initialTime,
              subtitles: details.subtitles,
            })
          }
          disabled={!playTarget}
          style={[styles.primaryButton, !playTarget && styles.primaryButtonDisabled]}
        >
          <View style={styles.buttonContent}>
            <Feather name={playTarget?.initialTime ? "play" : "play-circle"} size={18} color={colors.primaryText} />
            <Text style={styles.primaryLabel}>{playTarget?.initialTime ? "Resume" : "Play"}</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => toggleWatchlist.mutate()} style={styles.secondaryButton}>
          <View style={styles.buttonContent}>
            <Feather name="bookmark" size={18} color={colors.text} />
            <Text style={styles.secondaryLabel}>{watchlistQuery.data?.inList ? "Remove from My List" : "Add to My List"}</Text>
          </View>
        </Pressable>
      </View>

      {showDropdown ? (
        <View style={styles.seasonSection}>
          <Pressable
            onPress={() => setSeasonMenuOpen((open) => !open)}
            style={styles.seasonTrigger}
          >
            <Text style={styles.seasonTriggerLabel}>Season {effectiveSeason}</Text>
            <Feather
              name={seasonMenuOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.text}
            />
          </Pressable>
          {seasonMenuOpen ? (
            <View style={styles.menuSheet}>
              {seasonKeys.map((season) => {
                const active = season === effectiveSeason;
                return (
                  <Pressable
                    key={season}
                    onPress={() => {
                      setSelectedSeason(season);
                      setSeasonMenuOpen(false);
                    }}
                    style={[styles.menuItem, active && styles.menuItemActive]}
                  >
                    <Text style={styles.menuLabel}>Season {season}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {seasonKeys.length > 0 ? <Text style={styles.sectionTitle}>Episodes</Text> : null}
      {visibleEntries.length ? (
        visibleEntries.map((entry) => {
          const startIndex = details.videos.indexOf(entry.video);
          const progress = progressByVideo.get(entry.video) ?? null;
          return (
            <EpisodeRow
              key={entry.video}
              parsed={entry.parsed}
              fallbackLabel={entry.label}
              progress={progress}
              onPlay={() =>
                navigation.navigate("Player", {
                  dirPath: details.dirPath,
                  title: details.name,
                  videos: details.videos,
                  startIndex: startIndex >= 0 ? startIndex : 0,
                  initialTime: progress?.current_time ?? 0,
                  subtitles: details.subtitles,
                })
              }
              onRestart={() =>
                navigation.navigate("Player", {
                  dirPath: details.dirPath,
                  title: details.name,
                  videos: details.videos,
                  startIndex: startIndex >= 0 ? startIndex : 0,
                  initialTime: 0,
                  subtitles: details.subtitles,
                })
              }
            />
          );
        })
      ) : (
        <EmptyState title="No playable files found" subtitle="This title does not currently expose any videos from the server." />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  poster: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    marginBottom: 18,
  },
  posterFallback: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#070b16",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  meta: {
    color: colors.accentText,
    fontWeight: "700",
    marginTop: 8,
  },
  description: {
    color: colors.textSoft,
    marginTop: 16,
    lineHeight: 22,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceAccent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPressed: {
    backgroundColor: colors.border,
  },
  chipLabel: {
    color: colors.textSoft,
    fontWeight: "700",
    fontSize: 12,
  },
  cast: {
    color: colors.textMuted,
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
  },
  actionRow: {
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryLabel: {
    color: colors.primaryText,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAccent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  seasonSection: {
    marginTop: 24,
  },
  seasonTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAccent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seasonTriggerLabel: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  menuSheet: {
    marginTop: 8,
    backgroundColor: "rgba(10,15,28,0.96)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    gap: 4,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  menuItemActive: {
    backgroundColor: colors.surfaceAccent,
  },
  menuLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 14,
  },
});
