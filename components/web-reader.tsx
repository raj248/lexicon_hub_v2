// chrome://inspect/#devices
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { injectedJS } from '~/utils/JSInjection';

type ChapterViewProps = {
  filePath: string; // absolute path to cached HTML
  baseDir?: string;
  onLoad?: () => void;
};

function makeInjectedCSS(theme: any, fontSize = 16, lineHeight = 1.45) {
  return `
    html, body { background: ${theme.background}; color: ${theme.onBackground}; margin: 0; padding: 0; -webkit-text-size-adjust: none; }
    body { font-family: 'System'; font-size: ${fontSize}px; line-height: ${lineHeight}; padding: 16px; }
    img { max-width: 100%; height: auto; display: block; margin: 8px auto; }
    p { margin-bottom: 1rem; }
    h1,h2,h3 { margin: 1rem 0; }
    pre, code { white-space: pre-wrap; word-break: break-word; }
    /* add other rules you need */
  `;
}

export default function ChapterView({ filePath, baseDir: baseUrl, onLoad }: ChapterViewProps) {
  const webviewRef = useRef<WebView>(null);
  const [html, setHtml] = useState<string | null>(null);
  const fileUri = `file://${filePath}`;

  const handleMessage = useCallback((event: { nativeEvent: { data: any } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'imageClick':
          console.log('imageClick', data);
          // onImageTap && onImageTap(data);
          break;
        case 'progress':
          console.log('progress', data);
          // onProgress && onProgress(data);
          break;
        case 'swipe-end':
          console.log('swipe', data);
          // onSwipe && onSwipe(data.direction);
          break;
        case 'bridgeReady':
          // send initial styles
          // const css = cssOverride || ''; // build your CSS string
          console.log('bridgeReady', data);
          // webviewRef.current?.injectJavaScript(`window.postMessage(${JSON.stringify(JSON.stringify({type:'setStyles',css}))}); true;`);
          break;
        default:
          console.warn('Unknown message from webview', data);
      }
    } catch (e) {
      console.warn('Invalid message from webview', e);
    }
  }, []);

  useEffect(() => {
    const loadHtml = async () => {
      try {
        if (!filePath) return;
        const content = await FileSystem.readAsStringAsync(`file://${filePath}`);
        setHtml(content);
        // console.log('Chapter: ', content.slice(0, 600));
        // console.log(baseUrl);
        console.log('fileUri', fileUri);
      } catch (e) {
        console.error('Failed to load chapter HTML', e);
      }
    };

    loadHtml();
  }, [filePath]);

  if (!html) return null;
  if (!filePath) return null;
  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        source={{
          html,
        }}
        onMessage={handleMessage}
        menuItems={[{ key: '1', label: 'Coopy' }]}
        onCustomMenuSelection={(event) => {
          console.log('onCustomMenuSelection', event);
        }}
        onNavigationStateChange={(event) => {
          console.log('onNavigationStateChange', event);
        }}
        onHttpError={(event) => {
          console.log('onHttpError', event);
        }}
        allowFileAccess={true} // necessary for local files
        allowFileAccessFromFileURLs={true} // necessary for local files
        allowUniversalAccessFromFileURLs={true} // necessary for local files
        javaScriptEnabled
        domStorageEnabled
        onLoad={() => onLoad?.()}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onError={(error) => {
          console.error('WebView error:', error);
        }}
      />
    </View>
  );
}
