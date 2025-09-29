import * as FileSystem from "expo-file-system";
import { clearCacheFolder, extractAndRewriteImages, extractResourceBase64 } from "../utils/resourceUtils";
import { injectStyles } from "../utils/styleUtils";
import { readFileFromZip, readChapterFromZip } from "~/modules/FileUtil";

const CACHE_DIR = `${FileSystem.cacheDirectory}epub_resources/`;

export async function processChapter(zipPath: string, path: string, basePath: string): Promise<string | null> {
  try {
    console.log("Path to chapter: ",path)
    const chapter = await readChapterFromZip(zipPath, path);
    if (!chapter) {
      console.log("Chapter not found.");
      return null;
    }

    // Ensure the cache directory exists
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });

    // Clear the cache folder before extracting new resources
    await clearCacheFolder(CACHE_DIR);

    // Extract resources and update paths in HTML
    const resources = await extractResourceBase64(zipPath, chapter, basePath);

    // Rewrite images in HTML
    let processedHtml = await extractAndRewriteImages(chapter, resources);
    
    // Inject custom CSS
    processedHtml = injectStyles(processedHtml);

    return processedHtml;
  } catch (error) {
    console.error("Error processing chapter:", error);
    return null;
  }
}
