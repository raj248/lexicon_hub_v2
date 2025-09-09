import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/nativewindui/Text';
import FileUtilModule from '~/modules/FileUtil/src/FileUtilModule';
export default function Library() {
  FileUtilModule.RequestStoragePermission();
  const [books, setBooks] = useState<string[]>([]);
  FileUtilModule.ScanFiles().then((files) => {
    if (files) setBooks(files);
  });
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Text className="text-lg">Library</Text>
      {books.map((book, index) => (
        <Text key={index} className="text-base">
          {book}
        </Text>
      ))}
    </SafeAreaView>
  );
}
