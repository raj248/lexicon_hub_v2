import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import RenderHtml, {
  useInternalRenderer,
  useRendererProps,
  InternalRendererProps,
} from 'react-native-render-html';
import Modal from 'react-native-modal';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

// Module augmentation
declare module 'react-native-render-html' {
  interface RenderersProps {
    // @ts-ignore
    img?: {
      customOnPress?: (uri: string) => void;
    };
  }
}

// Modal content wrapped with gestureHandlerRootHOC
const ZoomModalContent = gestureHandlerRootHOC(
  ({ uri, onClose }: { uri: string; onClose: () => void }) => (
    <View style={styles.modalContainer}>
      {/* Close cross */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Image zoom */}
      <ImageZoom
        uri={uri}
        minScale={0.5}
        maxScale={3}
        doubleTapScale={2}
        isSingleTapEnabled
        isDoubleTapEnabled
        style={{ width, height }}
      />
    </View>
  )
);

export default function CustomImageRenderer(props: InternalRendererProps<any>) {
  const { Renderer, rendererProps: baseRendererProps } = useInternalRenderer('img', props);
  // @ts-ignore
  const rendererProps = useRendererProps('img', props);

  const [isViewerVisible, setViewerVisible] = useState(false);

  const onPress = () => {
    // @ts-ignore
    if (rendererProps.customOnPress) rendererProps.customOnPress(baseRendererProps.source.uri);
    setViewerVisible(true);
  };

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Renderer {...baseRendererProps} onPress={onPress} />

      <Modal
        isVisible={isViewerVisible}
        style={{ margin: 0, width }}
        onBackdropPress={() => setViewerVisible(false)}
        onBackButtonPress={() => setViewerVisible(false)}>
        {baseRendererProps.source.uri && (
          <ZoomModalContent
            uri={baseRendererProps.source.uri}
            onClose={() => setViewerVisible(false)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    width,
    height,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: 'bold',
  },
});
