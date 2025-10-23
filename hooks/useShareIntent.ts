import { useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';

export function useFileIntent() {
  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
      async (files: any[]) => {
        for (const file of files) {
          if (file.weblink) {
            try {
              // Create a local path in your app's cache
              const fileName = file.fileName || 'shared-file';
              const localUri = `${FileSystem.cacheDirectory}${fileName}`;

              // Copy the content URI to a local file
              const copied = await FileSystem.copyAsync({
                from: file.weblink,
                to: localUri,
              });

              console.log('Local file path:', localUri);
              // Now you can open it with your EPUB/PDF reader
            } catch (err) {
              console.warn('Failed to copy shared file', file.weblink, err);
            }
          } else {
            console.warn('Received file without weblink:', file);
          }
        }
      },
      (error: any) => console.error(error)
    );

    return () => ReceiveSharingIntent.clearReceivedFiles();
  }, []);
}
