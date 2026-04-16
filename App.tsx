import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

import { AppProviders } from "./src/providers/AppProviders";
import { RootNavigator } from "./src/navigation/RootNavigator";

function ImmersiveMode() {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    void NavigationBar.setVisibilityAsync("hidden").catch(() => {});
    void NavigationBar.setBehaviorAsync("overlay-swipe").catch(() => {});
    void NavigationBar.setBackgroundColorAsync("#00000000").catch(() => {});
    void NavigationBar.setButtonStyleAsync("light").catch(() => {});
    void NavigationBar.setPositionAsync("absolute").catch(() => {});
  }, []);

  return null;
}

export default function App() {
  return (
    <AppProviders>
      <StatusBar hidden style="light" translucent />
      <ImmersiveMode />
      <RootNavigator />
    </AppProviders>
  );
}
