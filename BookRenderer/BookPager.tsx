import PagerView from 'react-native-pager-view';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ChapterView from '~/components/RenderChapter';
import { BackHandler, View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';

type BookPagerProps = {
  chapters: string[]; // list of cached XHTML chapter file paths
  bookPath: string; // path to book
  initialIndex?: number;
};

export default function BookPager({ bookPath, chapters, initialIndex = 0 }: BookPagerProps) {
  const [currentPage, setCurrentPage] = useState(initialIndex);
  const pagerRef = useRef<PagerView>(null);
  const historyRef = useRef<number[]>([initialIndex]); // start with initial

  // Jump to initialIndex when prop changes
  useEffect(() => {
    if (pagerRef.current && initialIndex !== currentPage) {
      pagerRef.current.setPage(initialIndex);
      setCurrentPage(initialIndex);
      historyRef.current.push(initialIndex);
    }
  }, [initialIndex]);

  // Handle hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (historyRef.current.length > 1) {
        historyRef.current.pop(); // remove current
        const prev = historyRef.current.pop(); // get previous
        if (prev !== undefined) {
          setCurrentPage(prev);
          pagerRef.current?.setPage(prev);
        }
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  // onPageSelected callback
  const handlePageSelected = useCallback(
    (e: any) => {
      const index = e.nativeEvent.position;
      if (index !== currentPage) {
        setCurrentPage(index);
        historyRef.current.push(index);
      }
    },
    [currentPage]
  );

  // Lazy render chapter pages
  const renderPage = useCallback(
    (filePath: string, index: number) => (
      <View key={index} style={{ flex: 1 }}>
        {Math.abs(currentPage - index) <= 2 ? (
          <ChapterView bookPath={bookPath} filePath={filePath} />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading…</Text>
          </View>
        )}
      </View>
    ),
    [currentPage]
  );

  // Memoize the pages array
  const pages = useMemo(
    () => chapters.map((filePath, index) => renderPage(filePath, index)),
    [chapters, currentPage]
  );

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialIndex}
        removeClippedSubviews
        onPageSelected={handlePageSelected}>
        {pages}
      </PagerView>
    </View>
  );
}
