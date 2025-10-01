'use client';

import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Book, useBookStore } from '~/store/bookStore';
import { Text } from '~/components/nativewindui/Text';
import { getRandomBlurhash } from '~/utils/blurhash';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';
import { InteractionManager } from 'react-native';

const CoverImage = ({ uri }: { uri?: string }) => {
  const randomBlurhash = useMemo(() => (!uri ? getRandomBlurhash() : null), [uri]);

  // Add file:// prefix for local cache paths
  const sourceUri = uri ? (uri.startsWith('http') ? uri : `file://${uri}`) : undefined;

  return (
    <Image
      source={{ uri: sourceUri }}
      style={{ width: '100%', height: 220, borderRadius: 8 }}
      contentFit="cover"
      cachePolicy="memory-disk"
      placeholder={{ blurhash: randomBlurhash ?? '' }}
    />
  );
};

export default function Library() {
  const books = useBookStore((state) => Object.values(state.books));
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Dummy refresh function: just wait 1s
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Book }) => (
      <Animated.View
        layout={LinearTransition.springify()}
        entering={FadeInUp.delay(100).duration(300)}>
        <Pressable
          className="rounded-lg p-2"
          onPress={() =>
            InteractionManager.runAfterInteractions(
              () => {}
              // router.push(`/bookDetails?bookId=${item.id}`)
            )
          }
          style={{
            backgroundColor: '#fff',
            width: '100%',
            height: 270,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}>
          <CoverImage uri={item.coverImage} />
          <View style={{ height: 36, justifyContent: 'center' }}>
            <Text className="px-1 text-center text-xs" numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    ),
    []
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
      <FlashList
        data={books}
        renderItem={renderItem}
        estimatedItemSize={280}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12 }}
      />
    </SafeAreaView>
  );
}
