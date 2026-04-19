import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { TitleCard } from "../components/TitleCard";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { useLockPortrait } from "../hooks/useLockPortrait";

export function LibraryScreen() {
  useLockPortrait();
  const route = useRoute<RouteProp<Record<string, { type: string; title: string }>, string>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { type, title } = route.params;
  const query = useQuery({
    queryKey: ["library", type],
    queryFn: () => api.getLibrary(type),
  });

  if (query.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={query.data || []}
      keyExtractor={(item) => item.pathToDir}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <AppHeader title={title} subtitle={`Browse every ${title.toLowerCase()} entry available on this server.`} />
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title={`No ${title.toLowerCase()} found`}
          subtitle="This server has not scanned any matching titles yet."
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
  header: {
    marginBottom: 8,
  },
});
