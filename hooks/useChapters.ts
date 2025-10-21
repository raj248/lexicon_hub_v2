import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import type { OPFData, TocEntry } from '~/epub-core/types';
import { parseOPFFromBook, parseTOC, prepareChapter } from '~/modules/FileUtil';

async function fetchChapterHtml(bookPath: string, href: string): Promise<string> {
  const filePath = await prepareChapter(bookPath, href);
  return await FileSystem.readAsStringAsync(`file://${filePath}`);
}

export function useChapters(bookPath: string | null) {
  const [index, setIndex] = useState(0);
  const queryClient = useQueryClient();

  // --- 1️⃣ Parse OPF and extract chapter spine
  const { data: bookData } = useQuery<OPFData | null>({
    queryKey: ['opf', bookPath],
    queryFn: async () => {
      if (!bookPath) return null;
      return await parseOPFFromBook(bookPath);
    },
    enabled: !!bookPath,
  });

  // --- 2️⃣ Parse TOC (only once we have bookData)
  const { data: toc = [] } = useQuery<TocEntry[]>({
    queryKey: ['toc', bookPath],
    queryFn: async () => {
      if (!bookPath || !bookData?.metadata.toc) return [];
      return await parseTOC(bookPath, bookData.metadata.toc);
    },
    enabled: !!bookPath && !!bookData?.metadata.toc,
  });

  // --- 3️⃣ Chapters derived from spine
  const chapters = useMemo(() => {
    if (!bookData) return [];
    return bookData.spine.map((ch) => ({
      id: ch.id,
      href: ch.href,
    }));
  }, [bookData]);

  // --- 4️⃣ Build mapping: href → spine index
  const spineHrefToIndex = useMemo(() => {
    if (!bookData) return {};
    return Object.fromEntries(bookData.spine.map((item, i) => [item.href, i]));
  }, [bookData]);

  // --- 5️⃣ Load current chapter HTML
  const { data: html = '', isLoading } = useQuery({
    queryKey: ['chapter', bookPath, chapters[index]?.href],
    queryFn: async () => {
      if (!bookPath || !chapters[index]) return '';
      return await fetchChapterHtml(bookPath, chapters[index].href);
    },
    enabled: !!bookPath && !!chapters[index],
    staleTime: Infinity,
  });

  // --- 6️⃣ Preload next chapter for smoother reading
  useEffect(() => {
    if (chapters[index + 1]) {
      queryClient.prefetchQuery({
        queryKey: ['chapter', bookPath, chapters[index + 1].href],
        queryFn: () => fetchChapterHtml(bookPath!, chapters[index + 1].href),
      });
    }
  }, [index, chapters, queryClient, bookPath]);

  // --- 7️⃣ Optional: merge TOC with spine index
  const tocWithIndex = useMemo(() => {
    if (!toc.length || !bookData) return [];
    return toc.map((t, idx) => ({
      ...t,
      id: bookData.spine.findIndex((s) => s.href === t.href).toString(),
    }));
  }, [toc, bookData]);

  // a 1-d array of index from tocWithIndex with all id
  const allChapterIds = useMemo(() => {
    return tocWithIndex.map((t) => Number(t.id));
  }, [tocWithIndex]);

  //currentSelectedChapter if index in allchapterids, update selected chapter, else dont update
  const currentSelectedChapter = useMemo(() => {
    if (allChapterIds.includes(index)) {
      return Number(tocWithIndex.find((t) => Number(t.id) === index)?.id);
    }
    return 0;
  }, [index, allChapterIds, tocWithIndex]);

  // --- 8️⃣ Navigation helpers
  const nextChapter = useCallback(() => {
    if (index < chapters.length - 1) {
      setIndex((i) => i + 1);
      return true;
    }
    return false;
  }, [index, chapters.length]);

  const prevChapter = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      return true;
    }
    return false;
  }, [index]);

  const goToChapter = useCallback(
    (targetIndex: number) => {
      if (targetIndex >= 0 && targetIndex < chapters.length) {
        setIndex(targetIndex);
        return true;
      }
      return false;
    },
    [chapters.length]
  );

  return {
    bookData,
    chapters,
    toc: tocWithIndex,
    currentSelectedChapter,
    spineHrefToIndex,
    index,
    html,
    isLoading,
    nextChapter,
    prevChapter,
    goToChapter,
  };
}
