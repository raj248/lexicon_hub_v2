import { useNavigation } from 'expo-router';
import { use, useEffect } from 'react';
import { View } from 'react-native';
import { Button } from '~/components/Button';
import { Text } from '~/components/nativewindui/Text';
import { useTabBar } from '~/context/TabBarContext';
import * as FileUtil from '~/modules/FileUtil';
import { useBookStore } from '~/store/bookStore';
import { exploreCache } from '~/utils/exploreCache';

export type Props = {
  chapters: Array<{ id: string; title: string }>;
  onChapterPress: (event: { nativeEvent: { id: string; title: string } }) => void;
};

export default function ChapterListScreen() {
  const { hide, show } = useTabBar();
  const { books } = useBookStore.getState();
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      show(); // show tab bar on tab switch
    });

    return unsubscribe;
  }, [navigation, show]);

  const opf = async () => {
    FileUtil.ScanFiles().then((files) => {
      files.map((book) => {
        FileUtil.parseOPFFromBook(book).then((result) => {
          // console.log(
          //   'result',
          //   // result.metadata.title,
          //   // result?.metadata.coverImage ?? result?.metadata.title + ' (no cover)'
          //   // result?.baseDir,
          //   result?.metadata.title,
          //   // result?.spine
          //   result?.metadata.identifier
          // );
          if (result?.metadata.identifier === '9781718375772') {
            // console.log('book', book);
            // console.log('result', result?.metadata);
            // console.log('spine', result?.spine);
            // FileUtil.parseTOC(book, result?.metadata.toc ?? '').then((toc) => {
            // console.log('toc', toc);
            // });
          }
          // console.log('result', result?.spine);
        });
      });
    });
  };
  return (
    <View className="flex-1 items-center justify-center">
      <Text variant={'heading'}>Settings</Text>
      <Text variant="callout">Your settings will be displayed here</Text>
      {/* TESTING KIT */}
      {/* <Button
        title="Explore cache"
        onPress={() => {
          exploreCache();
        }}
      /> */}
      <Button
        title="get opf"
        onPress={() => {
          opf();
        }}
      />

      {/* TESTING KIT END */}
    </View>
  );
}
