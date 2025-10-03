import { useEffect, useState } from 'react';
import { Text } from './nativewindui/Text';
import { Dimensions, View, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHtml from 'react-native-render-html';
import * as FileSystem from 'expo-file-system';
import CustomImageRenderer from '~/BookRenderer/CustomImageRenderer';

type ChapterViewProps = {
  filePath: string; // path to cached chapter XHTML
};

export default function ChapterView({ filePath }: ChapterViewProps) {
  const { width } = useWindowDimensions(); // ← updates on rotation

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHtml = async () => {
      try {
        const content = await FileSystem.readAsStringAsync(`file://${filePath}`);
        setHtml(content);
        // console.log('Chapter: ', content);
      } catch (e) {
        console.error('Failed to load chapter HTML', e);
      } finally {
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

  if (!html) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Failed to load chapter</Text>
      </SafeAreaView>
    );
  }

  const contentWidth = width - 32; // 16px margin each side

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        // contentContainerStyle={{ paddingVertical: 100 }}
        showsVerticalScrollIndicator={true}>
        <RenderHtml
          contentWidth={contentWidth}
          source={{ html }}
          tagsStyles={{
            img: { height: 'auto' },
            body: { backgroundColor: 'transparent' },
            h1: { fontSize: 22, fontWeight: 'bold' },
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
