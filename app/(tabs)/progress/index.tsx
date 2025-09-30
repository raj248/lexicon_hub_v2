import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '~/components/Button';
import { Text } from '~/components/nativewindui/Text';
import * as FileUtil from '~/modules/FileUtil';

export default function Progress() {
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
