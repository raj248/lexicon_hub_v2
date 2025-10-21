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
  ref: React.RefObject<any>;
  chapters: ChapterLink[];
  textColor?: string;
  chapterTitleColor?: number;
  initialIndex?: number;
  onChapterPress: (chapter: ChapterLink) => void;
  /**
   * Updates the selected (highlighted) chapter in the native RecyclerView.
   * @param chapterId The unique string ID of the chapter to select.
   */
  setSelectedChapter?: (chapterId: string) => void;
} & ViewProps;

export type ChapterLink = {
  id: string;
  href: string;
  title: string;
};
