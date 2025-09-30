import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '~/components/Button';
import { Text } from '~/components/nativewindui/Text';
import { Image } from 'expo-image';

import { findOpfPath } from '~/epub-core/parsers/containerParser';
import { parseOPF } from '~/epub-core/parsers/opfParserXml';
import * as FileUtil from '~/modules/FileUtil';
import { getRandomBlurhash } from '~/utils/blurhash';
import scanAndAddBooks from '~/utils/scanAndAddBooks';
import Animated, { Easing, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';
import { Book } from '~/store/bookStore';

export default function Library() {
  const [books, setBooks] = useState<string[]>([]);
  const { colors } = useColorScheme();

  const CoverImage = memo(({ uri }: { uri?: string }) => {
    const randomBlurhash = useMemo(() => (uri ? null : getRandomBlurhash()), [uri]);
    return (
      <Image
        source={uri ? { uri } : undefined}
        style={{ width: '100%', height: 220, borderRadius: 8 }}
        contentFit="cover"
        cachePolicy="memory-disk"
        placeholder={randomBlurhash ? { blurhash: randomBlurhash } : undefined}
      />
    );
  });
  const renderItem = useCallback(
    ({ item }: { item: Book }) => (
      <Animated.View
        layout={LinearTransition.springify()}
        entering={FadeInUp.delay(200).duration(400).easing(Easing.sin)}>
        <Pressable
          className="rounded-lg p-2"
          // onPress={() => router.push(`/bookDetails?bookId=${item.id}`)}
          style={{ backgroundColor: colors.card, width: '100%', height: 270 }}>
          <CoverImage uri={item.coverImage} />
          <View style={{ height: 36, justifyContent: 'center' }}>
            <Text className="px-1 text-center text-xs" numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    ),
    [colors.card, router]
  );
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

  const handleBegin = async () => {
    FileUtil.RequestStoragePermission();
    books.map((book) => {
      console.log('book', book);
      findOpfPath(book).then(async (opfPath) => {
        if (opfPath) {
          // console.log('opfPath', opfPath);
          const opfFile = await FileUtil.readFileFromZip(book, opfPath);
          //   console.log('opfFile', opfFile);
          parseOPF(opfFile, opfPath).then((data) => {
            // console.log('data', data);
            console.log(
              'data.metadata',
              data.metadata.coverImage ??
                data.metadata.title + (data.metadata.coverImage ?? 'undefined')
            );
          });
        }
      });
    });
  };

  const scan = () => {
    FileUtil.RequestStoragePermission();
    scanAndAddBooks();
  };

  const opf = async () => {
    const i = 3;
    console.log('opf', books[i]);
    findOpfPath(books[i]).then(async (opfPath) => {
      console.log('opfPath', opfPath);
      if (opfPath) {
        const opfFile = await FileUtil.readFileFromZip(books[i], opfPath);
        parseOPF(opfFile, opfPath).then((data) => {
          console.log('data', data.metadata);
        });
      }
    });
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
          handleBegin();
        }}
      />
      <Button
        title="Start Scan"
        onPress={() => {
          scan();
        }}
      />
      <Button
        title="get opf"
        onPress={() => {
          opf();
        }}
      />
    </SafeAreaView>
  );
}
