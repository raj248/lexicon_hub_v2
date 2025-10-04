import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FileUtilView } from '~/modules/FileUtil';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Tab Two' }} />
      <View style={styles.container}>
        <FileUtilView
          url="file:///data/user/0/com.hub.lexicon/cache/I’m the Evil Lord of an Intergalactic Empire! - Volume 08/OEBPS/Text/CoverPage.html"
          onLoad={() => console.log('loaded')}
          style={{ flex: 1 }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
