import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { useSessionStore } from "../state/session";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { useLockPortrait } from "../hooks/useLockPortrait";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileLookup">;

export function ProfileLookupScreen({ navigation }: Props) {
  useLockPortrait();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const setSelectedProfile = useSessionStore((state) => state.setSelectedProfile);
  const setServerUrl = useSessionStore((state) => state.setServerUrl);
  const currentServerUrl = useSessionStore((state) => state.serverUrl);

  const handleLookup = async () => {
    try {
      setSubmitting(true);
      const data = await api.lookupProfiles(email.trim());
      if (!data.profiles.length) {
        Alert.alert("No profiles", "No profiles were found for that email address.");
        return;
      }
      navigation.navigate("ProfileSelect", { profiles: data.profiles, source: "email" });
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
      if (!data.profiles.length) {
        Alert.alert("No profiles", "This server has no unclaimed profiles.");
        return;
      }
      navigation.navigate("ProfileSelect", { profiles: data.profiles, source: "unclaimed" });
    } catch (error) {
      Alert.alert("Lookup failed", error instanceof Error ? error.message : "Unable to load profiles.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    try {
      setSubmitting(true);
      const data = await api.getGuestProfile();
      setSelectedProfile(data.profile);
      navigation.navigate("SignIn");
    } catch (error) {
      Alert.alert("Guest unavailable", error instanceof Error ? error.message : "Unable to load guest profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <AppHeader
          eyebrow="Connected Server"
          title="Find a profile"
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
        <Pressable onPress={handleGuest} disabled={submitting} style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>Continue as Guest</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkButton}>
          <Text style={styles.linkLabel}>Create a new profile</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    flexGrow: 1,
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
    alignSelf: "center",
  },
  linkLabel: {
    color: colors.accentText,
    fontWeight: "600",
  },
});
