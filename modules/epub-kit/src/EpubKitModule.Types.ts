export type Chapter = {
  title: string;
  paths: string;
};

export type Metadata = {
  title: string;
  author: string;
  creator?: string;
  cover?: string;
  coverImage?: string;
  chapters: string;
  path: string;
};

export type Content = {
  content: string, 
  resources: Record<string, string>
}