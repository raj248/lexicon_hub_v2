import * as React from 'react';
import { requireNativeViewManager } from 'expo-modules-core';
import type { ChapterListViewProps } from './FileUtilModule.types';
import { processColor } from 'react-native';

const NativeView: React.ComponentType<ChapterListViewProps> = requireNativeViewManager(
  'FileUtil',
  'ChapterListView'
);

export default function ChapterListView(props: ChapterListViewProps) {
  const processedColor = props.textColor
    ? (processColor(props.textColor) as number | undefined)
    : undefined;
  return <NativeView {...props} chapterTitleColor={processedColor} />;
}
