// import Toast from 'react-native-toast-message';
import { useBookStore } from '~/store/bookStore';

import * as Crypto from 'expo-crypto';
import { RequestStoragePermission, saveCoverImage, ScanFiles } from '~/modules/FileUtil';

import { EPUBHandler } from '~/epub-core';
import { TocEntry } from '~/epub-core/types';

export default async function scanAndAddBooks() {
  try {
    const hasPermission = await RequestStoragePermission();
    if (!hasPermission) {
      // Toast.show({
      //   type: "error",
      //   text1: "Storage permission denied",
      //   text2: "Please enable storage permission in settings",
      // });
      console.log('Storage permission denied');
      return;
    }

    const books = await ScanFiles();
    console.log('Found books:', books.length);

    const existingBooks = useBookStore.getState().books; // Fetch existing books
    const existingPaths = new Set(Object.values(existingBooks).map((book) => book.path)); // Store paths for quick lookup

    const batchSize = 20;
    let batch = [];
    const epub = new EPUBHandler();

    for (const bookPath of books) {
      if (existingPaths.has(bookPath)) continue;
      await epub.loadFile(bookPath, true);

      const metadata = await epub.getMetadata();
      if (!metadata) {
        // Toast.show({
        //   type: "error",
        //   text1: "Failed to open book",
        //   text2: bookPath,
        // });
        continue;
      }
      const id = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        metadata.title + metadata.author
      );
      const toc: TocEntry[] = await epub.getToc();

      const coverImageBase64 = (await epub.getCoverImage()) as string;
      metadata.coverImage = await saveCoverImage(coverImageBase64, metadata.title);

      const newBook = {
        ...metadata,
        path: bookPath,
        addedAt: Date.now(),
        id,
        // chapters: toc,
      };
      batch.push(newBook);

      if (batch.length >= batchSize) {
        useBookStore.getState().addBooks(batch);
        batch = []; // Clear batch
        await new Promise((res) => setTimeout(res, 10)); // Small delay to allow UI updates
      }
    }

    // Add remaining books
    if (batch.length > 0) {
      useBookStore.getState().addBooks(batch);
    }
  } catch (error) {
    console.error('Error in scanAndAddBooks:', error);
  }
}
