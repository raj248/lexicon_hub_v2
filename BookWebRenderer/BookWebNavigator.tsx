import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
  DrawerItem,
} from '@react-navigation/drawer';
import { useEffect, useState } from 'react';
import BookPager from '../BookRenderer/BookPager';
// import BookPager from './BookPagerWindow';
import { parseOPFFromBook } from '~/modules/FileUtil';
import { OPFData } from '~/epub-core/types';
import ChapterView from '~/BookWebRenderer/WebReaderStatic';

import { LegendList, LegendListRef, LegendListRenderItemProps } from '@legendapp/list';
import { FlatList } from 'react-native-gesture-handler';
import BookWebPager from './BookWebPager';

const Drawer = createDrawerNavigator();

export default function BookWebNavigator({ bookPath }: { bookPath: string }) {
  const [selectedChapter, setSelectedChapter] = useState(12);
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
      //   drawerContent={(props) => (
      //     <DrawerContentScrollView {...props}>
      //       {bookData?.spine.map((ch, index) => (
      //         <DrawerItem
      //           focused={selectedChapter === index}
      //           key={index}
      //           label={`Chapter ${index + 1}`}
      //           onPress={() => {
      //             setSelectedChapter(index);
      //             props.navigation.closeDrawer(); // close drawer after selecting
      //           }}
      //         />
      //       ))}
      //     </DrawerContentScrollView>
      //   )}

      //   drawerContent={(props) => (
      //     <DrawerContentScrollView {...props}>
      //       {bookData ? (
      //         <LegendList
      //           data={bookData.spine}
      //           renderItem={({ item, index }) => (
      //             <DrawerItem
      //               key={index}
      //               focused={selectedChapter === index}
      //               label={`Chapter ${index + 1}`}
      //               onPress={() => {
      //                 setSelectedChapter(index);
      //                 props.navigation.closeDrawer();
      //               }}
      //             />
      //           )}
      //         />
      //       ) : null}
      //     </DrawerContentScrollView>
      //   )}

      // drawerContent={(props) => (
      //   <DrawerContentScrollView {...props}>
      //     {bookData ? (
      //       <FlatList
      //         data={bookData.spine}
      //         renderItem={({ item, index }) => (
      //           <DrawerItem
      //             key={index}
      //             focused={selectedChapter === index}
      //             label={`Chapter ${index + 1}`}
      //             onPress={() => {
      //               setSelectedChapter(index);
      //               props.navigation.closeDrawer();
      //             }}
      //           />
      //         )}
      //       />
      //     ) : null}
      //   </DrawerContentScrollView>
      // )}
    >
      <Drawer.Screen name="Book">
        {(props) => (
          <ChapterView bookPath={bookPath} index={selectedChapter} setIndex={setSelectedChapter} />
          // <BookWebPager
          //   bookPath={bookPath}
          //   chapters={bookData?.spine.map((ch) => ch.href) ?? []}
          //   initialIndex={selectedChapter}
          // />
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
