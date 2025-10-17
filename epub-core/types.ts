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

export type OPFData = {
  metadata: Metadata;
  spine: Spine[];
  baseDir: string;
};
export type TocEntry = {
  title: string; // The title of the chapter
  href: string; // The relative path to the chapter content
};
