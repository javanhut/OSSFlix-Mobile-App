import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { TitleCard } from "../components/TitleCard";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { useAllowRotation } from "../hooks/useAllowRotation";

export function RecommendationsScreen() {
  useAllowRotation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useQuery({ queryKey: ["categories"], queryFn: api.getCategories });

  if (query.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const newlyAdded = (query.data || []).find((row) => row.genre === "Newly Added");
  const titles = newlyAdded?.titles || [];

  return (
    <FlatList
      data={titles}
      keyExtractor={(item) => item.pathToDir}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <AppHeader title="Recommendations" subtitle="Fresh picks based on what's new on this server." />
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="Nothing to recommend yet"
          subtitle="As new titles are added, they'll show up here."
        />
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
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 18,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 6,
  },
  row: {
    gap: 14,
    marginBottom: 18,
  },
});
