import { Link } from 'expo-router';
import { HeaderButton } from '../../components/HeaderButton';
import { TabBarIcon } from '../../components/TabBarIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { TouchableOpacity } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { TabBarProvider } from '~/context/TabBarContext';
import AnimatedTabBar from '~/components/AnimatedTabBar';

const { Navigator } = createMaterialTopTabNavigator();

export const Tabs = withLayoutContext(Navigator);

const NoRippleButton = ({ children, onPress, style }: any) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={style}>
    {children}
  </TouchableOpacity>
);

export default function TabLayout() {
  const { colors, isDarkColorScheme } = useColorScheme();
  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden'); // hide
    return () => {
      NavigationBar.setVisibilityAsync('visible'); // restore on exit
    };
  }, []);
  return (
    <TabBarProvider>
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        tabBarPosition="bottom"
        screenOptions={{
          tabBarPressColor: 'transparent', // removes ripple
          tabBarPressOpacity: 0.5,
          tabBarActiveTintColor: colors.foreground,
          tabBarShowLabel: false,
          tabBarStyle: {
            marginHorizontal: 10,
            borderRadius: 5,
            backgroundColor: isDarkColorScheme ? '#0b0220' : '#b4c1f8',
            elevation: 5,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          swipeEnabled: true,
          tabBarShowIcon: true,
          tabBarLabelStyle: {
            fontSize: 12,
            color: isDarkColorScheme ? 'white' : 'black',
          },

          tabBarIndicatorContainerStyle: {
            borderRadius: 15,
          },
          tabBarIndicatorStyle: {
            backgroundColor: isDarkColorScheme ? '#4361ee' : '#f72585',
          },

          animationEnabled: true,
          tabBarBounces: true,
        }}
        onTabSelect={({ index }) => {
          console.log(index);
        }}>
        <Tabs.Screen
          name="library/index"
          options={{
            title: 'Library',
            tabBarIcon: ({ name, color }: { name: string; color: string }) => (
              <TabBarIcon name="code" color={color} />
            ),
            headerRight: () => (
              <Link href="/modal" asChild>
                <HeaderButton />
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="progress/index"
          options={{
            title: 'Progress',
            tabBarIcon: ({ name, color }: { name: string; color: string }) => (
              <TabBarIcon name="code" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: 'Tab three',
            tabBarIcon: ({ name, color }: { name: string; color: string }) => (
              <TabBarIcon name="code" color={color} />
            ),
          }}
        />
      </Tabs>
    </TabBarProvider>
  );
}
