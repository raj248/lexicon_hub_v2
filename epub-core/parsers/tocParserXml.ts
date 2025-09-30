import { XMLParser } from 'fast-xml-parser';
import { TocEntry } from '../types';

export async function parseTOC(tocXml: string): Promise<TocEntry[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const parsed = parser.parse(tocXml);

  // Ensure navMap.navPoint is always an array
  const navPointsRaw = parsed?.ncx?.navMap?.navPoint;
  const navPoints = Array.isArray(navPointsRaw) ? navPointsRaw : navPointsRaw ? [navPointsRaw] : [];

  const chapters: TocEntry[] = navPoints.map((navPoint: any) => {
    if (!navPoint) return { id: '', title: '', href: '' };

    const id = navPoint.id || '';

    // navLabel.text can be a string, an array, or missing
    let title = '';
    if (navPoint.navLabel?.text) {
      if (Array.isArray(navPoint.navLabel.text)) {
        title = navPoint.navLabel.text
          .map((t: any) => (typeof t === 'string' ? t : ''))
          .join(' ')
          .trim();
      } else if (typeof navPoint.navLabel.text === 'string') {
        title = navPoint.navLabel.text.trim();
      } else {
        title = '';
      }
    }

    const href = navPoint.content?.src || '';

    return { id, title, href };
  });

  return chapters;
}
