export default {
  expo: {
    name: 'Lexicon Hub',
    slug: 'lexicon-hub-v2',
    version: '2.0.0b',
    scheme: 'lexicon-hub-v2',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      './plugins/withFileIntent.js',
      'expo-font',
      [
        'expo-dev-launcher',
        {
          launchMode: 'most-recent',
        },
      ],
      'expo-web-browser',
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.hub.lexicon',
    },
    android: {
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon/foreground.png',
        backgroundImage: './assets/adaptive-icon/background.png',
      },
      permissions: [
        'android.permission.MANAGE_EXTERNAL_STORAGE',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      package: 'com.hub.lexicon',
    },
    extra: {
      router: {},
      eas: {
        projectId: '687ca176-0a73-430b-8bfb-60d2ec3b9b63',
      },
    },
  },
};
