import { useEffect, useMemo, useState } from 'react';
import { Text } from './nativewindui/Text';
import { Dimensions, View, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHtml from 'react-native-render-html';
import * as FileSystem from 'expo-file-system';
import CustomImageRenderer from '~/BookRenderer/CustomImageRenderer';
import { useColorScheme } from '~/lib/useColorScheme';
import { Stack } from 'expo-router';

type ChapterViewProps = {
  filePath: string; // path to cached chapter XHTML
};

export default function ChapterView({ filePath }: ChapterViewProps) {
  const { isDarkColorScheme } = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const contentWidth = useMemo(() => screenWidth - 32, [screenWidth]);
  const htmlContent = useMemo(() => html, [html]);
  const start = performance.now();

  useEffect(() => {
    const loadHtml = async () => {
      console.log('Loading chapter: ', filePath);
      try {
        const content = await FileSystem.readAsStringAsync(`file://${filePath}`);
        setHtml(content);
        // console.log('Chapter: ', content);
      } catch (e) {
        console.error('Failed to load chapter HTML', e);
      } finally {
        // console.log('Chapter loaded in', (performance.now() - start).toFixed(2), 'ms');
        setLoading(false);
      }
    };

    loadHtml();
  }, [filePath]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!htmlContent) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Failed to load chapter</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ScrollView style={{ flex: 1, width: '100%' }} showsVerticalScrollIndicator={true}>
        <RenderHtml
          contentWidth={contentWidth}
          source={{ html: htmlContent }}
          enableExperimentalBRCollapsing
          onDocumentMetadataLoaded={(props) => {
            console.log('Metadata Loaded', [props.title]);
          }}
          onHTMLLoaded={() => {
            console.log('HTML Loaded in ', (performance.now() - start).toFixed(2), 'ms');
          }}
          baseStyle={{
            fontSize: 16,
            lineHeight: 20,
            // textDecorationColor: 'transparent',
            color: isDarkColorScheme ? '#fff' : '#000',
          }}
          tagsStyles={{
            img: { height: 'auto' },
            body: { backgroundColor: 'transparent' },
            h1: {
              fontSize: 22,
              fontWeight: 'bold',
              textAlign: 'center',
              marginHorizontal: 10,
              marginVertical: 20,
            },
            h2: {
              fontSize: 22,
              fontWeight: 'bold',
              textAlign: 'center',
              marginHorizontal: 10,
              marginVertical: 20,
            },
            p: { marginBottom: 15, marginHorizontal: 10 },
          }}
          defaultTextProps={{ selectable: true }}
          renderers={{ img: CustomImageRenderer }}
          renderersProps={{
            img: {
              // @ts-ignore it works, so ignore it
              customOnPress: (uri: string) => {
                console.log('Image tapped!', uri);
              },
            },
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
