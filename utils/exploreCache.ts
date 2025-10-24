import * as FileSystem from 'expo-file-system';

export async function exploreCache(dir: string = FileSystem.cacheDirectory!) {
  try {
    const items = await FileSystem.readDirectoryAsync(dir);
    console.log('Items in', dir, items);

    for (const item of items) {
      const fullPath = dir + item;
      try {
        const isDir = (await FileSystem.getInfoAsync(`file://${fullPath}`)).isDirectory;
        console.log('Item:', fullPath, isDir ? 'directory' : 'file');
        if (isDir) {
          await exploreCache(fullPath); // recurse
        }
      } catch (e) {
        console.warn('Cannot read:', fullPath, e);
      }
    }
  } catch (e) {
    console.error('Error exploring cache:', e);
  }
}

// exploreCache();
