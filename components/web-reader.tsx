'use client';
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

type ChapterViewProps = {
  filePath: string; // absolute path to cached HTML
  baseDir?: string;
  onLoad?: () => void;
};

export default function ChapterView({ filePath, baseDir: baseUrl, onLoad }: ChapterViewProps) {
  const webviewRef = useRef<WebView>(null);
  const [html, setHtml] = useState<string | null>(null);

  // Encode the file URI properly (handles spaces and special characters)
  // const fileUri = encodeURI(`file://${filePath}`);
  const fileUri = `file://${filePath}`;

  useEffect(() => {
    const loadHtml = async () => {
      try {
        if (!filePath) return;
        const content = await FileSystem.readAsStringAsync(`file://${filePath}`);
        setHtml(content);
        console.log('Chapter: ', content.slice(0, 600));
        console.log(baseUrl);
      } catch (e) {
        console.error('Failed to load chapter HTML', e);
      }
    };

    loadHtml();
  }, [filePath]);

  console.log('fileUri', fileUri);

  if (!html) return null;
  if (!filePath) return null;
  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        suppressMenuItems={[]}
        menuItems={[{ key: '1', label: 'Coopy' }]}
        onOpenWindow={() => {
          console.log('onOpenWindow');
        }}
        onCustomMenuSelection={(event) => {
          console.log('onCustomMenuSelection', event);
        }}
        onNavigationStateChange={(event) => {
          console.log('onNavigationStateChange', event);
        }}
        onMessage={(event) => {
          console.log('onMessage', event);
        }}
        source={{
          uri: fileUri,
          html,
          baseUrl: `file://${baseUrl}/OEBPS/Text/`,
          headers: { 'Content-Type': 'application/xhtml+xml; charset=UTF-8' },
        }}
        onHttpError={(event) => {
          console.log('onHttpError', event);
        }}
        originWhitelist={['*']}
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
