import * as React from 'react';
import { ActivityIndicator, processColor, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import WebView from 'react-native-webview';
import { injectedJS } from '~/utils/JSInjection';
import { useColorScheme } from '~/lib/useColorScheme';
import { useEffect, useRef } from 'react';
import makeInjectedCSS from '~/utils/cssInjection';
import { useWebViewBridge } from '~/hooks/useWebViewBridge';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useChapters } from '~/hooks/useChapters';
import { ChapterListView } from '~/modules/FileUtil';
import { useBookStore } from '~/store/bookStore';

export default function DrawerExample() {
  const { bookId } = useLocalSearchParams();
  const book = useBookStore.getState().getBook(bookId as string);
  const bookPath = book?.path;

  const webviewRef = useRef<WebView>(null);

  const [open, setOpen] = React.useState(false);
  const [titleColor, setTitleColor] = React.useState(0);

  const { colors, isDarkColorScheme } = useColorScheme();
  const { toc, html, goToChapter, nextChapter, prevChapter } = useChapters(bookPath as string);
  const customTextColor = processColor('#FF4500') as number | undefined; // OrangeRed
  const { fullscreen, handleMessage, toggleFullscreen } = useWebViewBridge({
    onImageTap: (data) => console.log('Image tapped', data),
    onProgress: (data) => console.log('Reading progress', data),
    onSwipeEnd: (dir) => console.log('Swiped', dir),
    onBridgeReady: () => console.log('Bridge initialized'),
    onTap: () => console.log('Tap toggle fullscreen'),
  });

  useEffect(() => {
    webviewRef.current?.postMessage(
      JSON.stringify({
        type: 'setStyles',
        css: makeInjectedCSS(colors, 14, 4),
      })
    );
    const c = processColor(colors.foreground);
    setTitleColor(c as number);
  }, [isDarkColorScheme]);

  // console.log('toc', toc);
  // console.log('chapters', chapters);
  // console.log(chapters[3]?.href);
  if (!html) {
    console.log('html is null');
    // return null;
  }
  // if (!filePath) return null;
  // if (!bookPath) return null;
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
            chapters={toc}
            onChapterPress={(event: any) => {
              console.log(event.nativeEvent);
              const { id } = event.nativeEvent;
              goToChapter(Number(id));
            }}
            textColor={colors.foreground}
          />
        );
      }}>
      <Stack.Screen options={{ headerShown: !fullscreen, navigationBarHidden: !fullscreen }} />
      <WebView
        automaticallyAdjustsScrollIndicatorInsets
        contentMode="mobile"
        renderToHardwareTextureAndroid
        overScrollMode="never"
        style={{ backgroundColor: 'transparent' }}
        ref={webviewRef}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
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
        // startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onError={(error) => {
          console.error('WebView error:', error);
        }}
      />
    </Drawer>
  );
}
