import { useRef, useState } from "react";
import {
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../theme/colors";
import type { TitleSummary } from "../types/api";
import { TitleCard } from "./TitleCard";

const FADE_WIDTH = 28;
const EDGE_EPSILON = 1;

export function TitleRail({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: TitleSummary[];
  onSelect: (item: TitleSummary) => void;
}) {
  const [scrollX, setScrollX] = useState(0);
  const contentWidthRef = useRef(0);
  const layoutWidthRef = useRef(0);
  const [atEnd, setAtEnd] = useState(false);

  if (!items.length) return null;

  const recomputeEnd = () => {
    const max = contentWidthRef.current - layoutWidthRef.current;
    setAtEnd(max <= EDGE_EPSILON || scrollX >= max - EDGE_EPSILON);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    setScrollX(x);
    const max = contentWidthRef.current - layoutWidthRef.current;
    setAtEnd(max <= EDGE_EPSILON || x >= max - EDGE_EPSILON);
  };

  const handleContentSizeChange = (w: number) => {
    contentWidthRef.current = w;
    recomputeEnd();
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    layoutWidthRef.current = event.nativeEvent.layout.width;
    recomputeEnd();
  };

  const showLeftFade = scrollX > EDGE_EPSILON;
  const showRightFade = !atEnd;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingAccent} />
        <Text style={styles.heading}>{title.toUpperCase()}</Text>
      </View>
      <View style={styles.railWrapper} onLayout={handleLayout}>
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => item.pathToDir}
          renderItem={({ item }) => <TitleCard item={item} onPress={() => onSelect(item)} />}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
        />
        {showLeftFade ? (
          <LinearGradient
            pointerEvents="none"
            colors={[colors.background, "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fade, styles.fadeLeft]}
          />
        ) : null}
        {showRightFade ? (
          <LinearGradient
            pointerEvents="none"
            colors={["transparent", colors.background]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fade, styles.fadeRight]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  headingAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  heading: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  railWrapper: {
    position: "relative",
  },
  fade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
  },
});
