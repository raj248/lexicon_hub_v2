import { NativeModule, requireNativeModule } from 'expo';
import { OPFData } from '~/epub-core/types';

declare class FileUtilModule extends NativeModule {
  RequestStoragePermission(): Promise<boolean>;
  ScanFiles(): Promise<string[]>;
  readFileFromZip(zipFilePath: string, filePath: string, type: string): Promise<string>;
  readChapterFromZip(zipPath: string, chapterPath: string): Promise<string>;
  parseOPFFromBook(bookPath: string): Promise<OPFData>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<FileUtilModule>('FileUtil');
