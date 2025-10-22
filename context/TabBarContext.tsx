// TabBarContext.tsx
import React, { createContext, useContext, useRef } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as NavigationBar from 'expo-navigation-bar';

const TabBarContext = createContext<any>(null);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(0); // 0 = visible
  const isVisible = useSharedValue(true);

  const hide = () => {
    if (!isVisible.value) return;
    // translateY.value = withTiming(100, { duration: 250 }); // slide out
    NavigationBar.setVisibilityAsync('hidden');
    isVisible.value = false;
  };
  const show = () => {
    if (isVisible.value) return;
    // translateY.value = withTiming(0, { duration: 250 }); // slide in
    NavigationBar.setVisibilityAsync('visible');
    isVisible.value = true;
  };

  return (
    <TabBarContext.Provider value={{ translateY, isVisible, hide, show }}>
      {children}
    </TabBarContext.Provider>
  );
}

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) throw new Error('useTabBar must be used within a TabBarProvider');
  return context;
};
