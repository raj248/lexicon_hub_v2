// return blank page
import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { Book, useBookStore } from '~/store/bookStore';
import { parseOPFFromBook, prepareChapter } from '~/modules/FileUtil';
import ChapterView from '~/BookRenderer/ChapterView/RenderChapter';

export default function Reader() {
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [processed_chapter, setProcessedChapter] = useState<string | null>(null);

  useEffect(() => {
    const tempBook = useBookStore.getState().getBook('9781718500778');
    if (tempBook) {
      console.log('Loading book: ', tempBook?.path);
      setBook(tempBook);
      parseOPFFromBook(tempBook.path ?? '').then((result) => {
        setChapter(result?.spine[1].href ?? '');
        prepareChapter(tempBook.path ?? '', result?.spine[1].href ?? '').then((html) => {
          setProcessedChapter(html);
        });
      });
    }
    console.log('html');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Reader Screen</Text>
      {book && <Text>Book: {book.title}</Text>}
      {chapter && <ChapterView bookPath={book?.path ?? ''} filePath={chapter} />}
    </View>
  );
}
