import { router, useNavigation } from 'expo-router';
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
import { Book, useBookStore } from '~/store/bookStore';
import { exploreCache } from '~/utils/exploreCache';
import { useTabBar } from '~/context/TabBarContext';

export default function Library() {
  const { hide, show } = useTabBar();
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      show(); // show tab bar on tab switch
    });

    return unsubscribe;
  }, [navigation, show]);

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
    FileUtil.ScanFiles().then((files) => {
      if (files) setBooks(files);
    });

    if (!books.length) {
      console.log('No books to process');
      return;
    }

    const startTime = performance.now();
    const lapTimes: number[] = []; // store each book's lap time
    let lap = performance.now();

    await Promise.all(
      books.map(async (book) => {
        const currentLap = performance.now();
        // console.log('Processing book:', book);

        try {
          const opfPath = await findOpfPath(book);
          if (!opfPath) {
            console.log('No OPF found for', book);
            return;
          }

          const opfFile = await FileUtil.readFileFromZip(book, opfPath);
          const data = await parseOPF(opfFile, opfPath);

          const lapTime = performance.now() - lap;
          lapTimes.push(lapTime);

          console.log(
            'Book metadata:',
            data.metadata.title,
            data.metadata.coverImage ?? data.metadata.title + ' (no cover)',
            '| Lap Time:',
            lapTime.toFixed(2),
            'ms'
          );

          lap = performance.now();
        } catch (err) {
          console.warn('Error processing book', book, err);
        }
      })
    );

    // Compute min, max, avg
    if (lapTimes.length > 0) {
      const min = Math.min(...lapTimes);
      const max = Math.max(...lapTimes);
      const avg = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;

      console.log(
        `📊 Lap stats — min: ${min.toFixed(2)} ms, max: ${max.toFixed(2)} ms, avg: ${avg.toFixed(
          2
        )} ms`
      );
    }

    console.log('✅ Total handleBegin time:', (performance.now() - startTime).toFixed(2), 'ms');
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

  const testModule = async () => {
    FileUtil.RequestStoragePermission();
    const startTime = performance.now();
    const result = await FileUtil.parseOPFFromBook(books[0]);
    // books.map(async (book) => {
    //   const result = await FileUtil.parseOPFFromBook(book);
    //   console.log('result', result.metadata.title, result.metadata.coverImage);
    // });

    books.map((book) => {
      FileUtil.parseOPFFromBook(book).then((result) => {
        console.log(
          'result',
          // result.metadata.title,
          // result?.metadata.coverImage ?? result?.metadata.title + ' (no cover)'
          result?.metadata.title,
          result?.metadata.identifier
        );
        // console.log('result', result?.spine);
      });
    });

    console.log('✅ Total testModule time:', (performance.now() - startTime).toFixed(2), 'ms');
  };

  const testLegacy = async () => {
    const startTime = performance.now();
    const path = await findOpfPath(books[0]);
    console.log('path', path);
    if (!path) {
      console.log('No OPF found for', books[0]);
      return;
    }
    const opfFile = await FileUtil.readFileFromZip(books[0], path);
    const data = await parseOPF(opfFile, path);
    console.log('data', data.metadata.coverImage ?? data.metadata.title + ' (no cover)');
    console.log('✅ Total testModule time:', (performance.now() - startTime).toFixed(2), 'ms');
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
      <Button
        title="clear all books"
        onPress={() => {
          useBookStore.getState().debugClear();
        }}
      />
      <Button
        title="test module"
        onPress={() => {
          FileUtil.parseOPFFromBook(books[0]).then((result) => {
            console.log('result', result);
          });
        }}
      />

      <Button
        title="test module (timed)"
        onPress={() => {
          testModule();
        }}
      />

      <Button
        title="test legacy (timed)"
        onPress={() => {
          testLegacy();
        }}
      />
      <Button
        title="Explore cache"
        onPress={() => {
          exploreCache();
        }}
      />
    </SafeAreaView>
  );
}
