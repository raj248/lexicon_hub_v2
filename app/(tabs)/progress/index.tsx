import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '~/components/Button';
import { Text } from '~/components/nativewindui/Text';
import { useTabBar } from '~/context/TabBarContext';
import * as FileUtil from '~/modules/FileUtil';

export default function Progress() {
  const { hide, show } = useTabBar();
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      show(); // show tab bar on tab switch
    });

    return unsubscribe;
  }, [navigation, show]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Text className="text-lg">Progress</Text>
      <Button
        title="Test Module"
        onPress={() => {
          FileUtil.RequestStoragePermission();
          console.log('Test Module');
        }}></Button>
    </SafeAreaView>
  );
}
