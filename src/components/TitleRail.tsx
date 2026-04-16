import { FlatList, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import type { TitleSummary } from "../types/api";
import { TitleCard } from "./TitleCard";

export function TitleRail({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: TitleSummary[];
  onSelect: (item: TitleSummary) => void;
}) {
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.pathToDir}
        renderItem={({ item }) => <TitleCard item={item} onPress={() => onSelect(item)} />}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
});
