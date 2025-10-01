import { useBookStore } from '~/store/bookStore';
import {
  readFileFromZip,
  RequestStoragePermission,
  saveCoverImage,
  ScanFiles,
  parseOPFFromBook,
  extractCoverImage,
} from '~/modules/FileUtil';
import { parseOPF } from '~/epub-core/parsers/opfParserXml';
import { findOpfPath } from '~/epub-core/parsers/containerParser';

export default async function scanAndAddBooks() {
  try {
    const hasPermission = await RequestStoragePermission();
    if (!hasPermission) {
      console.log('Storage permission denied');
      return;
    }

    const bookPaths = await ScanFiles();
    console.log('Found books:', bookPaths.length);

    const existingBooks = useBookStore.getState().books;
    const existingPaths = new Set(Object.values(existingBooks).map((b) => b.path));

    // Process all books concurrently but safely
    const processBook = async (bookPath: string) => {
      if (existingPaths.has(bookPath)) return null;
      console.log('Processing book:', bookPath);
      try {
        const file = await parseOPFFromBook(bookPath);

        if (!file) {
          console.log('Failed to open book:', bookPath);
          return null;
        }
        const { metadata } = file;

        const newBook = {
          ...metadata,
          path: bookPath,
          addedAt: Date.now(),
          id: metadata.identifier,
          coverImage: metadata.coverImage, // initially may be undefined
        };
        // Immediately add book to store for UI feedback
        useBookStore.getState().addBooks([newBook]);

        // Save cover image asynchronously if exists
        if (newBook.coverImage) {
          const cover = await extractCoverImage(bookPath, newBook.coverImage);
          if (cover) newBook.coverImage = cover;
          // console.log('Cover Image: ', cover);
          useBookStore.getState().updateBook(newBook.id, { coverImage: cover });
          // }
        }

        return newBook;
      } catch (err) {
        console.warn('Error processing book:', bookPath, err);
        return null;
      }
    };

    // Limit concurrency to prevent blocking too many books at once
    const concurrency = 5;
    let index = 0;

    const start = performance.now();
    while (index < bookPaths.length) {
      const batch = bookPaths.slice(index, index + concurrency);
      await Promise.all(batch.map((p) => processBook(p)));
      index += concurrency;
    }
    const end = performance.now();

    console.log('✅ Finished scanning and adding books in ' + (end - start) + 'ms');
  } catch (error) {
    console.error('Error in scanAndAddBooks:', error);
  }
}
