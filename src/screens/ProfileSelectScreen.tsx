import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { resolveAssetUrl } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../state/session";
import { colors } from "../theme/colors";
import type { PublicProfile } from "../types/api";
import { useLockPortrait } from "../hooks/useLockPortrait";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileSelect">;

export function ProfileSelectScreen({ navigation, route }: Props) {
  useLockPortrait();
  const { profiles, source } = route.params;
  const setSelectedProfile = useSessionStore((state) => state.setSelectedProfile);

  const subtitle =
    source === "unclaimed"
      ? "Unclaimed profiles available on this server."
      : "Tap a profile to continue signing in.";

  const handleSelect = (profile: PublicProfile) => {
    setSelectedProfile(profile);
    navigation.navigate("SignIn");
  };

  return (
    <FlatList
      data={profiles}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <AppHeader
            eyebrow="Choose profile"
            title={source === "unclaimed" ? "Unclaimed profiles" : "Your profiles"}
            subtitle={subtitle}
            actionLabel="Back"
            onAction={() => navigation.goBack()}
          />
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No profiles"
          subtitle="Go back and try a different email or use an unclaimed profile."
        />
      }
      renderItem={({ item }) => {
        const avatar = resolveAssetUrl(item.image_path);
        return (
          <Pressable
            onPress={() => handleSelect(item)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${item.name}`}
          >
            <View style={styles.avatarWrap}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarFallback]}>
                  <Feather name="user" size={36} color={colors.primaryText} />
                </View>
              )}
              <View style={styles.badge}>
                <Feather
                  name={item.has_password ? "lock" : "unlock"}
                  size={11}
                  color={colors.text}
                />
                <Text style={styles.badgeLabel}>
                  {item.has_password ? "Protected" : "Set up"}
                </Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.has_password ? "Password protected" : "Needs password"}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 18,
    backgroundColor: colors.background,
    paddingBottom: 32,
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerWrap: {
    marginBottom: 4,
  },
  card: {
    width: "48%",
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
  avatarWrap: {
    position: "relative",
    aspectRatio: 1,
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surfaceElevated,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryPressed,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(7,11,22,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  badgeLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
