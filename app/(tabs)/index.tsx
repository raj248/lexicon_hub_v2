// app/(tabs)/index.tsx
import { View } from '@rn-primitives/slot';
import { Redirect } from 'expo-router';
import { Text } from '~/components/nativewindui/Text';

export default function TabsIndex() {
  // return <Redirect href="./library/index" />;
  // return <Redirect href="/(tabs)/library/index" />;
  return (
    <View>
      <Text>TabsIndex</Text>
    </View>
  );
}
