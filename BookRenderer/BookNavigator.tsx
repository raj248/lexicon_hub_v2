import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { useEffect, useState } from 'react';
import BookPager from './BookPager';
import { parseOPFFromBook } from '~/modules/FileUtil';
import { OPFData } from '~/epub-core/types';

const Drawer = createDrawerNavigator();

export default function BookNavigator({ bookPath }: { bookPath: string }) {
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [bookData, setBookData] = useState<OPFData | null>(null);

  useEffect(() => {
    if (!bookPath) return;
    parseOPFFromBook(bookPath).then((result) => {
      setBookData(result);
      console.log('Parsed book data: ', result?.metadata);
    });
  }, [bookPath]);

  if (!bookPath) return null;

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
          {bookData?.spine.map((ch, index) => (
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
            bookPath={bookPath}
            chapters={bookData?.spine.map((ch) => ch.href) ?? []}
            initialIndex={selectedChapter} // 👈 pass down controlled index
          />
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
