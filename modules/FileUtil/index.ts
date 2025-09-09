import FileUtilModule from './src/FileUtilModule';
import { SaveFormat, ImageManipulator } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { PermissionsAndroid, Platform } from "react-native";

export async function ScanFiles(): Promise<string[]> {
  return await FileUtilModule.ScanFiles();
}

export async function RequestStoragePermission(): Promise<Boolean> {
  return await FileUtilModule.RequestStoragePermission();
}

export async function readFileFromZip(filePath: string, fileName: string, type: "string" | "base64" = "string"): Promise<string> {
  return await FileUtilModule.readFileFromZip(filePath, fileName, type)
  .then((result) => {
    return result;
  })
  .catch((error) => {
    console.error("Error reading file from zip:", error);
    return "";
  });
}

export async function readChapterFromZip(zipPath: string, chapterPath: string) {
  return await FileUtilModule.readChapterFromZip(zipPath, chapterPath)
  .then((result) => {
    return result;
  })
  .catch((error) => {
    console.error("Error reading chapter from zip:", error);
    return "";
  });
}

export async function saveCoverImage(base64String: string, title: string): Promise<string> {
  const filename = title.replace(/\s+/g, "_") + ".jpg"; // Sanitize filename
  const path = `${FileSystem.documentDirectory}${filename}`;

  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

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
    if(image.base64)
    await FileSystem.writeAsStringAsync(path, image.base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("Cover image saved:", path);

    return path; // Return file URI for loading in <Image />
  } catch (error) {
    console.error("Error processing cover image:", error);
    return "";
  }
}
export async function checkFilePermission(): Promise<boolean> {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      return granted;
    }
    return true; // iOS does not require explicit permission for file access
}