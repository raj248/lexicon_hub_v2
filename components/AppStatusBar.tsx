import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function AppStatusBar() {
  const isDarkColorScheme = useColorScheme() === 'dark';

  return (
    <StatusBar
      key={`root-status-bar-${isDarkColorScheme ? 'dark' : 'light'}`}
      style={isDarkColorScheme ? 'light' : 'dark'}
      animated
      translucent={false}
      backgroundColor={
        isDarkColorScheme
          ? '#0b0220' // zaffre-100 (deep indigo, dark theme bg)
          : '#f72585' // rose (primary brand color)
      }
    />
  );
}
