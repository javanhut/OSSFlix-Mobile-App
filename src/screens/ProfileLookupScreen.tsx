import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { useSessionStore } from "../state/session";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import type { PublicProfile } from "../types/api";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileLookup">;

export function ProfileLookupScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const setSelectedProfile = useSessionStore((state) => state.setSelectedProfile);
  const setServerUrl = useSessionStore((state) => state.setServerUrl);
  const currentServerUrl = useSessionStore((state) => state.serverUrl);

  const handleLookup = async () => {
    try {
      setSubmitting(true);
      const data = await api.lookupProfiles(email.trim());
      setProfiles(data.profiles);
      if (!data.profiles.length) {
        Alert.alert("No profiles", "No profiles were found for that email address.");
      }
    } catch (error) {
      Alert.alert("Lookup failed", error instanceof Error ? error.message : "Unable to load profiles.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnclaimed = async () => {
    try {
      setSubmitting(true);
      const data = await api.lookupUnclaimed();
      setProfiles(data.profiles);
      if (!data.profiles.length) {
        Alert.alert("No profiles", "This server has no unclaimed profiles.");
      }
    } catch (error) {
      Alert.alert("Lookup failed", error instanceof Error ? error.message : "Unable to load profiles.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectProfile = (profile: PublicProfile) => {
    setSelectedProfile(profile);
    navigation.navigate("SignIn");
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        eyebrow="Connected Server"
        title="Choose a profile"
        subtitle={currentServerUrl ? currentServerUrl : "No server configured"}
        actionLabel="Change"
        onAction={() => setServerUrl("")}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Email"
        placeholderTextColor="#64748b"
        style={styles.input}
      />
      <Pressable onPress={handleLookup} disabled={submitting} style={styles.primaryButton}>
        <Text style={styles.primaryLabel}>{submitting ? "Loading..." : "Find Profiles"}</Text>
      </Pressable>
      <Pressable onPress={handleUnclaimed} disabled={submitting} style={styles.secondaryButton}>
        <Text style={styles.secondaryLabel}>Use Unclaimed Profile</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkButton}>
        <Text style={styles.linkLabel}>Create a new profile</Text>
      </Pressable>
      <FlatList
        data={profiles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No profiles loaded yet" subtitle="Look up profiles by email, use an unclaimed profile, or create a new one." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => selectProfile(item)} style={styles.profileCard}>
            <View style={styles.avatar}>
              <Feather name="user" size={20} color={colors.primaryText} />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{item.name}</Text>
              <Text style={styles.profileMeta}>{item.has_password ? "Password protected" : "Needs password"}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryLabel: {
    color: colors.primaryText,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: colors.surfaceAccent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  linkButton: {
    marginTop: 12,
  },
  linkLabel: {
    color: colors.accentText,
    fontWeight: "600",
  },
  list: {
    paddingTop: 18,
    paddingBottom: 32,
    flexGrow: 1,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryPressed,
  },
  profileText: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  profileMeta: {
    color: colors.textMuted,
    marginTop: 4,
  },
});
