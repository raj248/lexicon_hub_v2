import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useColorScheme } from '~/lib/useColorScheme';

type BridgeEvent =
  | { type: 'imageClick'; [key: string]: any }
  | { type: 'progress'; [key: string]: any }
  | { type: 'tap' }
  | { type: 'swipe-end'; direction: 'left' | 'right' }
  | { type: 'bridgeReady' }
  | { type: string; [key: string]: any };

interface UseWebViewBridgeProps {
  onImageTap?: (data: any) => void;
  onProgress?: (data: any) => void;
  onSwipeEnd?: (direction: 'left' | 'right') => void;
  onBridgeReady?: () => void;
  onTap?: () => void;
}

export function useWebViewBridge({
  onImageTap,
  onProgress,
  onSwipeEnd,
  onBridgeReady,
  onTap,
}: UseWebViewBridgeProps) {
  const { colors, isDarkColorScheme } = useColorScheme();
  const [fullscreen, setFullscreen] = useState(false);
  const lastSwipeTime = useRef(0);

  // Toggle fullscreen (StatusBar + NavigationBar)
  const toggleFullscreen = useCallback(() => {
    setFullscreen((prev) => {
      const next = !prev;
      StatusBar.setHidden(next, 'fade');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setVisibilityAsync(next ? 'hidden' : 'visible');
      onTap?.(); // call optional tap callback
      return next;
    });
  }, [onTap]);

  // Handle messages from WebView
  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data: BridgeEvent = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case 'imageClick':
            console.log('imageClick', data);
            onImageTap?.(data);
            break;

          case 'progress':
            console.log('progress', data);
            onProgress?.(data);
            break;

          case 'tap':
            console.log('tap detected');
            toggleFullscreen();
            break;

          case 'swipe-end': {
            const now = Date.now();
            if (now - lastSwipeTime.current < 500) return; // debounce
            lastSwipeTime.current = now;
            console.log('swipe-end', data.direction);
            onSwipeEnd?.(data.direction);
            break;
          }

          case 'bridgeReady':
            console.log('Bridge ready');
            onBridgeReady?.();
            break;

          default:
            console.warn('Unknown message from WebView:', data);
        }
      } catch (e) {
        console.warn('Invalid message from WebView', e);
      }
    },
    [onImageTap, onProgress, onSwipeEnd, onBridgeReady, toggleFullscreen]
  );

  return {
    fullscreen,
    toggleFullscreen,
    handleMessage,
  };
}
