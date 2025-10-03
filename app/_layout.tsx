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
import { RequestStoragePermission } from '~/modules/FileUtil';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  useEffect(() => {
    RequestStoragePermission();
  }, []);

  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <>
      <AppStatusBar />

      <GestureHandlerRootView style={{ flex: 1 }}>
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
