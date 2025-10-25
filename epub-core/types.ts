export type Metadata = {
  title: string;
  language: string;
  date: string;
  author: string;
  identifier: string;
  contributor?: string;
  coverImage?: string;
  toc?: string;
};

export type Spine = {
  id: string;
  href: string;
};

export type ChapterStat = {
  id: string; // chapter id (matches spine item id)
  href: string; // absolute or relative href of the chapter file
  charCount: number; // total characters (including whitespace)
  pageCount: number; // estimated pages for this chapter
};

export type OPFData = {
  metadata: Metadata;
  spine: Spine[];
  baseDir: string;

  // 📘 Newly added fields
  chapterStats: ChapterStat[]; // per-chapter stats
  totalChars: number; // total characters in book
  totalPages: number; // estimated total pages
};

export type TocEntry = {
  title: string; // The title of the chapter
  href: string; // The relative path to the chapter content
};
