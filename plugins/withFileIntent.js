const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFileIntent(config) {
  return withAndroidManifest(config, (config) => {
    const mainActivity = config.modResults.manifest.application[0].activity.find(
      (a) => a['$']['android:name'] === '.MainActivity'
    );

    // Add intent filter for EPUB, PDF, ZIP
    mainActivity['intent-filter'] = mainActivity['intent-filter'] || [];
    mainActivity['intent-filter'].push({
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [
        { $: { 'android:scheme': 'content' } },
        { $: { 'android:scheme': 'file' } },
        { $: { 'android:mimeType': 'application/epub+zip' } },
        { $: { 'android:mimeType': 'application/pdf' } },
        { $: { 'android:mimeType': 'application/zip' } },
      ],
    });

    return config;
  });
};
