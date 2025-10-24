'use client';

import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Book, useBookStore } from '~/store/bookStore';
import { Text } from '~/components/nativewindui/Text';
import { getRandomBlurhash } from '~/utils/blurhash';
import Animated, {
  FadeInUp,
  LinearTransition,
  JumpingTransition,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
  FadeOut,
} from 'react-native-reanimated';
import { InteractionManager } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';
import { darkTheme, lightTheme } from '~/theme/theme';
import { useTabBar } from '~/context/TabBarContext';
import { FlashList as RNFlashList } from '@shopify/flash-list';
import scanAndAddBooks from '~/utils/scanAndAddBooks';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AnimatedFlashList = Animated.createAnimatedComponent(RNFlashList<any>);

const CoverImage = ({ uri }: { uri?: string }) => {
  const randomBlurhash = useMemo(() => (!uri ? getRandomBlurhash() : null), [uri]);

  // Add file:// prefix for local cache paths
  const sourceUri = uri ? (uri.startsWith('http') ? uri : `file://${uri}`) : undefined;

  return (
    <Image
      source={{ uri: sourceUri }}
      style={{ width: '100%', height: 220 }}
      contentFit="cover"
      cachePolicy="memory-disk"
      placeholder={{ blurhash: randomBlurhash ?? '' }}
    />
  );
};

export default function Library() {
  const { hide, show } = useTabBar();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      show(); // show tab bar on tab switch
    });

    return unsubscribe;
  }, [navigation, show]);

  const rawBooks = useBookStore((state) => state.books);
  const books = useMemo(
    () => Object.values(rawBooks).sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0)),
    [rawBooks]
  );

  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const { isDarkColorScheme } = useColorScheme();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Dummy refresh function: just wait 1s
    await scanAndAddBooks();
    setRefreshing(false);
    // setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // --- Responsive layout ---
  const CARD_MAX_WIDTH = 180; // px
  const CARD_MARGIN = 15; // horizontal margin
  const numColumns = Math.floor(width / (CARD_MAX_WIDTH + CARD_MARGIN));
  const cardWidth = Math.min(CARD_MAX_WIDTH, width / numColumns - CARD_MARGIN);

  const renderItem = useCallback(
    ({ item }: { item: Book }) => (
      <Animated.View
        key={item.id}
        sharedTransitionTag={`book-${item.id}`}
        layout={LinearTransition.springify().mass(0.4).damping(20).stiffness(180)}
        entering={FadeInUp.duration(250)}
        exiting={FadeOut.duration(200)}
        style={[
          {
            width: cardWidth,
            // margin: CARD_MARGIN / 2,
            alignContent: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}>
        <Pressable
          className="mb-2 pb-2"
          onLongPress={() => {
            console.log('long press');
          }}
          onPress={() => {
            const now = Date.now();
            // First: trigger shared layout animation
            ('worklet');
            useBookStore.getState().updateLastOpenedAt(item.id, now);
            // then navigate (slightly delayed)
            InteractionManager.runAfterInteractions(() => {
              setTimeout(() => {
                router.push({
                  pathname: '/view-book',
                  params: { bookId: item.id },
                });
              }, 150);
            });
          }}
          style={{
            backgroundColor: isDarkColorScheme
              ? darkTheme.colors.tertiaryContainer
              : lightTheme.colors.tertiaryContainer,
            width: '90%',
            height: 'auto',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            borderWidth: 1,
            borderColor: isDarkColorScheme
              ? darkTheme.colors.outlineVariant
              : lightTheme.colors.outlineVariant,
            // borderRadius: 8,
          }}>
          <CoverImage uri={item.coverImage} />
          <View style={{ flex: 1, height: 36, justifyContent: 'center' }}>
            <Text
              className="px-1 text-center font-semibold"
              variant={'footnote'}
              numberOfLines={2}
              ellipsizeMode="tail">
              {item.title}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    ),
    [cardWidth, isDarkColorScheme]
  );

  const lastY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // velocity not directly available on FlashList, so we check deltaY

      const y = event?.contentOffset?.y;
      if (y === null) return;
      if (y === undefined) return;

      const diff = y - lastY.value;
      if (diff < -5) {
        // scrolling up → show
        runOnJS(show)();
      } else if (diff > 5) {
        // scrolling down → hide
        runOnJS(hide)();
      }
      lastY.value = y;
    },
  });
  return (
    // <SafeAreaView
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: isDarkColorScheme
            ? darkTheme.colors.background
            : lightTheme.colors.background,
        }}
        // edges={['left', 'right', 'bottom']}
      >
        {books.length > 0 && (
          <AnimatedFlashList
            data={books}
            renderItem={renderItem}
            estimatedItemSize={cardWidth + 100}
            numColumns={numColumns}
            onScroll={scrollHandler}
            scrollEventThrottle={5}
            // pagingEnabled
            centerContent
            refreshing={refreshing}
            onRefresh={onRefresh}
            stickyHeaderHiddenOnScroll
            contentContainerStyle={{
              // padding: CARD_MARGIN / 2,
              paddingTop: insets.top,
            }}
            ListEmptyComponent={
              <View>
                <Text variant={'body'}>No books found</Text>
              </View>
            }
          />
        )}
        {books.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Text variant={'body'}>No books found</Text>
            <Button
              mode="contained-tonal"
              onPress={() => {
                scanAndAddBooks();
              }}>
              Scan for books
            </Button>
          </View>
        )}
      </View>
    </>
    // </SafeAreaView>
  );
}
