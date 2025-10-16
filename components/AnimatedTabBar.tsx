// AnimatedTabBar.tsx
import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTabBar } from '~/context/TabBarContext';
import { MaterialTopTabBar } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnimatedTabBar(props: any) {
  const insets = useSafeAreaInsets();
  const { translateY, isVisible } = useTabBar();

  // const animatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ translateY: translateY.value }],
  // }));

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(isVisible.value ? insets.bottom + 70 : 0, { duration: 250 }), // collapse height
  }));

  return (
    <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
      <MaterialTopTabBar {...props} />
    </Animated.View>
  );
}
