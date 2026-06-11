import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const theme = colors.dark;

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.foreground,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        headerShadowVisible: false,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="library/create" options={{ title: "New Prompt", headerBackTitle: "Back" }} />
      <Stack.Screen name="library/edit/[id]" options={{ title: "Edit Prompt", headerBackTitle: "Back" }} />
      <Stack.Screen name="library/[id]" options={{ title: "Prompt", headerBackTitle: "Back" }} />
      <Stack.Screen name="tools/aspect-ratio" options={{ title: "Aspect Ratio" }} />
      <Stack.Screen name="tools/prompting-guides" options={{ title: "Prompting Guides" }} />
      <Stack.Screen name="tools/metadata-analyzer" options={{ title: "Image Metadata" }} />
      <Stack.Screen name="tools/generate-prompt" options={{ title: "Generate Prompt" }} />
      <Stack.Screen name="tools/prompt-miner" options={{ title: "PromptMiner" }} />
      <Stack.Screen name="tools/import-prompts" options={{ title: "Import Prompts" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background).catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
