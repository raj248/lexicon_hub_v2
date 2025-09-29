import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '~/components/Button';
import { Text } from '~/components/nativewindui/Text';
import { findOpfPath } from '~/epub-core/parsers/containerParser';
import { parseOPF } from '~/epub-core/parsers/opfParserXml';
import * as FileUtil from '~/modules/FileUtil';
import scanAndAddBooks from '~/utils/scanAndAddBooks';

export default function Library() {
  const [books, setBooks] = useState<string[]>([]);
  useEffect(() => {
    FileUtil.RequestStoragePermission();
    FileUtil.checkFilePermission().then((granted) => {
      console.log('checkFilePermission', granted);
      if (granted) {
        FileUtil.ScanFiles().then((files) => {
          if (files) setBooks(files);
        });
      } else {
        console.log('RequestStoragePermission');
        FileUtil.RequestStoragePermission().then((granted) => {
          console.log('RequestStoragePermission', granted);
          if (granted) {
            FileUtil.ScanFiles().then((files) => {
              if (files) setBooks(files);
            });
          }
        });
      }
    });
  }, []);

  const handle = async () => {
    FileUtil.RequestStoragePermission();
    books.map((book) => {
      console.log('book', book);
      findOpfPath(book).then(async (opfPath) => {
        if (opfPath) {
          // console.log('opfPath', opfPath);
          const opfFile = await FileUtil.readFileFromZip(book, opfPath);
          //   console.log('opfFile', opfFile);
          parseOPF(opfFile).then((data) => {
            console.log('data', data);
          });
        }
      });
    });
    scanAndAddBooks();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right', 'top']}>
      <Text className="text-lg">Library</Text>
      {/* {books.map((book, index) => (
        <Text key={index} className="text-base">
          {book}
        </Text>
      ))} */}
      <Text>{books.length} books found</Text>
      {books.length === 0 && <Text variant={'body'}>No books found</Text>}
      <Button
        title="Begin"
        onPress={() => {
          handle();
        }}
      />
    </SafeAreaView>
  );
}
