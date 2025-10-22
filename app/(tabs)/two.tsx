import { View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
export type Props = {
  chapters: Array<{ id: string; title: string }>;
  onChapterPress: (event: { nativeEvent: { id: string; title: string } }) => void;
};

export default function ChapterListScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text variant={'heading'}>Settings</Text>
      <Text variant="callout">Your settings will be displayed here</Text>
    </View>
  );
}
