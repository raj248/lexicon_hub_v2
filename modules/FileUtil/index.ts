import FileUtilModule from './src/FileUtilModule';
import { PermissionsAndroid, Platform } from 'react-native';
import { OPFData } from '~/epub-core/types';

export async function ScanFiles(): Promise<string[]> {
  return await FileUtilModule.ScanFiles();
}
export async function HasStoragePermission(): Promise<Boolean> {
  return await FileUtilModule.HasStoragePermission();
}
export async function RequestStoragePermission(): Promise<Boolean> {
  return await FileUtilModule.RequestStoragePermission();
}
export async function readFileFromZip(
  filePath: string,
  fileName: string,
  type: 'string' | 'base64' = 'string'
): Promise<string> {
  return await FileUtilModule.readFileFromZip(filePath, fileName, type)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error('Error reading file from zip:', error);
      return '';
    });
}
export async function readChapterFromZip(zipPath: string, chapterPath: string) {
  return await FileUtilModule.readChapterFromZip(zipPath, chapterPath)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error('Error reading chapter from zip:', error);
      return '';
    });
}
export async function checkFilePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    );
    return granted;
  }
  return true;
}
export async function parseOPFFromBook(bookPath: string): Promise<OPFData | null> {
  if (!bookPath) {
    console.warn('No book path provided');
    return null;
  }
  return await FileUtilModule.parseOPFFromBook(bookPath)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error(`Error parsing OPF from ${bookPath}:`, error);
      return null;
    });
}
export async function extractCoverImage(bookPath: string, imagePath: string): Promise<string> {
  return await FileUtilModule.optimizeCoverImage(bookPath, imagePath)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error('Error extracting cover image:', error);
      return '';
    });
}
export async function prepareChapter(bookPath: string, chapterPath: string): Promise<string> {
  return FileUtilModule.prepareChapter(bookPath, chapterPath)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error('Error preparing chapter:', error);
      return '';
    });
}
export async function parseTOC(bookPath: string, tocHref: string): Promise<any[]> {
  return FileUtilModule.parseTOC(bookPath, tocHref)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error('Error parsing TOC:', error);
      return [];
    });
}

export { default as FileUtilView } from './src/FileUtilView';

export { default as ChapterListView } from './src/ChapterListView';
export type { ChapterLink } from './src/FileUtilModule.types';
