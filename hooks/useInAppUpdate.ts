import { useEffect, useState } from 'react';
import { checkForUpdate, UpdateFlow } from 'react-native-in-app-updates';

export function useInAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkUpdate() {
      try {
        const result = await checkForUpdate(UpdateFlow.FLEXIBLE);
        if (result.shouldUpdate) {
          setUpdateAvailable(true);
        }
      } catch (e: any) {
        setError(e);
      }
    }

    checkUpdate();
  }, []);

  return { updateAvailable, error };
}

//   const { updateAvailable } = useInAppUpdate();

//   useEffect(() => {
//     if (updateAvailable) {
//       Alert.alert('Update Available', 'A new version is available. Please update from Play Store.');
//     }
//   }, [updateAvailable]);
