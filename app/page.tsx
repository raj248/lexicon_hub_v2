// return blank page
import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { Book, useBookStore } from '~/store/bookStore';
import { parseOPFFromBook, prepareChapter } from '~/modules/FileUtil';
import ChapterView from '~/components/RenderChapter';
import BookNavigator from '~/BookRenderer/BookNavigator';
import BookPager from '~/BookRenderer/BookPager';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function Reader() {
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, string> | null>({});
  const { bookId } = useLocalSearchParams();
  useEffect(() => {
    if (!bookId) return;
    const tempBook = useBookStore
      .getState()
      // .getBook('https://novelbin.com/b/my-vampire-system#tab-chapters-title');
      // .getBook('9780136885979');
      // .getBook('9781718500778');
      // .getBook('9798855406993');
      .getBook(bookId as string);
    if (tempBook) {
      // console.log('Loading book: ', tempBook?.path);
      setBook(tempBook);
      // parseOPFFromBook(tempBook.path ?? '').then((result) => {
      //   result?.spine.map((chapter) => {
      //     prepareChapter(tempBook.path ?? '', chapter.href ?? '').then((html) => {
      //       // console.log('html', html);
      //       // setChapter(html);
      //       setChapters((prev) => ({ ...prev, [chapter.id ?? '-1']: html }));
      //     });
      //   });
      // });
    }
    // console.log('html');
  }, [bookId]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: book?.title ?? 'E-Book',
        }}
      />

      {/* <Text>Reader Screen</Text> */}
      {/* {book && <Text>Book: {book.title}</Text>} */}
      {/* {chapter && <ChapterView filePath={chapter} />} */}
      <BookNavigator bookPath={book?.path ?? ''} />
      {/* <BookPager chapters={Object.values(chapters ?? {})} /> */}
    </View>
  );
}
