import { useWindowDimensions, Modal, Button, View } from 'react-native';
import React, { useState } from 'react';
import RenderHtml, {
  useInternalRenderer,
  useRendererProps,
  InternalRendererProps,
  RenderersProps,
} from 'react-native-render-html';

// Step 1: Module augmentation to extend the types for your custom props
declare module 'react-native-render-html' {
  interface RenderersProps {
    img?: {
      customOnPress?: (uri: string) => void;
    };
  }
}

// Step 2: Your custom renderer
export default function CustomImageRenderer(props: InternalRendererProps<any>) {
  const { Renderer, rendererProps: baseRendererProps } = useInternalRenderer('img', props);

  // Step 3: Merge passed custom props
  const rendererProps = useRendererProps('img', props);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const onPress = () => {
    if (rendererProps.customOnPress) {
      rendererProps.customOnPress(baseRendererProps.source.uri);
    } else {
      setIsModalOpen(true);
    }
  };
  const onModalClose = () => setIsModalOpen(false);

  // For demo: just override URI
  const newSource = {
    ...baseRendererProps.source,
    uri: 'https://placehold.co/600x400/EEE/31343C.png',
  };

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Renderer {...baseRendererProps} source={newSource} onPress={onPress} />
      <Modal visible={isModalOpen} onRequestClose={onModalClose} animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
          }}>
          <Renderer {...baseRendererProps} source={newSource} />
          <Button title="Close" onPress={onModalClose} />
        </View>
      </Modal>
    </View>
  );
}
