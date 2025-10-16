import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { Drawer } from 'react-native-drawer-layout';
import WebView from 'react-native-webview';
import { injectedJS } from '~/utils/JSInjection';
import { useColorScheme } from '~/lib/useColorScheme';
import { useEffect, useRef, useState } from 'react';
import makeInjectedCSS from '~/utils/cssInjection';
import { OPFData } from '~/epub-core/types';
import { useWebViewBridge } from '~/hooks/useWebViewBridge';
import { Stack } from 'expo-router';
export default function DrawerExample() {
  const webviewRef = useRef<WebView>(null);

  const [open, setOpen] = React.useState(false);
  const [bookData, setBookData] = useState<OPFData | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);

  const { colors, isDarkColorScheme } = useColorScheme();

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
  }, [isDarkColorScheme]);

  // if (!html) return null;
  // if (!filePath) return null;
  // if (!bookPath) return null;

  return (
    <Drawer
      style={{ flex: 1 }}
      open={open}
      drawerPosition="right"
      drawerStyle={{ width: 300 }}
      drawerType="slide"
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      renderDrawerContent={() => {
        return <Text>Drawer content</Text>;
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
