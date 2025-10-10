import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
  DrawerItem,
} from '@react-navigation/drawer';
import { Text } from '~/components/nativewindui/Text';
import { useEffect, useState } from 'react';
import BookPager from '../BookRenderer/BookPager';
// import BookPager from './BookPagerWindow';
import { parseOPFFromBook } from '~/modules/FileUtil';
import { OPFData } from '~/epub-core/types';
import ChapterView from '~/BookWebRenderer/WebReaderStatic';

import { LegendList, LegendListRef, LegendListRenderItemProps } from '@legendapp/list';
import { FlatList } from 'react-native-gesture-handler';
import BookWebPager from './BookWebPager';
import React from 'react';
import BigList, { BigListItem } from 'react-native-big-list';
import { List } from 'react-native-paper';

const Drawer = createDrawerNavigator();

const renderItem = ({ item }: { item: any }) => {
  return (
    <List.Item
      title={item.href}
      // description={item.description}
      // style={}
      left={(props) => <List.Icon {...props} icon="box" />}
    />
  );
};

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
  const MemoChapterView = React.memo(ChapterView);

  if (!bookPath) return null;

  return (
    <Drawer.Navigator
      initialRouteName="Book"
      screenOptions={{
        drawerType: 'front',
        drawerPosition: 'right',
        headerShown: false,
      }}
      drawerContent={(props) => (
        <DrawerContentScrollView {...props}>
          {bookData ? (
            <BigList
              data={bookData.spine}
              itemHeight={50}
              renderItem={({ item, index }) => (
                // <DrawerItem
                //   key={index}
                //   focused={selectedChapter === index}
                //   label={`Chapter ${index + 1}`}
                //   onPress={() => {
                //     setSelectedChapter(index);
                //     props.navigation.closeDrawer();
                //   }}
                // />
                // <BigListItem height={50} key={index} children={<Text>{item.href}</Text>} />
                <Text>{item.href}</Text>
              )}
              // renderItem={renderItem}
              renderFooter={undefined}
              renderHeader={undefined}
            />
          ) : null}
        </DrawerContentScrollView>
      )}>
      <Drawer.Screen name="Book">
        {(props) => (
          <MemoChapterView
            bookPath={bookPath}
            index={selectedChapter}
            setIndex={setSelectedChapter}
          />
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
