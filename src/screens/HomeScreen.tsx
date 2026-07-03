import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { FeaturedCarousel } from "../components/FeaturedCarousel";
import { TitleRail } from "../components/TitleRail";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../state/session";
import { colors } from "../theme/colors";
import { useAllowRotation } from "../hooks/useAllowRotation";
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
  useAllowRotation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profile = useSessionStore((state) => state.profile);
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
  });
  const continueWatchingQuery = useQuery({
    queryKey: ["continue-watching"],
    queryFn: api.getContinueWatching,
  });
  const watchlistQuery = useQuery({
    queryKey: ["watchlist"],
    queryFn: api.getWatchlist,
  });

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.brand}>Reelscape</Text>
      {!isLandscape ? <AppHeader title={`Welcome back${profile?.name ? `, ${profile.name}` : ""}`} /> : null}
      {featured.length && !isLandscape ? (
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
});
