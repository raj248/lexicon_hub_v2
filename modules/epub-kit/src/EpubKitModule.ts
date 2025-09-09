import { NativeModule, requireNativeModule } from 'expo';


declare class EpubKitModule extends NativeModule {
  requestStoragePermission(): Promise<boolean>;
  scanFiles(): Promise<string[]>;
  extractMetadata(filePath:string): Promise<any>
  getChapter(epubFilePath: String, chapterPath: String): Promise<any>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<EpubKitModule>('EpubKit');
