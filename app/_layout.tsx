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
import { useFileIntent } from '~/hooks/useShareIntent';
export { ErrorBoundary } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { useInAppUpdate } from '~/hooks/useInAppUpdate';
export default function RootLayout() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent({});
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

  const { updateAvailable } = useInAppUpdate();

  useEffect(() => {
    if (updateAvailable) {
      Alert.alert('Update Available', 'A new version is available. Please update from Play Store.');
    }
  }, [updateAvailable]);

  useEffect(() => {
    if (error) {
      console.error('Share Intent Error:', error);
      // alert(`Error processing share: ${error}`);
      return;
    }

    if (hasShareIntent && shareIntent.files && shareIntent.files.length > 0) {
      handleSharedFiles(shareIntent.files);
    }
  }, [hasShareIntent, shareIntent, error]);

  const handleSharedFiles = (files: any[]) => {
    console.log('Received Shared Files:', files);

    // This example processes the first shared file
    const file = files[0];

    // Extract file details
    const fileName = file.fileName;
    const filePath = file.path; // Local path to the file in your app's temporary directory
    const mimeType = file.mimeType;
    const fileSize = file.size;

    let fileType = 'Unknown';
    if (mimeType.includes('pdf')) {
      fileType = 'PDF Document';
    } else if (mimeType.includes('epub')) {
      fileType = 'EPUB E-book';
    } else if (mimeType.includes('zip') || fileName.toLowerCase().endsWith('.zip')) {
      fileType = 'ZIP Archive';
    }

    alert(`File Shared!\nType: ${fileType}\nName: ${fileName}\nPath: ${filePath}`);

    // **IMPORTANT**: After you've processed the shared intent (e.g., saved the file to permanent storage,
    // navigated to a viewer, etc.), you must reset the intent to avoid processing it again on re-render.
    // The shared file at 'filePath' is usually in a temporary cache and should be moved
    // to a more permanent location using 'expo-file-system' if you need it long-term.
    resetShareIntent();
  };

  // useFileIntent();

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
                <Stack screenOptions={{ ...SCREEN_OPTIONS }}>
                  <Stack.Screen name="(tabs)" options={{ ...TABS_OPTIONS }} />
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
