import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { TitleRail } from "../components/TitleRail";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../state/session";
import { colors } from "../theme/colors";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const profile = useSessionStore((state) => state.profile);
  const clearAuth = useSessionStore((state) => state.clearAuth);
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: api.getCategories });
  const continueWatchingQuery = useQuery({ queryKey: ["continue-watching"], queryFn: api.getContinueWatching });
  const watchlistQuery = useQuery({ queryKey: ["watchlist"], queryFn: api.getWatchlist });

  const handleLogout = async () => {
    try {
      await api.mobileLogout();
    } catch {
      // Best-effort revoke; local logout still matters.
    }
    clearAuth();
    queryClient.clear();
  };

  const loading = categoriesQuery.isLoading || continueWatchingQuery.isLoading || watchlistQuery.isLoading;
  const categoryRows = categoriesQuery.data || [];
  const highlighted = categoryRows[0]?.titles?.[0];

  if (loading) {
      return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppHeader
        eyebrow="Reelscape Mobile"
        title={`Welcome back${profile?.name ? `, ${profile.name}` : ""}`}
        subtitle="Jump back into your library, pick up where you left off, or browse the full catalog."
        actionLabel="Sign Out"
        onAction={() =>
          Alert.alert("Sign out", "End this mobile session on the device?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: () => void handleLogout() },
          ])
        }
      />
      {highlighted ? (
        <Pressable style={styles.heroCard} onPress={() => navigation.navigate("TitleDetails", { dirPath: highlighted.pathToDir })}>
          <Text style={styles.heroEyebrow}>Featured</Text>
          <Text style={styles.heroTitle}>{highlighted.name}</Text>
          <Text style={styles.heroSubtitle}>Open details and start streaming on device.</Text>
          <View style={styles.heroAction}>
            <Feather name="play-circle" size={18} color={colors.primaryText} />
            <Text style={styles.heroActionLabel}>Open Title</Text>
          </View>
        </Pressable>
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
      {!categoryRows.length ? (
        <EmptyState title="No library data yet" subtitle="Once the server has scanned media, your categories will appear here." />
      ) : null}
      {categoryRows.map((row) => (
        <TitleRail
          key={row.genre}
          title={row.genre}
          items={row.titles}
          onSelect={(item) => navigation.navigate("TitleDetails", { dirPath: item.pathToDir })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#070b16",
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  heroCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.surfaceAccent,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: 24,
  },
  heroEyebrow: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 32,
    marginTop: 10,
  },
  heroSubtitle: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  heroAction: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroActionLabel: {
    color: colors.primaryText,
    fontWeight: "800",
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
