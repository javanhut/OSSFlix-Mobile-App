import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { TitleCard } from "../components/TitleCard";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { useLockPortrait } from "../hooks/useLockPortrait";

export function WatchlistScreen() {
  useLockPortrait();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useQuery({ queryKey: ["watchlist"], queryFn: api.getWatchlist });

  if (query.isLoading) {
      return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={query.data?.titles || []}
      keyExtractor={(item) => item.pathToDir}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<AppHeader title="My List" subtitle="Titles you have explicitly saved for quick access." />}
      ListEmptyComponent={<EmptyState title="Your list is empty" subtitle="Add titles from any details screen to keep them here." />}
      renderItem={({ item }) => <TitleCard item={item} width={160} onPress={() => navigation.navigate("TitleDetails", { dirPath: item.pathToDir })} />}
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
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 18,
  },
});
