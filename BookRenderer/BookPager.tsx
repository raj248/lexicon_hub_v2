import PagerView from 'react-native-pager-view';
import { useEffect, useRef, useState } from 'react';
import ChapterView from '~/components/RenderChapter';
import { BackHandler, View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';

type BookPagerProps = {
  chapters: string[]; // list of cached XHTML chapter file paths
  initialIndex?: number;
};

export default function BookPager({ chapters, initialIndex = 4 }: BookPagerProps) {
  const [currentPage, setCurrentPage] = useState(initialIndex);
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    if (pagerRef.current) {
      pagerRef.current.setPage(initialIndex); // 👈 jump when prop changes
    }
  }, [initialIndex]);

  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (historyRef.current.length > 1) {
        historyRef.current.pop(); // remove current
        const prev = historyRef.current.pop(); // get previous
        if (prev !== undefined) {
          setCurrentPage(prev);
        }
        return true; // prevent app exit
      }
      return false; // allow default exit
    });

    return () => sub.remove();
  }, []);
  //   console.log('chapters', chapters);
  console.log('initialIndex', initialIndex);
  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialIndex}
        onPageSelected={(e) => {
          const index = e.nativeEvent.position;
          console.log('onPageSelected', index);
          setCurrentPage(index);
          historyRef.current.push(index);
        }}
        offscreenPageLimit={2}
        removeClippedSubviews
        onLayout={(e) => {
          console.log('onLayout', e.nativeEvent.layout);
        }}>
        {chapters.map((filePath, index) => (
          <View key={index} style={{ flex: 1 }}>
            {/* <ChapterView filePath={filePath} /> */}
            {Math.abs(currentPage - index) <= 1 ? ( // lazy load: render only current & neighbors
              <ChapterView filePath={filePath} />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading…</Text>
              </View>
            )}
          </View>
        ))}
      </PagerView>
    </View>
  );
}
