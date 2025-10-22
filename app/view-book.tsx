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

  const [open, setOpen] = React.useState(false);

  const { colors, isDarkColorScheme } = useColorScheme();
  const { toc, html, goToChapter, nextChapter, prevChapter, index, title } = useChapters(
    bookPath as string
  );
  const { fullscreen, handleMessage } = useWebViewBridge({
    onImageTap: (data) => console.log('Image tapped', data),
    onProgress: (data) => console.log('Reading progress', data),
    onSwipeEnd: (dir) => {
      dir === 'left' ? nextChapter() : prevChapter();
      const chapterIndex = toc.find((t) => t.id === (index + 1).toString())?.id;
      if (chapterIndex) {
        chapterListViewRef.current?.setSelectedChapter?.(chapterIndex);
      }
    },
    onBridgeReady: () => injectCss(),
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
        options={{ title: title, headerShown: !fullscreen, navigationBarHidden: !fullscreen }}
      />
      <WebView
        automaticallyAdjustsScrollIndicatorInsets
        contentMode="mobile"
        renderToHardwareTextureAndroid
        overScrollMode="never"
        style={{ backgroundColor: 'transparent' }}
        ref={webviewRef}
        // injectedJavaScriptBeforeContentLoaded={injectedJS}
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
