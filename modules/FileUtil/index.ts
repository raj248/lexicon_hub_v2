import FileUtilModule from './src/FileUtilModule';
import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { PermissionsAndroid, Platform } from 'react-native';

export async function ScanFiles(): Promise<string[]> {
  return await FileUtilModule.ScanFiles();
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

export async function saveCoverImage(base64String: string, title: string): Promise<string> {
  const filename = title.replace(/\s+/g, '_') + '.jpg'; // Sanitize filename
  const path = `${FileSystem.documentDirectory}${filename}`;

  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

  try {
    // Write Base64 string to file
    await FileSystem.writeAsStringAsync(path, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const context = ImageManipulator.manipulate(path);

    // Resize and compress image
    const resized = await context.renderAsync();
    const image = await resized.saveAsync({
      compress: 0.1,
      base64: true,
      format: SaveFormat.JPEG, // Compress image
    });
    if (image.base64)
      await FileSystem.writeAsStringAsync(path, image.base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

    console.log('Cover image saved:', path);

    return path; // Return file URI for loading in <Image />
  } catch (error) {
    console.error('Error processing cover image:', error);
    return '';
  }
}

export async function saveCoverImageV2(base64String: string, title: string): Promise<string> {
  try {
    if (!title) {
      console.error('Title is missing in saveCoverV2');
      return '';
    }
    const filename = title.replace(/\s+/g, '_') + '.jpg'; // sanitize filename
    const path = `${FileSystem.documentDirectory}${filename}`;

    // Remove data URI prefix
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

    // Write temporary file
    const tempPath = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(tempPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Resize and compress directly to file
    const manipulated = await ImageManipulator.manipulateAsync(
      tempPath,
      [{ resize: { width: 500 } }], // resize width to 500px
      {
        compress: 0.7, // quality
        format: SaveFormat.JPEG,
        base64: false, // write directly to file
      }
    );

    // Move optimized image to final destination
    await FileSystem.moveAsync({
      from: manipulated.uri,
      to: path,
    });

    console.log('Cover image saved:', path);
    return path;
  } catch (error) {
    console.error('Error processing cover image:', error);
    return '';
  }
}
