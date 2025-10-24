import { useEffect } from 'react';
import { Linking } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';

export function useFileIntent() {
  useEffect(() => {
    const handleDeepLink = async (event: any) => {
      try {
        const uri = event?.url;
        if (!uri) return;

        console.log('📩 Received URI:', uri);

        // Create a safe cache folder for shared files
        const cacheDir = `${RNBlobUtil.fs.dirs.CacheDir}/shared`;
        await RNBlobUtil.fs.exists(cacheDir).then((exists) => {
          if (!exists) RNBlobUtil.fs.mkdir(cacheDir);
        });

        // Try to extract a filename
        let filename = uri.split('/').pop() || `shared_${Date.now()}`;
        if (!filename.includes('.')) filename += '.epub'; // fallback

        const dest = `${cacheDir}/${filename}`;

        // Copy the content URI to a real file
        await RNBlobUtil.fs.cp(uri, dest);

        // Get file details
        const stat = await RNBlobUtil.fs.stat(dest);

        console.log('✅ File copied successfully:');
        console.log({
          originalUri: uri,
          destination: dest,
          filename: stat.filename,
          path: stat.path,
          size: stat.size,
          // mime: stat.mime,
          type: stat.type,
          lastModified: stat.lastModified,
        });

        // Now you can open the file or pass `dest` to your EPUB/PDF reader.
      } catch (error) {
        console.error('❌ Failed to process incoming file:', error);
      }
    };

    // Handle the initial deep link (app cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Subscribe for new deep links (when app is open)
    const sub = Linking.addEventListener('url', handleDeepLink);

    return () => sub.remove();
  }, []);
}
