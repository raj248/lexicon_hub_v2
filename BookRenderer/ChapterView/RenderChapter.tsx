import { useEffect, useMemo, useState } from 'react';
import { Text } from '../../components/nativewindui/Text';
import { Dimensions, View, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHtml from 'react-native-render-html';
import * as FileSystem from 'expo-file-system';
import CustomImageRenderer from '~/BookRenderer/CustomImageRenderer';
import { useColorScheme } from '~/lib/useColorScheme';
import { Stack } from 'expo-router';
import { prepareChapter } from '~/modules/FileUtil';
import { SvgRenderer } from '~/BookRenderer/CustomSVGRenderer';
import { customHTMLElementModels } from '~/BookRenderer/CustomHTMLRenderModel';

type ChapterViewProps = {
  filePath: string; // path to cached chapter XHTML
  bookPath: string; // path to book
};

export default function ChapterView({ bookPath, filePath }: ChapterViewProps) {
  const { isDarkColorScheme } = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const contentWidth = useMemo(() => screenWidth - 32, [screenWidth]);
  const htmlContent = useMemo(() => html, [html]);
  const start = performance.now();

  useEffect(() => {
    const loadHtml = async () => {
      const local_start = performance.now();
      // console.log('Loading chapter: ', filePath);
      try {
        const htmlPath = await prepareChapter(bookPath, filePath);
        const content = await FileSystem.readAsStringAsync(`file://${htmlPath}`);
        setHtml(content);
        // console.log('Chapter: ', content);
      } catch (e) {
        console.error('Failed to load chapter HTML', e);
      } finally {
        // console.log('Chapter loaded in', (performance.now() - local_start).toFixed(2), 'ms');
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
          // debug
          contentWidth={contentWidth}
          source={{ html: htmlContent }}
          enableExperimentalBRCollapsing
          onDocumentMetadataLoaded={(props) => {
            // console.log('Metadata Loaded', [props.title]);
          }}
          onHTMLLoaded={() => {
            // console.log('HTML Loaded in ', (performance.now() - start).toFixed(2), 'ms');
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
            // p: { marginBottom: 15, marginHorizontal: 10 },
          }}
          defaultTextProps={{ selectable: true, style: { marginBottom: 15, marginHorizontal: 10 } }}
          customHTMLElementModels={customHTMLElementModels}
          renderers={{ img: CustomImageRenderer, svg: SvgRenderer }}
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
