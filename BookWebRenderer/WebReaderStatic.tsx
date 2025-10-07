// chrome://inspect/#devices
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, useWindowDimensions } from 'react-native';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { injectedJS } from '~/utils/JSInjection';
import { parseOPFFromBook, prepareChapter } from '~/modules/FileUtil';
import { OPFData } from '~/epub-core/types';
import { darkTheme, lightTheme } from '~/theme/theme';
import { useColorScheme } from '~/lib/useColorScheme';
import { loadingHTML } from '~/utils/loading';

type ChapterViewProps = {
  bookPath: string; // absolute path to book
  index: number; // index of chapter in book
  setIndex: React.Dispatch<React.SetStateAction<number>>; // set index of chapter in book
  onLoad?: () => void;
};

function makeInjectedCSS(theme: any, fontSize = 16, lineHeight = 1.45) {
  return `
    html, body {
      background: ${theme.background};
      color: ${theme.foreground};
      margin: 0;
      padding: 0;
      font-size: "100%";
      -webkit-text-size-adjust: none;
    }

    body {
      font-family: 'System';
      font-size: ${fontSize}em;
      line-height: ${lineHeight};
      padding: 16px;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 8px auto;
    }

    p { margin-bottom: 1rem; }

    h1, h2, h3 { margin: 1rem 0; }

    pre, code {
      white-space: pre-wrap;
      word-break: break-word;
    }

    a {
      all: unset;
      font-weight: 600;
      cursor: pointer;
    }
  `;
}

export default function ChapterView({
  bookPath,
  index,
  setIndex,

  onLoad,
}: ChapterViewProps) {
  const { colors, isDarkColorScheme } = useColorScheme();
  const { width, height } = useWindowDimensions();
  const webviewRef = useRef<WebView>(null);
  const [bookData, setBookData] = useState<OPFData | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  let lastSwipeTime = 0;

  const orientation = width > height ? 'landscape' : 'portrait';

  const fontConstant = 2;
  const fontSize = orientation === 'landscape' ? fontConstant * (height / width) : fontConstant;

  useEffect(() => {
    console.log('newFontSize', fontSize);
    webviewRef.current?.postMessage(
      JSON.stringify({
        type: 'setStyles',
        css: makeInjectedCSS(colors, fontSize, 4),
      })
    );
  }, [orientation, isDarkColorScheme]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: any } }) => {
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
            console.log('lastSwipeTime', lastSwipeTime);
            const now = Date.now();
            if (now - lastSwipeTime < 500) return; // ignore rapid swipes
            setHtml(loadingHTML);
            lastSwipeTime = now;
            setIndex((prev: number) => (data.direction === 'left' ? prev + 1 : prev - 1));
            break;

          case 'bridgeReady':
            console.log('bridgeReady', data);
            webviewRef.current?.postMessage(
              JSON.stringify({
                type: 'setStyles',
                css: makeInjectedCSS(colors, fontSize, 4),
              })
            );
            break;
          default:
            console.warn('Unknown message from webview', data);
        }
      } catch (e) {
        console.warn('Invalid message from webview', e);
      }
    },
    [isDarkColorScheme]
  );

  useEffect(() => {
    if (!bookPath) {
      console.log('No book path provided.');
      return;
    }
    parseOPFFromBook(bookPath).then((result) => {
      setBookData(result);
      result?.spine.map((ch, i) => {
        if (i === index) {
          prepareChapter(bookPath, ch.href).then((chapterPath) => {
            setFilePath(chapterPath);
          });
          return;
        }
      });
    });
  }, [bookPath, index]);

  useEffect(() => {
    const loadHtml = async () => {
      console.log('Loading chapter: ', filePath ?? '');
      try {
        if (!filePath) return;
        const content = await FileSystem.readAsStringAsync(`file://${filePath}`);
        setHtml(content);
      } catch (e) {
        console.error('Failed to load chapter HTML', e);
      } finally {
        console.log('Chapter loaded');
      }
    };
    loadHtml();
  }, [filePath]);

  console.warn('Re-render');

  if (!html) return null;
  if (!filePath) return null;
  if (!bookPath) return null;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        style={{ backgroundColor: 'transparent' }}
        ref={webviewRef}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        source={{
          html,
        }}
        onMessage={handleMessage}
        menuItems={[{ key: '1', label: 'Coopy' }]}
        onCustomMenuSelection={(webViewEvent) => {
          console.log('onCustomMenuSelection', webViewEvent.nativeEvent);
        }}
        onNavigationStateChange={(event) => {
          // console.log('onNavigationStateChange', event);
        }}
        onHttpError={(webViewEvent) => {
          console.log('onHttpError', webViewEvent);
        }}
        onLayout={(event) => {
          console.log('onLayout', event.type);
        }}
        textZoom={100}
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
