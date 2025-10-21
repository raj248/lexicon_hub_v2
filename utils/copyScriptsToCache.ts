// utils/copyScriptsToCache.ts
import * as FileSystem from 'expo-file-system';

/**
 * Defines the structure for a script to be cached.
 */
interface ScriptContent {
  filename: string;
  content: string;
}

/**
 * Writes the content of multiple JS scripts to the cache/scripts directory.
 * Ensures the cache directory exists and overwrites files if they already exist
 * with the new content (or creates them if they don't).
 * * @param scripts An array of ScriptContent objects, each containing the filename and its content.
 * @returns A promise that resolves to an array of cached file paths.
 */
async function copyScriptsToCache(scripts: ScriptContent[]): Promise<string[]> {
  try {
    // 1. Resolve and ensure cache directory
    const cacheDir = `${FileSystem.cacheDirectory}/scripts`;
    const dirExists = await FileSystem.getInfoAsync(cacheDir);
    if (!dirExists.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir);
    }

    const cachedPaths: string[] = [];

    // 2. Write each script content to a file
    for (const script of scripts) {
      // Ensure the filename ends with .js if it's not present for clarity, though not strictly required by FS
      const finalFilename = script.filename.endsWith('.js')
        ? script.filename
        : `${script.filename}.js`;
      const destPath = `${cacheDir}/${finalFilename}`;

      // Use FileSystem.writeAsStringAsync to create or overwrite the file
      await FileSystem.writeAsStringAsync(destPath, script.content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      cachedPaths.push(destPath);
    }

    console.log('✅ Scripts written to cache:', cachedPaths);
    return cachedPaths;
  } catch (err) {
    console.error('❌ Failed to write scripts to cache:', err);
    return [];
  }
}

import { SwipeShiftContent } from '~/BookView/scripts/swipe-shift';
import { ReadingProgressContent } from '~/BookView/scripts/reading-progress';
import { InterceptContent } from '~/BookView/scripts/intercept-clicks';
import { AnnotationContent } from '~/BookView/scripts/annotations';
// ... other scripts

const scriptsToCache = [
  { filename: 'swipe-shift.js', content: SwipeShiftContent },
  { filename: 'reading-progress.js', content: ReadingProgressContent },
  // Add your other scripts here
  { filename: 'intercept-clicks.js', content: InterceptContent },
  { filename: 'annotations.js', content: AnnotationContent },
];

export async function initializeScripts() {
  const paths = await copyScriptsToCache(scriptsToCache);
  console.log('Scripts are ready at:', paths);
}

// initializeScripts();
