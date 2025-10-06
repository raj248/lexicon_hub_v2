// // return blank page
import { View } from 'react-native';
import { useEffect, useState } from 'react';
import { Book, useBookStore } from '~/store/bookStore';
import { parseOPFFromBook, prepareChapter } from '~/modules/FileUtil';
import { Stack, useLocalSearchParams } from 'expo-router';
import BookWebNavigator from '~/BookRenderer/BookWebNavigator';

export default function Three() {
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, string> | null>({});
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const { bookId } = useLocalSearchParams();

  useEffect(() => {
    if (!bookId) return;
    const tempBook = useBookStore
      .getState()
      .getBook('https://novelbin.com/b/my-vampire-system#tab-chapters-title');
    // .getBook('9780136885979');
    // .getBook('9781718500778');
    // .getBook('9798855406993');
    //   .getBook(bookId as string);
    if (tempBook) {
      setBook(tempBook);
      parseOPFFromBook(tempBook.path ?? '').then((result) => {
        prepareChapter(tempBook.path ?? '', result?.spine[9].href ?? '').then((html) => {
          setChapter(html);
          setBaseUrl(result?.baseDir ?? '');
        });
      });
    }
  }, [bookId]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: book?.title ?? 'E-Book',
        }}
      />

      <BookWebNavigator bookPath={book?.path ?? ''} />
    </View>
  );
}
