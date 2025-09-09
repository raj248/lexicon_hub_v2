import * as FileSystem from "expo-file-system";
import { SaveFormat, ImageManipulator } from "expo-image-manipulator";
import EpubKit from "./src/EpubKitModule";
import { Content, Metadata } from "./src/EpubKitModule.Types";

export async function scanFiles(): Promise<string[]> {
  return await EpubKit.scanFiles();
}
export async function extractMetadata(filePath: string): Promise<Metadata | null> {
  const metadata: Metadata = await EpubKit.extractMetadata(filePath);
  try {
    if (metadata.coverImage) {
      metadata.coverImage = await saveCoverImage(metadata.coverImage, metadata.title);
    } else {
      metadata.coverImage = "https://placehold.co/200x270";
    }

    metadata.chapters = (metadata.chapters);

    // Rename `creator` to `author`
    if (metadata.creator) {
      metadata.author = metadata.creator;
      delete metadata.creator;
    }

    delete metadata.cover;

    return metadata;
  } catch (e) {
    console.error("File path is: ", filePath);
    console.error("The error is: ", e);
    return null;
  }
}
export async function getChapter(epubFilePath: string, chapterPath: string): Promise<Content | null> {
  try {
    return await EpubKit.getChapter(epubFilePath, chapterPath);
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return null;
  }
}

export async function requestStoragePermission(): Promise<Boolean> {
  return await EpubKit.requestStoragePermission();
}

// 🛠 **Helper Function: Save and Optimize Cover Image**
async function saveCoverImage(base64String: string, title: string): Promise<string> {
  const filename = title.replace(/\s+/g, "_") + ".jpg"; // Sanitize filename
  const path = `${FileSystem.cacheDirectory}${filename}`;

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
      format: SaveFormat.JPEG, // Compress image
    });

    return image.uri; // Return file URI for loading in <Image />
  } catch (error) {
    console.error("Error processing cover image:", error);
    return "";
  }
}
