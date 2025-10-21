import '../global.css';
import 'expo-dev-client';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { Stack } from 'expo-router';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeToggle } from '~/components/ThemeToggle';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import AppStatusBar from '~/components/AppStatusBar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { darkTheme, lightTheme } from '~/theme/theme';
import { useEffect } from 'react';
import { HasStoragePermission, RequestStoragePermission } from '~/modules/FileUtil';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeScripts } from '~/utils/copyScriptsToCache';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  useEffect(() => {
    HasStoragePermission().then((result) => {
      if (!result) {
        // alert to ask for permission
        Alert.alert(
          'Permission Required',
          'Please grant storage permission to access your books.',
          [
            {
              text: 'OK',
              onPress: () => RequestStoragePermission(),
            },
            {
              text: 'Cancel',
              onPress: () => console.log('Storage permission denied'),
              style: 'cancel',
            },
          ]
        );
      }
    });
  }, []);
  const queryClient = new QueryClient();

  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    initializeScripts();
  }, [isDarkColorScheme]);
  return (
    <>
      <AppStatusBar />

      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider
            theme={isDarkColorScheme ? darkTheme : lightTheme}
            settings={{
              icon: (props) => <Feather {...props} />, // override icon component
            }}>
            <ActionSheetProvider>
              <NavThemeProvider value={NAV_THEME[colorScheme]}>
                <Stack screenOptions={SCREEN_OPTIONS}>
                  <Stack.Screen name="(tabs)" options={TABS_OPTIONS} />
                  <Stack.Screen name="modal" options={MODAL_OPTIONS} />
                  <Stack.Screen name="page" options={SCREEN_OPTIONS} />
                </Stack>
              </NavThemeProvider>
            </ActionSheetProvider>
          </PaperProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </>
  );
}

const SCREEN_OPTIONS = {
  animation: 'ios_from_right', // for android
} as const;

const TABS_OPTIONS = {
  headerShown: false,
} as const;

const MODAL_OPTIONS = {
  presentation: 'modal',
  animation: 'fade_from_bottom', // for android
  title: 'Settings',
  headerRight: () => <ThemeToggle />,
} as const;
