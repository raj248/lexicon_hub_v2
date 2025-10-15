import { View, StyleSheet, Text } from 'react-native';
import { ChapterListView, FileUtilView } from '~/modules/FileUtil';
export type Props = {
  chapters: Array<{ id: string; title: string }>;
  onChapterPress: (event: { nativeEvent: { id: string; title: string } }) => void;
};

export default function ChapterListScreen() {
  const chapters = Array.from({ length: 2500 }, (_, i) => ({
    id: `chapter_${i + 1}`,
    title: `Chapter ${i + 1}: The Great Journey`,
  }));

  const handleChapterPress = (event: any) => {
    const { id, title } = event.nativeEvent;
    console.log(`Pressed chapter: ${title} (ID: ${id})`);
  };

  return (
    <View style={styles.container}>
      <ChapterListView
        style={styles.list}
        chapters={chapters}
        onChapterPress={handleChapterPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
    width: '100%',
  },
});
