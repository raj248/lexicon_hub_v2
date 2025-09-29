import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/nativewindui/Text';
import * as FileUtil from '~/modules/FileUtil';

export default function Library() {
  const [books, setBooks] = useState<string[]>([]);
  useEffect(() => {
    FileUtil.checkFilePermission().then((granted) => {
      console.log('checkFilePermission', granted);
      if (granted) {
        FileUtil.ScanFiles().then((files) => {
          if (files) setBooks(files);
        });
      } else {
        console.log('RequestStoragePermission');
        FileUtil.RequestStoragePermission().then((granted) => {
          if (granted) {
            FileUtil.ScanFiles().then((files) => {
              if (files) setBooks(files);
            });
          }
        });
      }
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right', 'top']}>
      <Text className="text-lg">Library</Text>
      {books.map((book, index) => (
        <Text key={index} className="text-base">
          {book}
        </Text>
      ))}
      {books.length === 0 && <Text variant={'body'}>No books found</Text>}
    </SafeAreaView>
  );
}
