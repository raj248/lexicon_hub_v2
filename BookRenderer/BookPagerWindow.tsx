import PagerView from 'react-native-pager-view';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { BackHandler, View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import ChapterView from '~/components/RenderChapter';

type BookPagerProps = {
  chapters: string[];
  bookPath: string;
  initialIndex?: number;
  windowSize?: number; // how many chapters visible at a time
};

export default function BookPager({
  bookPath,
  chapters,
  initialIndex = 0,
  windowSize = 10,
}: BookPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const historyRef = useRef<number[]>([initialIndex]);
  const [currentPage, setCurrentPage] = useState(initialIndex);

  // track the start index of current window
  const [windowStart, setWindowStart] = useState(() => {
    const half = Math.floor(windowSize / 2);
    return Math.max(0, initialIndex - half);
  });

  const windowEnd = Math.min(chapters.length, windowStart + windowSize);

  // --- derived chapters in window ---
  const visibleChapters = useMemo(
    () => chapters.slice(windowStart, windowEnd),
    [chapters, windowStart, windowEnd]
  );

  // --- handle initial jump ---
  useEffect(() => {
    if (pagerRef.current && initialIndex !== currentPage) {
      pagerRef.current.setPage(initialIndex - windowStart);
      setCurrentPage(initialIndex);
      historyRef.current.push(initialIndex);
    }
  }, [initialIndex, windowStart]);

  // --- handle back button ---
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (historyRef.current.length > 1) {
        historyRef.current.pop();
        const prev = historyRef.current.pop();
        if (prev !== undefined) {
          setCurrentPage(prev);
          pagerRef.current?.setPage(prev - windowStart);
        }
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [windowStart]);

  // --- handle swipe change ---
  const handlePageSelected = useCallback(
    (e: any) => {
      const indexWithinWindow = e.nativeEvent.position;
      const globalIndex = windowStart + indexWithinWindow;

      if (globalIndex !== currentPage) {
        setCurrentPage(globalIndex);
        historyRef.current.push(globalIndex);

        // adjust window if near edges
        const threshold = 2;
        if (globalIndex >= windowEnd - threshold && windowEnd < chapters.length) {
          setWindowStart((prev) => Math.min(prev + threshold, chapters.length - windowSize));
        } else if (globalIndex <= windowStart + threshold && windowStart > 0) {
          setWindowStart((prev) => Math.max(0, prev - threshold));
        }
      }
    },
    [currentPage, windowStart, windowEnd, chapters.length, windowSize]
  );

  // --- render one page ---
  const renderPage = useCallback(
    (filePath: string, realIndex: number) => (
      <View key={realIndex} style={{ flex: 1 }}>
        <ChapterView bookPath={bookPath} filePath={filePath} />
      </View>
    ),
    [bookPath]
  );

  // --- memoized pages ---
  const pages = useMemo(
    () =>
      visibleChapters.map((filePath, i) => {
        const realIndex = windowStart + i;
        return renderPage(filePath, realIndex);
      }),
    [visibleChapters, renderPage, windowStart]
  );

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        key={windowStart} // force remount when window slides
        initialPage={currentPage - windowStart}
        onPageSelected={handlePageSelected}
        removeClippedSubviews>
        {pages}
      </PagerView>
    </View>
  );
}
