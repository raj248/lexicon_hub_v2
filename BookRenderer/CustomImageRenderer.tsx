import { useWindowDimensions, Modal, Button, View } from 'react-native';
import React, { useState } from 'react';
import RenderHtml, { useInternalRenderer, InternalRendererProps } from 'react-native-render-html';
import * as FileSystem from 'expo-file-system';

type CustomImageRendererProps = {
  source: { uri: string };
  alt?: string;
};

export default function CustomImageRenderer(props: InternalRendererProps<any>) {
  const { Renderer, rendererProps } = useInternalRenderer('img', props);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onPress = () => setIsModalOpen(true);
  const onModalClose = () => setIsModalOpen(false);

  // Convert the epub-relative path to cached local file path
  let localUri = rendererProps.source.uri;
  // if (!localUri?.startsWith('http') && !localUri?.startsWith('file://')) {
  //   localUri = `file://${FileSystem.cacheDirectory}${localUri}`;
  // }
  localUri = 'https://placehold.co/600x400/EEE/31343C.png';
  const newSource = { ...rendererProps.source, uri: localUri };

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Renderer {...rendererProps} source={newSource} onPress={onPress} />
      <Modal visible={isModalOpen} onRequestClose={onModalClose} animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
          }}>
          <Renderer {...rendererProps} source={newSource} />
          <Button title="Close" onPress={onModalClose} />
        </View>
      </Modal>
    </View>
  );
}
