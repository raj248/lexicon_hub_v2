import * as React from 'react';
import { requireNativeViewManager } from 'expo-modules-core';
import type { ChapterListViewProps } from './FileUtilModule.types';

const NativeView: React.ComponentType<ChapterListViewProps> = requireNativeViewManager(
  'FileUtil',
  'ChapterListView'
);

export default function ChapterListView(props: ChapterListViewProps) {
  return <NativeView {...props} />;
}
