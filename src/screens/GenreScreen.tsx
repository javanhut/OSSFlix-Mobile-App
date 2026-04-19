import { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { TitleCard } from "../components/TitleCard";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { useLockPortrait } from "../hooks/useLockPortrait";

const ANIME_ALIASES = new Set(["anime", "animation"]);

export function GenreScreen() {
  useLockPortrait();
  const route = useRoute<RouteProp<RootStackParamList, "Genre">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { genre } = route.params;
  const query = useQuery({ queryKey: ["categories"], queryFn: api.getCategories });

  const row = useMemo(() => {
    const rows = query.data || [];
    const needle = genre.toLowerCase();
    const direct = rows.find((r) => r.genre.toLowerCase() === needle);
    if (direct) return direct;
    if (ANIME_ALIASES.has(needle)) {
      return rows.find((r) => r.genre.toLowerCase() === "anime") ?? null;
    }
    return null;
  }, [query.data, genre]);

  if (query.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={row?.titles || []}
      keyExtractor={(item) => item.pathToDir}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppHeader
            eyebrow="Genre"
            title={row?.genre || genre}
            subtitle={row ? `Browse every title in ${row.genre}.` : `No titles tagged "${genre}" yet.`}
          />
        </View>
      }
      ListEmptyComponent={
        <EmptyState title={`No ${genre} titles`} subtitle="Nothing in this genre is indexed on this server." />
      }
      renderItem={({ item }) => (
        <TitleCard
          item={item}
          width={160}
          onPress={() => navigation.navigate("TitleDetails", { dirPath: item.pathToDir })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  list: {
    padding: 18,
    backgroundColor: colors.background,
    paddingBottom: 32,
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 18,
  },
  header: {
    marginBottom: 8,
  },
});
