'use client';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';

type ChapterViewProps = {
  filePath: string; // absolute path to cached HTML
  onLoad?: () => void;
};

export default function ChapterView({ filePath, onLoad }: ChapterViewProps) {
  const webviewRef = useRef<WebView>(null);

  // Encode the file URI properly (handles spaces and special characters)
  const fileUri = encodeURI(`file://${filePath}`);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        source={{ uri: fileUri }}
        originWhitelist={['*']}
        allowFileAccess={true} // necessary for local files
        javaScriptEnabled
        domStorageEnabled
        onLoad={() => onLoad?.()}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
}
