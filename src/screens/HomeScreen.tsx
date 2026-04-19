import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { FeaturedCarousel } from "../components/FeaturedCarousel";
import { TitleRail } from "../components/TitleRail";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../state/session";
import { colors } from "../theme/colors";
import { useLockPortrait } from "../hooks/useLockPortrait";
import type { TitleSummary } from "../types/api";

const BASIC_GENRES = new Set([
  "Newly Added",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Thriller",
  "Family",
  "Science Fiction",
  "Mystery",
  "Documentary",
]);

const FEATURED_LIMIT = 6;

export function HomeScreen() {
  useLockPortrait();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const profile = useSessionStore((state) => state.profile);
  const clearAuth = useSessionStore((state) => state.clearAuth);
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: api.getCategories });
  const continueWatchingQuery = useQuery({ queryKey: ["continue-watching"], queryFn: api.getContinueWatching });
  const watchlistQuery = useQuery({ queryKey: ["watchlist"], queryFn: api.getWatchlist });
  const [signOutOpen, setSignOutOpen] = useState(false);

  const handleLogout = async () => {
    setSignOutOpen(false);
    try {
      await api.mobileLogout();
    } catch {
      // Best-effort revoke; local logout still matters.
    }
    clearAuth();
    queryClient.clear();
  };

  const loading = categoriesQuery.isLoading || continueWatchingQuery.isLoading || watchlistQuery.isLoading;
  const refreshing = categoriesQuery.isRefetching || continueWatchingQuery.isRefetching || watchlistQuery.isRefetching;
  const handleRefresh = () => {
    void Promise.all([categoriesQuery.refetch(), continueWatchingQuery.refetch(), watchlistQuery.refetch()]);
  };
  const allCategoryRows = categoriesQuery.data || [];
  const categoryRows = allCategoryRows.filter((row) => BASIC_GENRES.has(row.genre));

  const featured = (() => {
    const newlyAdded = allCategoryRows.find((row) => row.genre === "Newly Added");
    const source: TitleSummary[] = newlyAdded ? newlyAdded.titles : allCategoryRows.flatMap((row) => row.titles);
    const seen = new Set<string>();
    const picked: TitleSummary[] = [];
    for (const t of source) {
      if (!t.imagePath) continue;
      if (seen.has(t.pathToDir)) continue;
      seen.add(t.pathToDir);
      picked.push(t);
      if (picked.length >= FEATURED_LIMIT) break;
    }
    return picked;
  })();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.brand}>Reelscape</Text>
        <AppHeader title={`Welcome back${profile?.name ? `, ${profile.name}` : ""}`} />
        {featured.length ? (
          <FeaturedCarousel
            items={featured}
            onSelect={(item) => navigation.navigate("TitleDetails", { dirPath: item.pathToDir })}
          />
        ) : null}
        <TitleRail
          title="Continue Watching"
          items={continueWatchingQuery.data?.titles || []}
          onSelect={(item) => navigation.navigate("TitleDetails", { dirPath: item.pathToDir })}
        />
        <TitleRail
          title="My List"
          items={watchlistQuery.data?.titles || []}
          onSelect={(item) => navigation.navigate("TitleDetails", { dirPath: item.pathToDir })}
        />
        {!categoryRows.length && !allCategoryRows.length ? (
          <EmptyState
            title="No library data yet"
            subtitle="Once the server has scanned media, your categories will appear here."
          />
        ) : null}
        {categoryRows.map((row) => (
          <TitleRail
            key={row.genre}
            title={row.genre}
            items={row.titles}
            onSelect={(item) => navigation.navigate("TitleDetails", { dirPath: item.pathToDir })}
          />
        ))}
        <Pressable
          style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
          onPress={() => setSignOutOpen(true)}
        >
          <Feather name="log-out" size={16} color={colors.text} />
          <Text style={styles.signOutLabel}>Sign Out</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={signOutOpen} transparent animationType="fade" onRequestClose={() => setSignOutOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSignOutOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalBody}>
              This ends your mobile session on this device. You'll need to sign in again to stream.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalCancel, pressed && styles.modalCancelPressed]}
                onPress={() => setSignOutOpen(false)}
              >
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalConfirm, pressed && styles.modalConfirmPressed]}
                onPress={() => void handleLogout()}
              >
                <Feather name="log-out" size={16} color={colors.primaryText} />
                <Text style={styles.modalConfirmLabel}>Sign Out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#070b16",
  },
  content: {
    padding: 18,
    paddingBottom: 48,
  },
  brand: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  signOut: {
    marginTop: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  signOutPressed: {
    backgroundColor: colors.surfaceAccent,
  },
  signOutLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3,6,14,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0b1220",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 22,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  modalBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  modalActions: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAccent,
  },
  modalCancelPressed: {
    backgroundColor: colors.border,
  },
  modalCancelLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  modalConfirm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  modalConfirmPressed: {
    backgroundColor: colors.primaryPressed,
  },
  modalConfirmLabel: {
    color: colors.primaryText,
    fontWeight: "800",
    fontSize: 14,
  },
});
