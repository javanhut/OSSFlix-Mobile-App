import { useMemo, useState } from "react";
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../state/session";
import { colors } from "../theme/colors";
import { useLockPortrait } from "../hooks/useLockPortrait";

type Props = NativeStackScreenProps<RootStackParamList, "SignIn">;

export function SignInScreen({ navigation }: Props) {
  useLockPortrait();

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedProfile = useSessionStore((state) => state.selectedProfile);
  const setAuthenticatedSession = useSessionStore((state) => state.setAuthenticatedSession);

  const needsSetPassword = useMemo(() => selectedProfile && !selectedProfile.has_password, [selectedProfile]);

  const submit = async () => {
    if (!selectedProfile) {
      navigation.goBack();
      return;
    }
    try {
      setSubmitting(true);
      const response = needsSetPassword
        ? await api.mobileSetPassword(selectedProfile.id, password)
        : await api.mobileLogin(selectedProfile.id, password);
      if (!response?.token || !response?.profile) {
        throw new Error("Server did not return a valid session. Please try again.");
      }
      setAuthenticatedSession(response.token, response.profile);
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Unable to sign in.";
      const message = raw === "password_not_set"
        ? "This profile has no password yet. Go back and select it again to set one."
        : raw;
      Alert.alert("Authentication failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          eyebrow="Profile"
          title={selectedProfile?.name || "Profile"}
          subtitle={needsSetPassword ? "Set a password for this profile." : "Enter the profile password to continue."}
          actionLabel="Back"
          onAction={() => navigation.goBack()}
        />
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#64748b"
          style={styles.input}
        />
        <Pressable onPress={submit} disabled={submitting} style={styles.button}>
          <View style={styles.buttonContent}>
            <Feather name={needsSetPassword ? "lock" : "log-in"} size={18} color={colors.primaryText} />
            <Text style={styles.buttonLabel}>{submitting ? "Working..." : needsSetPassword ? "Set Password" : "Sign In"}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    flexGrow: 1,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonLabel: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: "700",
  },
});
