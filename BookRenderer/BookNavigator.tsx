import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { useState } from 'react';
import { View, Text } from 'react-native';
import BookPager from './BookPager';

const Drawer = createDrawerNavigator();

export default function BookNavigator({ chapters }: { chapters: string[] }) {
  const [selectedChapter, setSelectedChapter] = useState(0);

  return (
    <Drawer.Navigator
      initialRouteName="Book"
      screenOptions={{
        drawerType: 'slide',
        drawerPosition: 'right',
        headerShown: false,
      }}
      drawerContent={(props) => (
        <DrawerContentScrollView {...props}>
          {chapters.map((ch, index) => (
            <DrawerItem
              key={index}
              label={`Chapter ${index + 1}`}
              onPress={() => {
                setSelectedChapter(index);
                props.navigation.closeDrawer(); // close drawer after selecting
              }}
            />
          ))}
        </DrawerContentScrollView>
      )}>
      <Drawer.Screen name="Book">
        {(props) => (
          <BookPager
            {...props}
            chapters={chapters}
            initialIndex={selectedChapter} // 👈 pass down controlled index
          />
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
