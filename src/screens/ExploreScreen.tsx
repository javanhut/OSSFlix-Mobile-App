import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { useAllowRotation } from "../hooks/useAllowRotation";

export function ExploreScreen() {
  useAllowRotation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
  });

  if (query.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const rows = (query.data || []).filter((r) => r.titles.length > 0);

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.genre}
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
          <AppHeader title="Explore" subtitle="Browse every category on this server." />
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No categories yet"
          subtitle="Once the server has scanned media, categories will appear here."
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate("Genre", { genre: item.genre })}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
        >
          <View style={styles.tileAccent} />
          <Text style={styles.tileTitle} numberOfLines={2}>
            {item.genre}
          </Text>
          <View style={styles.tileFooter}>
            <Text style={styles.tileCount}>{item.titles.length} titles</Text>
            <Feather name="arrow-right" size={16} color={colors.textSoft} />
          </View>
        </Pressable>
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
    marginBottom: 14,
  },
  tile: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    justifyContent: "space-between",
  },
  tilePressed: {
    backgroundColor: colors.surfaceAccent,
  },
  tileAccent: {
    width: 30,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginBottom: 10,
  },
  tileTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  tileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  tileCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
});
