import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessionStore } from "../state/session";
import { colors } from "../theme/colors";
import { ExploreScreen } from "../screens/ExploreScreen";
import { GenreScreen } from "../screens/GenreScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { PlayerScreen } from "../screens/PlayerScreen";
import { ProfileLookupScreen } from "../screens/ProfileLookupScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProfileSelectScreen } from "../screens/ProfileSelectScreen";
import { RecommendationsScreen } from "../screens/RecommendationsScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ServerConnectScreen } from "../screens/ServerConnectScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SwitchProfileScreen } from "../screens/SwitchProfileScreen";
import { TitleDetailsScreen } from "../screens/TitleDetailsScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { WatchlistScreen } from "../screens/WatchlistScreen";
import { SidebarOverlay, type SidebarItem } from "../components/SidebarOverlay";

export type RootStackParamList = {
  ServerConnect: undefined;
  ProfileLookup: undefined;
  ProfileSelect: { profiles: import("../types/api").PublicProfile[]; source: "email" | "unclaimed" };
  SignIn: undefined;
  Register: undefined;
  MainTabs: undefined;
  TitleDetails: { dirPath: string };
  Genre: { genre: string };
  Library: { type: string; title: string };
  Watchlist: undefined;
  Recommendations: undefined;
  SwitchProfile: undefined;
  Player: {
    dirPath: string;
    title: string;
    videos: string[];
    startIndex: number;
    initialTime: number;
    subtitles?: { label: string; language: string; src: string; format: string }[];
  };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Explore: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const extraBottom = 28;
  const iconSize = isLandscape ? 24 : 26;
  const railWidth = 56;

  const tabBarStyle = isLandscape
    ? {
        backgroundColor: colors.surfaceElevated,
        borderRightColor: colors.border,
        borderRightWidth: 1,
        borderTopWidth: 0,
        paddingTop: insets.top + 14,
        paddingBottom: insets.bottom + 14,
        paddingStart: 0,
        paddingEnd: 0,
        paddingLeft: 0,
        paddingHorizontal: 0,
        width: railWidth,
        minWidth: 0,
        maxWidth: railWidth,
      }
    : {
        backgroundColor: colors.surfaceElevated,
        borderTopColor: colors.border,
        paddingTop: 14,
        paddingBottom: insets.bottom + extraBottom,
        paddingHorizontal: 18,
        height: 70 + insets.bottom + extraBottom,
      };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarPosition: isLandscape ? "left" : "bottom",
        tabBarVariant: "uikit",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: "transparent",
        tabBarInactiveBackgroundColor: "transparent",
        tabBarShowLabel: !isLandscape,
        tabBarStyle,
        tabBarItemStyle: isLandscape
          ? {
              paddingVertical: 10,
              height: 56,
              width: railWidth,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
            }
          : { paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700", marginTop: 6 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="home" size={iconSize} color={color} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="search" size={iconSize} color={color} /> }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="compass" size={iconSize} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="user" size={iconSize} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function MainTabsWithSidebar() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const items: SidebarItem[] = [
    {
      icon: "play-circle",
      label: "Anime",
      onPress: () => navigation.navigate("Genre", { genre: "Anime" }),
    },
    {
      icon: "star",
      label: "Recommendations",
      onPress: () => navigation.navigate("Recommendations"),
    },
    {
      icon: "bookmark",
      label: "My List",
      onPress: () => navigation.navigate("Watchlist"),
    },
    {
      icon: "monitor",
      label: "TV Shows",
      onPress: () => navigation.navigate("Library", { type: "tv show", title: "TV Shows" }),
    },
    {
      icon: "film",
      label: "Movies",
      onPress: () => navigation.navigate("Library", { type: "Movie", title: "Movies" }),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <MainTabs />
      <SidebarOverlay items={items} enabled={!isLandscape} />
    </View>
  );
}

export function RootNavigator() {
  const serverUrl = useSessionStore((state) => state.serverUrl);
  const token = useSessionStore((state) => state.token);
  const profile = useSessionStore((state) => state.profile);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!serverUrl ? (
        <Stack.Screen name="ServerConnect" component={ServerConnectScreen} options={{ title: "Connect to Server" }} />
      ) : !token || !profile ? (
        <>
          <Stack.Screen name="ProfileLookup" component={ProfileLookupScreen} options={{ title: "Find Profile" }} />
          <Stack.Screen name="ProfileSelect" component={ProfileSelectScreen} options={{ title: "Choose Profile" }} />
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "Sign In" }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Create Profile" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabsWithSidebar} options={{ headerShown: false }} />
          <Stack.Screen name="TitleDetails" component={TitleDetailsScreen} options={{ title: "Details" }} />
          <Stack.Screen name="Genre" component={GenreScreen} options={({ route }) => ({ title: route.params.genre })} />
          <Stack.Screen
            name="Library"
            component={LibraryScreen}
            options={({ route }) => ({ title: route.params.title })}
          />
          <Stack.Screen name="Watchlist" component={WatchlistScreen} options={{ title: "My List" }} />
          <Stack.Screen
            name="Recommendations"
            component={RecommendationsScreen}
            options={{ title: "Recommendations" }}
          />
          <Stack.Screen name="SwitchProfile" component={SwitchProfileScreen} options={{ title: "Switch Profile" }} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ headerShown: false, contentStyle: { backgroundColor: "#000" } }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
