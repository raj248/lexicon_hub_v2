import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { useTabBar } from '~/context/TabBarContext';
export type Props = {
  chapters: Array<{ id: string; title: string }>;
  onChapterPress: (event: { nativeEvent: { id: string; title: string } }) => void;
};

export default function ChapterListScreen() {
  const { hide, show } = useTabBar();

  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      show(); // show tab bar on tab switch
    });

    return unsubscribe;
  }, [navigation, show]);

  return (
    <View className="flex-1 items-center justify-center">
      <Text variant={'heading'}>Settings</Text>
      <Text variant="callout">Your settings will be displayed here</Text>
    </View>
  );
}
