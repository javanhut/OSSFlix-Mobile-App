import { useMemo } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { api, resolveAssetUrl } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "TitleDetails">;

function formatEpisodeLabel(videoSrc: string): string {
  const fileName = videoSrc.split("/").pop() || videoSrc;
  const match = fileName.match(/^(.*?)_s(\d+)_ep(\d+)\.[^.]+$/i);
  if (match) {
    return `S${match[2]} E${match[3]} - ${match[1].replace(/_/g, " ")}`;
  }
  return fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
}

export function TitleDetailsScreen({ route, navigation }: Props) {
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
        queryClient.invalidateQueries({ queryKey: ["watchlist-check", dirPath] }),
      ]);
    },
    onError: (error) => {
      Alert.alert("Unable to update My List", error instanceof Error ? error.message : "Request failed.");
    },
  });

  const playTarget = useMemo(() => {
    const details = detailsQuery.data;
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
  }, [detailsQuery.data, progressQuery.data]);

  if (detailsQuery.isLoading) {
      return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const details = detailsQuery.data;
  if (!details) {
    return null;
  }
  const imageUrl = resolveAssetUrl(details.bannerImage);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.poster} /> : <View style={styles.posterFallback} />}
      <Text style={styles.title}>{details.name}</Text>
      <Text style={styles.meta}>{details.type}</Text>
      <Text style={styles.description}>{details.description}</Text>
      {!!details.genre?.length ? (
        <View style={styles.chipRow}>
          {details.genre.map((genre) => (
            <View key={genre} style={styles.chip}>
              <Text style={styles.chipLabel}>{genre}</Text>
            </View>
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
      <Text style={styles.sectionTitle}>Episodes and Files</Text>
      {details.videos.length ? (
        details.videos.map((video, index) => (
          <Pressable
            key={video}
            onPress={() =>
              navigation.navigate("Player", {
                dirPath: details.dirPath,
                title: details.name,
                videos: details.videos,
                startIndex: index,
                initialTime: 0,
                subtitles: details.subtitles,
              })
            }
            style={styles.episodeRow}
          >
            <Text style={styles.episodeText}>{formatEpisodeLabel(video)}</Text>
            <Feather name="play" size={16} color={colors.accentText} />
          </Pressable>
        ))
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
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 14,
  },
  episodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  episodeText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
});
