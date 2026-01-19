'use client';

import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, useWindowDimensions, InteractionManager } from 'react-native';
import { Image } from 'expo-image';
import { Book, useBookStore } from '~/store/bookStore';
import { Text } from '~/components/nativewindui/Text';
import { getRandomBlurhash } from '~/utils/blurhash';
import Animated, {
  FadeInUp,
  LinearTransition,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
  FadeOut,
} from 'react-native-reanimated';
import { useColorScheme } from '~/lib/useColorScheme';
import { darkTheme, lightTheme } from '~/theme/theme';
import { useTabBar } from '~/context/TabBarContext';
import { FlashList as RNFlashList } from '@shopify/flash-list';
import scanAndAddBooks from '~/utils/scanAndAddBooks';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AnimatedFlashList = Animated.createAnimatedComponent(RNFlashList<any>);

// --- Layout Configuration ---
const SCREEN_MARGIN = 16; // The padding at the very edges of the screen
const ITEM_GAP = 12; // The space between book cards

const CoverImage = ({ uri }: { uri?: string }) => {
  const randomBlurhash = useMemo(() => (!uri ? getRandomBlurhash() : null), [uri]);
  const sourceUri = uri ? (uri.startsWith('http') ? uri : `file://${uri}`) : undefined;

  return (
    <Image
      source={{ uri: sourceUri }}
      style={{
        width: '100%',
        aspectRatio: 2 / 3,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
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
  const { width } = useWindowDimensions();
  const { isDarkColorScheme } = useColorScheme();

  // Determine columns based on width
  const numColumns = useMemo(() => {
    if (width > 1024) return 6;
    if (width > 768) return 4;
    if (width > 480) return 3;
    return 2;
  }, [width]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', show);
    return unsubscribe;
  }, [navigation, show]);

  const rawBooks = useBookStore((state) => state.books);
  const books = useMemo(
    () => Object.values(rawBooks).sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0)),
    [rawBooks]
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await scanAndAddBooks();
    setRefreshing(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Book }) => (
      <Animated.View
        entering={FadeInUp.duration(250)}
        exiting={FadeOut.duration(200)}
        layout={LinearTransition.springify().mass(0.4)}
        style={{
          flex: 1,
          // We use padding on the item to create the "gap"
          paddingHorizontal: ITEM_GAP / 2,
          marginBottom: ITEM_GAP,
        }}>
        <Pressable
          onPress={() => {
            useBookStore.getState().updateLastOpenedAt(item.id, Date.now());
            InteractionManager.runAfterInteractions(() => {
              router.push({ pathname: '/view-book', params: { bookId: item.id } });
            });
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
            backgroundColor: isDarkColorScheme
              ? darkTheme.colors.tertiaryContainer
              : lightTheme.colors.tertiaryContainer,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDarkColorScheme
              ? darkTheme.colors.outlineVariant
              : lightTheme.colors.outlineVariant,
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          })}>
          <CoverImage uri={item.coverImage} />
          <View style={{ padding: 8, height: 44, justifyContent: 'center' }}>
            <Text className="text-center font-semibold" variant="footnote" numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    ),
    [isDarkColorScheme]
  );

  const lastY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const diff = y - lastY.value;
      if (y > 50 && diff > 10) runOnJS(hide)();
      if (diff < -10 || y < 50) runOnJS(show)();
      lastY.value = y;
    },
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkColorScheme
          ? darkTheme.colors.background
          : lightTheme.colors.background,
      }}>
      {books.length > 0 ? (
        <AnimatedFlashList
          data={books}
          renderItem={renderItem}
          key={numColumns} // Force re-draw when column count changes
          numColumns={numColumns}
          estimatedItemSize={250}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            // Math: Screen Margin - half the internal gap = perfect alignment
            paddingHorizontal: SCREEN_MARGIN - ITEM_GAP / 2,
            paddingTop: insets.top + 10,
            paddingBottom: 100,
          }}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <Text variant="body">No books found</Text>
          <Button mode="contained-tonal" onPress={scanAndAddBooks}>
            Scan for books
          </Button>
        </View>
      )}
    </View>
  );
}
