import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessionStore } from "../state/session";
import { colors } from "../theme/colors";
import { GenreScreen } from "../screens/GenreScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { PlayerScreen } from "../screens/PlayerScreen";
import { ProfileLookupScreen } from "../screens/ProfileLookupScreen";
import { ProfileSelectScreen } from "../screens/ProfileSelectScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ServerConnectScreen } from "../screens/ServerConnectScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { TitleDetailsScreen } from "../screens/TitleDetailsScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { WatchlistScreen } from "../screens/WatchlistScreen";

export type RootStackParamList = {
  ServerConnect: undefined;
  ProfileLookup: undefined;
  ProfileSelect: { profiles: import("../types/api").PublicProfile[]; source: "email" | "unclaimed" };
  SignIn: undefined;
  Register: undefined;
  MainTabs: undefined;
  TitleDetails: { dirPath: string };
  Genre: { genre: string };
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
  Movies: undefined;
  TVShows: undefined;
  Search: undefined;
  MyList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const extraBottom = 28;
  const iconSize = 26;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          paddingTop: 14,
          paddingBottom: insets.bottom + extraBottom,
          paddingHorizontal: 18,
          height: 70 + insets.bottom + extraBottom,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700", marginTop: 6 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="home" size={iconSize} color={color} /> }}
      />
      <Tab.Screen
        name="Movies"
        component={LibraryScreen}
        initialParams={{ type: "Movie", title: "Movies" } as never}
        options={{ tabBarIcon: ({ color }) => <Feather name="film" size={iconSize} color={color} /> }}
      />
      <Tab.Screen
        name="TVShows"
        component={LibraryScreen}
        initialParams={{ type: "tv show", title: "TV Shows" } as never}
        options={{
          title: "TV Shows",
          tabBarIcon: ({ color }) => <Feather name="monitor" size={iconSize} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="search" size={iconSize} color={color} /> }}
      />
      <Tab.Screen
        name="MyList"
        component={WatchlistScreen}
        options={{
          title: "My List",
          tabBarIcon: ({ color }) => <Feather name="bookmark" size={iconSize} color={color} />,
        }}
      />
    </Tab.Navigator>
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
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="TitleDetails" component={TitleDetailsScreen} options={{ title: "Details" }} />
          <Stack.Screen name="Genre" component={GenreScreen} options={({ route }) => ({ title: route.params.genre })} />
          <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}
