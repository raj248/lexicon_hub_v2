import { Appearance } from 'react-native';
import { usePreferencesStore } from '~/store/preferenceStore';
import { COLORS } from '~/theme/colors';
export function injectStyles(htmlContent: string): string {
  const preferences = usePreferencesStore.getState();

  let colors = preferences.theme == 'dark' ? COLORS.dark : COLORS.light;
  if (preferences.theme == 'system')
    colors = Appearance.getColorScheme() == 'dark' ? COLORS.dark : COLORS.light;
  console.log(preferences.theme);
  return htmlContent.replace(
    '</head>',
    `<style>
      body {
        font-family: 'Arial', sans-serif;
        line-height: ${1.8};
        color: ${colors.foreground};
        background-color: ${colors.background};
        margin: 20px;
        padding: 20px;
        font-size: ${preferences.fontSize}px;
      }
      h1 {
        color: ${colors.foreground};
        text-align: center;
        font-size: ${preferences.fontSize + 7}px;
      }
      p {
        margin: 12px 0;
      }
      .centerp {
        text-align: center;
        font-weight: bold;
      }
      img, audio, video {
        display: block;
        max-width: 100%;
        margin: 10px auto;
      }
      .page-break {
        margin: 0 !important;
        padding: 0 !important;
        display: block;
        line-height: 1;
      }
      .svg_outer {
        margin: 0;
        padding: 0;
      }
      svg {
        display: block;
        max-width: 100%;
        margin: 10px auto;
        overflow: hidden;
        width: 100%;
        height: auto;
      }

    </style></head>`
  );
}
