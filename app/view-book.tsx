import * as React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import WebView from 'react-native-webview';
import { injectedJS } from '~/utils/JSInjection';
import { useColorScheme } from '~/lib/useColorScheme';
import makeInjectedCSS from '~/utils/cssInjection';
import { useWebViewBridge } from '~/hooks/useWebViewBridge';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useChapters } from '~/hooks/useChapters';
import { ChapterListView } from '~/modules/FileUtil';
import { useBookStore } from '~/store/bookStore';
import { ChapterListViewProps } from '~/modules/FileUtil/src/FileUtilModule.types';

export default function DrawerExample() {
  const { bookId } = useLocalSearchParams();
  const book = useBookStore.getState().getBook(bookId as string);
  const bookPath = book?.path;

  const webviewRef = React.useRef<WebView>(null);
  const chapterListViewRef = React.useRef<ChapterListViewProps>(null);

  const [isWebViewReady, setIsWebViewReady] = React.useState(false); // 👈 control spinner manually

  const [open, setOpen] = React.useState(false);

  const { colors, isDarkColorScheme } = useColorScheme();
  const { toc, html, goToChapter, nextChapter, prevChapter, index, title, spine } = useChapters(
    bookPath as string,
    book?.progress?.index ?? 0
  );

  const saveProgressRef = React.useRef<NodeJS.Timeout | number | null>(null);

  const saveProgress = React.useCallback(
    (href: string, index: number, scroll: number, ts: number) => {
      // Clear previous timeout if still pending
      if (saveProgressRef.current) clearTimeout(saveProgressRef.current);

      // Wait 500ms before committing progress (bounce)
      saveProgressRef.current = setTimeout(() => {
        useBookStore.getState().updateProgress(bookId as string, { href, index, scroll });
        console.log('Saved progress:', { href, index, scroll });
      }, 500);
    },
    [bookId]
  );

  const { fullscreen, handleMessage } = useWebViewBridge({
    onImageTap: (data) => console.log('Image tapped', data),
    onProgress: (data) => {
      if (spine?.[index]) saveProgress(spine?.[index].href, index, data.progress, data.timestamp);
    },
    onSwipeEnd: (dir) => {
      if (dir === 'left') {
        nextChapter() ? setIsWebViewReady(false) : null;
      } else {
        prevChapter() ? setIsWebViewReady(false) : null;
      }
      const chapterIndex = toc.find((t) => t.id === (index + 1).toString())?.id;
      if (chapterIndex) {
        chapterListViewRef.current?.setSelectedChapter?.(chapterIndex);
      }
    },
    onBridgeReady: () => {
      injectCss();
      if (book?.progress) {
        webviewRef.current?.injectJavaScript(`
          window.ReadingProgress?.goTo(${book.progress.scroll ?? 0});
          `);
      }
    },
    onStylesAck: () => {
      setIsWebViewReady(true);
    },
    onTap: () => console.log('Tap toggle fullscreen'),
  });

  const injectCss = React.useCallback(() => {
    webviewRef.current?.postMessage(
      JSON.stringify({
        type: 'setStyles',
        css: makeInjectedCSS(colors, 14, 1.45),
      })
    );
  }, [colors]);

  return (
    <Drawer
      style={{ flex: 1 }}
      open={open}
      drawerPosition="right"
      drawerStyle={{ width: 300, backgroundColor: colors.background }}
      drawerType="slide"
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      renderDrawerContent={() => {
        return (
          <ChapterListView
            style={{ flex: 1 }}
            ref={chapterListViewRef}
            chapters={toc}
            initialIndex={0}
            onChapterPress={(event: any) => {
              console.log(event.nativeEvent);
              const { id } = event.nativeEvent;
              goToChapter(Number(id));
            }}
            textColor={colors.foreground}
          />
        );
      }}>
      <Stack.Screen
        options={{
          title: title,
          freezeOnBlur: true,
          navigationBarHidden: true,
          statusBarHidden: true,
          headerStyle: { backgroundColor: isDarkColorScheme ? '#0b0220' : '#b4c1f8' },
          headerTintColor: '#fff',
        }}
      />

      {/* Spinner overlay */}
      {!isWebViewReady && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            backgroundColor: colors.background,
          }}>
          <ActivityIndicator size="large" />
        </View>
      )}

      <WebView
        automaticallyAdjustsScrollIndicatorInsets
        contentMode="mobile"
        // renderToHardwareTextureAndroid
        showsVerticalScrollIndicator={false}
        containerStyle={{ backgroundColor: 'transparent' }}
        overScrollMode="never"
        style={{ backgroundColor: 'transparent' }}
        ref={webviewRef}
        source={{
          html: html ?? '',
        }}
        onMessage={handleMessage}
        menuItems={[{ key: '1', label: 'Coopy' }]}
        onCustomMenuSelection={(webViewEvent) => {
          console.log('onCustomMenuSelection', webViewEvent.nativeEvent);
        }}
        textZoom={100}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        javaScriptEnabled
        domStorageEnabled
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onError={(error) => {
          console.error('WebView error:', error);
          Alert.alert('Error', error.nativeEvent.description);
        }}
      />
    </Drawer>
  );
}
