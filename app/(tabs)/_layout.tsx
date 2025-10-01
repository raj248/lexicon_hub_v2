import { Link } from 'expo-router';
import { HeaderButton } from '../../components/HeaderButton';
import { TabBarIcon } from '../../components/TabBarIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { Navigator } = createMaterialTopTabNavigator();

export const Tabs = withLayoutContext(Navigator);

const NoRippleButton = ({ children, onPress, style }: any) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={style}>
    {children}
  </TouchableOpacity>
);
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDarkColorScheme } = useColorScheme();

  return (
    <Tabs
      tabBarPosition="bottom"
      screenOptions={{
        tabBarPressColor: 'transparent', // removes ripple
        tabBarPressOpacity: 0.5,
        tabBarActiveTintColor: colors.foreground,
        tabBarShowLabel: false,
        tabBarStyle: {
          marginHorizontal: 10,
          borderRadius: 5,
          bottom: insets.bottom,
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
        sceneStyle: {
          // backgroundColor: 'green',
        },

        // tabBarIndicator: (props) => {
        //   const { position, state: navigationState, getTabWidth } = props;

        //   const width = 20;

        //   // interpolate the left position based on animated 'position'
        //   const translateX = position.interpolate({
        //     inputRange: navigationState.routes.map((_, i) => i),
        //     outputRange: navigationState.routes.map((_, i) => {
        //       const tabWidth = getTabWidth(i);
        //       console.log('Tab width:', tabWidth, 'i: ', i);
        //       const _tmp = (tabWidth - width) / 2 + i * tabWidth;
        //       console.log(_tmp);
        //       return _tmp;
        //     }),
        //   });
        //   console.log(translateX);
        //   return (
        //     <Animated.View
        //       style={{
        //         position: 'absolute',
        //         bottom: 0,
        //         width,
        //         height: 3,
        //         borderRadius: 2,
        //         backgroundColor: 'black',
        //         transform: [{ translateX }],
        //       }}
        //     />
        //   );
        // },
        // headerStyle: {
        //   backgroundColor: colors.background,
        //   elevation: 5, // Shadow for Android
        //   shadowColor: '#000', // Shadow for iOS
        //   shadowOpacity: 0.1,
        //   shadowRadius: 4,
        // },
      }}>
      <Tabs.Screen
        redirect
        name="index"
        options={{
          title: 'Index',
          tabBarIcon: ({ name, color }: { name: string; color: string }) => (
            <TabBarIcon name="code" color={color} />
          ),
          tabBarStyle: { display: 'none' },
          tabBarItemStyle: { display: 'none' },
        }}
      />

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
  );
}
