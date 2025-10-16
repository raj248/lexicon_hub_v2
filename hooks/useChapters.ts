import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import * as FileSystem from 'expo-file-system';
import type { OPFData } from '~/epub-core/types';
import { parseOPFFromBook } from '~/modules/FileUtil';

async function fetchChapterHtml(bookPath: string, href: string): Promise<string> {
  const fullPath = `${bookPath}/${href}`;
  return await FileSystem.readAsStringAsync(fullPath);
}

export function useChapters(bookPath: string | null) {
  const [index, setIndex] = useState(0);
  const queryClient = useQueryClient();

  // Parse OPF and extract chapter spine
  const { data: bookData } = useQuery({
    queryKey: ['opf', bookPath],
    queryFn: async () => {
      if (!bookPath) return null;
      return await parseOPFFromBook(bookPath);
    },
    enabled: !!bookPath,
  });

  const chapters = useMemo(() => {
    if (!bookData) return [];
    return bookData.spine.map((ch) => ({
      id: ch.id,
      href: ch.href,
      //   title: ch.title || ch.href.split('/').pop() || 'Untitled',
    }));
  }, [bookData]);

  // Load current chapter HTML
  const { data: html, isLoading } = useQuery({
    queryKey: ['chapter', bookPath, chapters[index]?.href],
    queryFn: async () => {
      if (!bookPath || !chapters[index]) return '';
      return await fetchChapterHtml(bookPath, chapters[index].href);
    },
    enabled: !!bookPath && !!chapters[index],
    staleTime: Infinity,
    // cacheTime: Infinity,
  });

  // Preload next chapter for smooth navigation
  useEffect(() => {
    if (chapters[index + 1]) {
      queryClient.prefetchQuery({
        queryKey: ['chapter', bookPath, chapters[index + 1].href],
        queryFn: () => fetchChapterHtml(bookPath!, chapters[index + 1].href),
      });
    }
  }, [index, chapters]);

  return {
    bookData,
    chapters,
    index,
    setIndex,
    html,
    isLoading,
  };
}
