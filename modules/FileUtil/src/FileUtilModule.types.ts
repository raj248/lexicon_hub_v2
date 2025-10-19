import type { StyleProp, ViewStyle } from 'react-native';
import { ViewProps } from 'react-native';
export type OnLoadEventPayload = {
  url: string;
};

export type FileUtilModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type FileUtilModuleViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};

export type ChapterListViewProps = {
  chapters: ChapterLink[];
  onChapterPress: (chapter: ChapterLink) => void;
  textColor?: string;
  chapterTitleColor?: number;
} & ViewProps;

export type ChapterLink = {
  id: string;
  href: string;
  title: string;
  isSelected?: string;
};
