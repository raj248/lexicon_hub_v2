import { createDrawerNavigator } from '@react-navigation/drawer';
import { useEffect, useMemo, useState } from 'react';
import { ChapterListView, parseOPFFromBook } from '~/modules/FileUtil';
import { OPFData } from '~/epub-core/types';
import ChapterView from '~/BookWebRenderer/WebReaderStatic';

import React from 'react';

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
  const MemoChapterView = React.memo(ChapterView);

  const chapters = useMemo(() => {
    return (
      bookData?.spine.map((ch) => ({
        id: ch.id,
        title: ch.href,
      })) ?? []
    );
  }, [bookData]);

  if (!bookPath) return null;

  console.log('Chapters: ', chapters);
  return (
    <Drawer.Navigator
      initialRouteName="Book"
      screenOptions={{
        drawerType: 'front',
        drawerPosition: 'right',
        headerShown: false,
      }}
      drawerContent={(props) => (
        <ChapterListView
          style={{ flex: 1 }}
          chapters={chapters ?? []}
          onChapterPress={(event: any) => console.log(event.nativeEvent)}
        />
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
